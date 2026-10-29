/* Shared audit logic for the tracker page and the deck export (browser and Node).
   Statuses come from the tracker's shared list; findings from the run's results file. */
(function (root) {
  const OPEN = ['High', 'Medium', 'Low'];
  const ACTION = ['High', 'Medium', 'Low', 'Heads-Up'];
  const DAY = 86400000;

  const utcDate = (s) => new Date(String(s).slice(0, 10) + 'T00:00:00Z');
  const addDays = (d, k) => new Date(d.getTime() + k * DAY);
  function addBusinessDays(d, k) {
    let x = new Date(d.getTime()), c = 0;
    while (c < k) { x = addDays(x, 1); const w = x.getUTCDay(); if (w !== 0 && w !== 6) c++; }
    return x;
  }
  // Proposed fix windows from the Priority Rubric: High 2 business days, Medium and Heads-Up by the next review (14 days), Low 30 days.
  const WINDOW = {High: (d) => addBusinessDays(d, 2), Medium: (d) => addDays(d, 14), 'Heads-Up': (d) => addDays(d, 14), Low: (d) => addDays(d, 30)};
  // 'Colorado + Corporate Marketing / Corporate Marketing' -> 'Colorado, Corporate Marketing'
  const owners = (list) => [...new Set(list.filter(Boolean).flatMap((o) => String(o).split(/\s*[\/+]\s*/)).map((o) => o.replace(/\s*\(.*?\)\s*/g, '').trim()).filter(Boolean))].join(', ');
  const fmtDay = (d) => d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});
  const fmtDate = (d) => d.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
  const fmtStamp = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}); };

  function make(rows, statusMap, today) {
    const runDate = rows.length ? rows[0].run_date : null;
    const runStart = runDate ? utcDate(runDate) : null;
    const get = (id) => (statusMap instanceof Map ? statusMap.get(id) : statusMap[id]) || null;
    const actionable = (r) => ACTION.includes(r.priority);
    const statusOf = (r) => {
      if (!actionable(r)) return '';
      const s = get(r.id);
      if (!s || !s.status) return 'Open';
      // A fix marked before this scan ran, for a finding this scan still reports, did not hold.
      if (s.status === 'Fixed' && runStart && new Date(s.at) < runStart) return 'Still failing';
      return s.status;
    };
    const isFixed = (r) => statusOf(r) === 'Fixed';
    const firstSeen = (r) => utcDate(r.first_seen || r.run_date);
    const dueOf = (r) => (actionable(r) && WINDOW[r.priority] ? WINDOW[r.priority](firstSeen(r)) : null);
    const isOverdue = (r) => { const d = dueOf(r); return !!d && !isFixed(r) && today.getTime() > d.getTime() + DAY - 1; };
    return {runDate, statusOf, isFixed, dueOf, isOverdue, actionable, get};
  }

  // Scan-to-scan comparison by Finding ID. prev = previous run's rows, or null for a baseline run.
  function diff(rows, prev, core) {
    if (!prev || !prev.length) return {baseline: true};
    const isOpen = (r) => ACTION.includes(r.priority);
    const cur = new Map(rows.map((r) => [r.id, r]));
    const old = new Map(prev.map((r) => [r.id, r]));
    const added = [], carried = [], resolved = [], regressed = [], stillFailing = [];
    for (const r of rows) {
      if (!isOpen(r)) continue;
      const o = old.get(r.id);
      if (!o || !isOpen(o)) { added.push(r.id); if (o && o.priority === 'No Change') regressed.push(r.id); }
      else { carried.push(r.id); if (core.statusOf(r) === 'Still failing') stillFailing.push(r.id); }
    }
    for (const o of prev) { if (!isOpen(o)) continue; const r = cur.get(o.id); if (!r || !isOpen(r)) resolved.push(o.id); }
    return {baseline: false, prevDate: fmtDate(utcDate(prev[0].run_date)), added: added.length, carried: carried.length,
      resolved: resolved.length, regressed: regressed.length, stillFailing: stillFailing.length,
      sets: {added: new Set(added), carried: new Set(carried), regressed: new Set(regressed)}};
  }

  // Tracker activity: every status change recorded after `since`.
  function activity(rows, statusMap, since) {
    const byId = new Map(rows.map((r) => [r.id, r]));
    const entries = [];
    const iter = statusMap instanceof Map ? statusMap.entries() : Object.entries(statusMap);
    for (const [id, s] of iter) {
      const r = byId.get(id); if (!r) continue;
      for (const h of (s.history || [])) if (h && h.at && new Date(h.at) >= since) entries.push({id, community: r.community, priority: r.priority, status: h.status, note: h.note || '', by: h.by || null, at: h.at});
    }
    entries.sort((a, b) => (a.at < b.at ? 1 : -1));
    return entries;
  }

  // Everything the deck and the summary panels show, for one division / community scope.
  function model(input) {
    const {rows: allRows, cov, pages, status, prev, names = {}, division = 'All', community = 'All', today = new Date()} = input;
    const inScope = (r) => (division === 'All' || r.division === division) && (community === 'All' || r.community === community);
    const rows = allRows.filter(inScope);
    const core = make(allRows, status, today);
    const open = rows.filter((r) => OPEN.includes(r.priority));
    const openLeft = open.filter((r) => !core.isFixed(r));
    const runStart = core.runDate ? utcDate(core.runDate) : today;
    const acts = activity(rows, status, runStart);
    const lastBy = {};
    for (const e of acts) if (!lastBy[e.community]) lastBy[e.community] = e;
    const updatesBy = {};
    for (const e of acts) updatesBy[e.community] = (updatesBy[e.community] || 0) + 1;
    const nameOf = (id) => (id && names[id]) || '';
    const comms = [...new Set(rows.map((r) => r.community))];
    const communities = comms.map((c) => {
      const rs = rows.filter((r) => r.community === c);
      const o = rs.filter((r) => OPEN.includes(r.priority));
      const left = o.filter((r) => !core.isFixed(r));
      const le = lastBy[c];
      return {name: c === 'All Colorado' ? 'Site-wide (all Colorado pages)' : c, key: c,
        high: left.filter((r) => r.priority === 'High').length, open: left.length, fixed: o.length - left.length,
        overdue: rs.filter(core.isOverdue).length, ok: rs.filter((r) => r.priority === 'No Change').length,
        updates: updatesBy[c] || 0,
        lastUpdate: le ? fmtStamp(le.at) + (nameOf(le.by) ? ' · ' + nameOf(le.by) : '') : ''};
    }).filter((c) => c.open + c.fixed + c.ok > 0)
      .sort((a, b) => b.high - a.high || b.open - a.open || a.name.localeCompare(b.name));
    const ps = (pages || []).filter((p) => division === 'All' || p.division === division).filter((p) => community === 'All' || p.community === community);
    const pagesBy = {};
    for (const p of ps) pagesBy[p.community] = (pagesBy[p.community] || 0) + 1;
    const order = {High: 0, Medium: 1, Low: 2, 'Heads-Up': 3};
    const lead = (t) => { const m = String(t || '').match(/^(.+?[.!?])(\s|$)/); return m ? m[1] : String(t || ''); };
    const item = (r) => ({id: r.id, prio: r.priority, lead: lead(r.finding), page_type: r.page_type, community: r.community === 'All Colorado' ? 'Site-wide' : r.community, fix: r.finding,
      check: r.check_label, owner: r.owner, status: core.statusOf(r), due: core.dueOf(r) ? fmtDay(core.dueOf(r)) : '', overdue: core.isOverdue(r)});
    const highs = rows.filter((r) => r.priority === 'High' && !core.isFixed(r)).sort((a, b) => a.community.localeCompare(b.community)).map(item);
    const detail = communities.filter((c) => c.open > 0 || rows.some((r) => r.community === c.key && r.priority === 'Heads-Up' && !core.isFixed(r))).map((c) => {
      const rs = rows.filter((r) => r.community === c.key);
      return Object.assign({}, c, {
        pages: pagesBy[c.key] || 0,
        owners: owners(rs.filter((r) => ACTION.includes(r.priority) && !core.isFixed(r)).map((r) => r.owner)),
        items: rs.filter((r) => ACTION.includes(r.priority) && !core.isFixed(r)).sort((a, b) => order[a.priority] - order[b.priority] || a.check_id.localeCompare(b.check_id)).map(item),
        passing: [...new Set(rs.filter((r) => r.priority === 'No Change').map((r) => r.check))],
        fixedItems: rs.filter((r) => core.isFixed(r)).map((r) => r.finding),
      });
    });
    const d = diff(rows, prev ? prev.filter(inScope) : null, core);
    const progress = rows.filter((r) => ['In progress', 'Needs decision'].includes(core.statusOf(r))).length;
    const silent = communities.filter((c) => c.open > 0 && c.updates === 0).map((c) => c.name);
    const totals = {openHigh: highs.length, open: openLeft.length, fixed: open.length - openLeft.length,
      overdue: rows.filter(core.isOverdue).length, noChange: rows.filter((r) => r.priority === 'No Change').length};
    const top = communities.filter((c) => c.high > 0).slice(0, 3).map((c) => `${c.name} (${c.high})`);
    const takeaways = [
      totals.openHigh ? `${totals.openHigh} High items are open${top.length ? ', most at ' + top.join(', ') : ''}.` : 'No High items are open.',
      `${totals.fixed} of ${open.length} High, Medium and Low items are marked fixed since the scan on ${core.runDate ? fmtDate(utcDate(core.runDate)) : '—'}.`,
      silent.length ? `${silent.length} ${silent.length === 1 ? 'community has' : 'communities have'} open items and no tracker updates yet.` : 'Every community with open items has at least one tracker update.',
      totals.overdue ? `${totals.overdue} items are past their fix window.` : 'Nothing is past its fix window yet.',
      `${totals.noChange} checks already meet the standard.`,
    ];
    const firstSentence = (t) => { const m = String(t || '').match(/^(.+?[.!?])(\s|$)/); return m ? m[1] : String(t || ''); };
    const openNow = (r) => ACTION.includes(r.priority) && !core.isFixed(r);
    // Scorecard, as in the division deck: open items by priority and the share of checks that meet the standard.
    const scored = rows.filter((r) => r.priority === 'No Change' || OPEN.includes(r.priority));
    const scorecard = {
      label: community !== 'All' ? community : (division === 'All' ? 'All divisions' : division),
      communities: comms.filter((c) => c !== 'All Colorado' && !c.startsWith('Colorado (region') && !c.includes(';') && !c.includes('(')).length,
      high: rows.filter((r) => r.priority === 'High' && openNow(r)).length,
      med: rows.filter((r) => r.priority === 'Medium' && openNow(r)).length,
      low: rows.filter((r) => r.priority === 'Low' && openNow(r)).length,
      headsUp: rows.filter((r) => r.priority === 'Heads-Up' && openNow(r)).length,
      checks: new Set(rows.map((r) => r.check_id)).size,
      passRate: scored.length ? Math.round(100 * rows.filter((r) => r.priority === 'No Change').length / scored.length) : 0,
    };
    // High items grouped by check area, with the owners named on those findings.
    const hg = {};
    for (const r of rows.filter((x) => x.priority === 'High' && openNow(x))) (hg[r.area] = hg[r.area] || []).push(r);
    const highGroups = Object.entries(hg).sort((a, b) => b[1].length - a[1].length).map(([area, rs]) => ({
      area, owner: owners(rs.map((r) => r.owner)),
      items: rs.map((r) => ({community: r.community === 'All Colorado' ? 'Site-wide' : r.community, fix: r.finding, lead: firstSentence(r.finding), id: r.id, status: core.statusOf(r)})),
    }));
    // Systemic patterns: the same check open in three or more communities, or logged once for every page.
    const byCheck = {};
    for (const r of rows.filter((x) => OPEN.includes(x.priority) && openNow(x))) (byCheck[r.check_id] = byCheck[r.check_id] || []).push(r);
    const patterns = Object.entries(byCheck).map(([cid, rs]) => ({
      check: rs[0].check_label, count: new Set(rs.map((r) => r.community)).size, siteWide: rs.some((r) => r.community === 'All Colorado'),
      priority: rs.map((r) => r.priority).sort((a, b) => order[a] - order[b])[0], owner: owners(rs.map((r) => r.owner)),
      example: firstSentence(rs[0].finding),
    })).filter((p) => p.count >= 3 || p.siteWide).sort((a, b) => b.count - a.count || order[a.priority] - order[b.priority]).slice(0, 6);
    const clean = communities.filter((c) => c.open === 0 && !rows.some((r) => r.community === c.key && r.priority === 'Heads-Up' && openNow(r))).map((c) => c.name);
    const runD = core.runDate ? utcDate(core.runDate) : null;
    return {
      scopeLabel: community !== 'All' ? community : (division === 'All' ? 'All Divisions' : division),
      runLabel: core.runDate ? `Scan of ${fmtDate(runD)}` : 'Scan',
      runDate: core.runDate ? fmtDate(runD) : '—',
      nextRun: runD ? fmtDate(addDays(runD, 14)) : '',
      asOf: fmtDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))),
      pages: ps.length, totals, takeaways, diff: d,
      activity: {updates: acts.length, fixed: acts.filter((e) => e.status === 'Fixed').length, progress, silent, recent: acts.slice(0, 15)},
      communities, highs, detail,
      coverage: (cov || []).filter((r) => r.ran !== 'Yes'),
      checked: (cov || []).filter((r) => r.ran !== 'No'),
      scorecard, highGroups, patterns, clean,
    };
  }

  const api = {owners, OPEN, ACTION, make, diff, activity, model, fmtDay, fmtDate, fmtStamp, utcDate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AuditCore = api;
})(typeof window !== 'undefined' ? window : this);
