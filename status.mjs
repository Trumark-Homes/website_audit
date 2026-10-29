// Website Audit Tracker: shared fix statuses, stored in Netlify Blobs.
//   GET  /api/status  -> { canWrite, statuses: { <findingId>: {status, note, by, at, history[]} } }
//   POST /api/status  -> saves one status. Needs the team passcode in the x-edit-passcode header.
// Set EDIT_PASSCODE in Netlify: Site configuration > Environment variables.
import { getStore } from '@netlify/blobs';

const STATUSES = ['Open', 'In progress', 'Fixed', 'Needs decision'];
const ID_RE = /^[A-Za-z0-9-]{3,60}$/;
const HISTORY_MAX = 20;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

function passcodeOk(req) {
  const expected = process.env.EDIT_PASSCODE || '';
  const given = req.headers.get('x-edit-passcode') || '';
  if (!expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ given.charCodeAt(i);
  return diff === 0;
}

export default async (req) => {
  const store = getStore({ name: 'audit-status', consistency: 'strong' });

  if (req.method === 'GET') {
    const { blobs } = await store.list();
    const entries = await Promise.all(blobs.map(async (b) => [b.key, await store.get(b.key, { type: 'json' })]));
    const statuses = Object.fromEntries(entries.filter(([, v]) => v));
    return json({ canWrite: passcodeOk(req), statuses });
  }

  if (req.method === 'POST') {
    if (!passcodeOk(req)) return json({ error: 'passcode' }, 401);
    let body;
    try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
    const id = String(body.id || '');
    const status = String(body.status || '');
    const by = String(body.by || '').trim().slice(0, 80);
    if (!ID_RE.test(id) || !STATUSES.includes(status) || !by) return json({ error: 'invalid' }, 400);
    const prev = (await store.get(id, { type: 'json' })) || {};
    const note = body.note == null ? (prev.note || '') : String(body.note).slice(0, 600);
    const at = new Date().toISOString();
    const entry = { status, note: body.note == null ? '' : note, by, at };
    const doc = { status, note, by, at, history: [entry, ...(prev.history || [])].slice(0, HISTORY_MAX) };
    await store.setJSON(id, doc);
    return json(doc);
  }

  return json({ error: 'method' }, 405);
};

export const config = { path: '/api/status' };
