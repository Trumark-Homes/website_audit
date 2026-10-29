/* Division Website Audit deck. Shared by the tracker page (browser) and a Node test run.
   build(PptxGenJS, model) -> PptxGenJS presentation. Layout follows the
   "Division Website Audit" deck: solid teal title, white content slides, Montserrat + Lato,
   priority badges, one slide per neighborhood with "Fix this" and "Already good". */
(function (root) {
  const C = {
    ink: '024758', text: '313131', muted: '576670', panel: 'EFEFF0', line: 'D9DEE0', white: 'FFFFFF',
    orange: 'EA7600', teal: '00938F',
    High: 'EA7600', Medium: 'E5C91A', Low: '557B85', 'Heads-Up': '6E5FA6',
  };
  const BADGE_TEXT = {High: C.white, Medium: C.ink, Low: C.white, 'Heads-Up': C.white};
  const BADGE = {High: 'HIGH', Medium: 'MED', Low: 'LOW', 'Heads-Up': 'HEADS-UP'};
  const LEGEND = [
    ['High', 'Fix within 2 business days. Accuracy or compliance risk, or it costs leads.'],
    ['Medium', 'Fix by the next review (14 days). The page works but underperforms.'],
    ['Low', 'Batch within 30 days. Polish and search.'],
    ['Heads-Up', 'Look at by the next review. Needs a decision or a second look, not a page edit.'],
  ];
  // Checks whose standard is still an open question. Shown so nobody fixes toward an unapproved rule.
  const PENDING = {
    'MED-07': 'Caption standard ("Image Type" vs. "Image Title") is still an open question.',
    'OPT-06': 'Sticky-bar length range is proposed, not approved; this flags every bar.',
    'CPY-06': 'Filler phrase list is not approved yet.',
  };
  const H = 'Montserrat', B = 'Lato';
  const cut = (s, n) => { s = String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
  const num = (x) => Number(x || 0).toLocaleString('en-US');
  const chunk = (arr, k) => { const o = []; for (let i = 0; i < arr.length; i += k) o.push(arr.slice(i, i + k)); return o; };
  const plural = (k, one, many) => `${num(k)} ${k === 1 ? one : (many || one + 's')}`;

  function build(PptxGenJS, m) {
    const p = new PptxGenJS();
    p.layout = 'LAYOUT_WIDE';
    p.author = 'Trumark Homes · Corporate Marketing';
    p.company = 'Trumark Homes';
    p.title = `Division Website Audit — ${m.scopeLabel} — ${m.runDate}`;
    const foot = `Division Website Audit · ${m.scopeLabel} · Scan of ${m.runDate} · Status as of ${m.asOf}`;

    const slide = (title, sub, opts = {}) => {
      const s = p.addSlide();
      s.background = {color: C.white};
      s.addText(title, {x: 0.7, y: opts.small ? 0.38 : 0.4, w: opts.titleW || 11.9, h: 0.55, fontFace: H, fontSize: opts.small ? 24 : 28, bold: true, color: C.ink, margin: 0, fit: 'shrink'});
      if (sub) s.addText(sub, {x: 0.7, y: opts.small ? 0.92 : 0.98, w: opts.titleW || 11.9, h: 0.35, fontFace: B, fontSize: opts.small ? 11.5 : 12, color: C.muted, margin: 0});
      s.addText(foot, {x: 0.7, y: 7.05, w: 11.9, h: 0.25, fontFace: B, fontSize: 8.5, color: '8A969C', margin: 0});
      return s;
    };
    const badge = (s, x, y, prio, w = 0.78) => {
      const fill = C[prio] || C.Low;
      s.addText(BADGE[prio] || prio, {x, y, w, h: 0.26, fill: {color: fill}, line: {color: fill}, fontFace: H, fontSize: 8, bold: true,
        color: BADGE_TEXT[prio] || C.white, align: 'center', valign: 'middle', margin: 0});
    };
    const panel = (s, x, y, w, h) => s.addShape(p.ShapeType.rect, {x, y, w, h, fill: {color: C.panel}, line: {color: C.panel}});
    const bullets = (s, items, o) => {
      if (!items.length) return;
      s.addText(items.map((t, i) => ({text: t, options: {bullet: {indent: 12}, breakLine: i < items.length - 1}})),
        Object.assign({fontFace: B, fontSize: 10.5, color: C.text, valign: 'top', margin: 0, paraSpaceAfter: 3}, o));
    };
    const statNums = (s, stats) => stats.forEach(([v, label, color], i) => {
      const x = 9.35 + i * 1.32;
      s.addText(String(v), {x, y: 0.42, w: 1.2, h: 0.42, fontFace: H, fontSize: 21, bold: true, color, align: 'center', margin: 0});
      s.addText(label, {x: x - 0.05, y: 0.86, w: 1.3, h: 0.3, fontFace: B, fontSize: 9.5, color: C.muted, align: 'center', margin: 0});
    });

    // 1. Title
    {
      const s = p.addSlide();
      s.background = {color: C.ink};
      s.addText('Division Website Audit', {x: 0.7, y: 2.3, w: 10, h: 0.9, fontFace: H, fontSize: 40, bold: true, color: C.white, margin: 0});
      s.addText(m.scopeLabel, {x: 0.7, y: 3.2, w: 10, h: 0.6, fontFace: H, fontSize: 26, color: C.orange, margin: 0});
      s.addText(`Scan of ${m.runDate}   ·   Pilot run 2   ·   Status as of ${m.asOf}`, {x: 0.7, y: 3.95, w: 11, h: 0.4, fontFace: B, fontSize: 14, color: C.panel, margin: 0});
      s.addText('Specialists: skip to your neighborhood\'s slide. Everything to fix is listed there, in priority order. Mark items fixed in the Website Audit Tracker so the next report shows the progress.',
        {x: 0.7, y: 4.7, w: 10.5, h: 0.8, fontFace: B, fontSize: 13, color: C.panel, margin: 0, valign: 'top'});
    }

    // 2. Scorecard
    {
      const sc = m.scorecard;
      const s = slide('Division Scorecard', 'Open items by priority, as of today. Meets standard = share of checks that ran and found nothing to fix.');
      const hdr = (t) => ({text: t, options: {bold: true, color: C.white, fill: {color: C.ink}, fontFace: H, fontSize: 11, align: 'center'}});
      const cell = (t, fill, color) => ({text: String(t), options: {fontFace: H, fontSize: 14, bold: true, align: 'center', fill: {color: fill || C.white}, color: color || C.text}});
      const trend = m.diff.baseline ? 'Baseline (first full run)' : `${m.diff.added} new · ${m.diff.resolved} cleared`;
      s.addTable([
        ['Division', 'Neighborhoods', 'High', 'Medium', 'Low', 'Heads-Up', 'Meets standard', 'vs last run'].map(hdr),
        [cell(sc.label), cell(sc.communities), cell(sc.high, C.High, C.white), cell(sc.med, C.Medium, C.ink), cell(sc.low, C.Low, C.white),
          cell(sc.headsUp, C['Heads-Up'], C.white), cell(sc.passRate + '%'), {text: trend, options: {fontFace: B, fontSize: 11, align: 'center', color: C.muted}}],
      ], {x: 0.7, y: 1.65, w: 11.9, colW: [1.9, 1.5, 1.05, 1.05, 1.05, 1.15, 1.6, 2.5], rowH: [0.4, 0.55], border: {type: 'solid', pt: 0.75, color: C.line}, valign: 'middle'});
      const openN = sc.high + sc.med + sc.low + sc.headsUp;
      s.addText(`${num(openN)} open items across ${num(sc.checks)} checks · ${num(m.totals.fixed)} marked fixed · ${num(m.totals.overdue)} past their fix window`,
        {x: 0.7, y: 2.95, w: 11.9, h: 0.4, fontFace: H, fontSize: 15, bold: true, color: C.ink, margin: 0});
      s.addText('Fix windows (proposed, pending approval)', {x: 0.7, y: 3.5, w: 6.4, h: 0.3, fontFace: H, fontSize: 11, bold: true, color: C.muted, margin: 0});
      LEGEND.forEach(([pr, t], i) => {
        const y = 3.95 + i * 0.5;
        badge(s, 0.7, y, pr);
        s.addText(t, {x: 1.65, y: y - 0.06, w: 5.5, h: 0.4, fontFace: B, fontSize: 11.5, color: C.text, margin: 0, valign: 'middle'});
      });
      panel(s, 7.5, 3.45, 5.1, 3.3);
      s.addText('Not available this run', {x: 7.75, y: 3.6, w: 4.6, h: 0.35, fontFace: H, fontSize: 13, bold: true, color: C.ink, margin: 0});
      const na = [];
      if (m.diff.baseline) na.push('Run-over-run trend: this is the first full run, so it sets the baseline');
      for (const r of m.coverage.slice(0, 7)) na.push(`${r.area} (${r.checks})`);
      if (m.coverage.length > 7) na.push(`+ ${m.coverage.length - 7} more on Method and Limits`);
      bullets(s, na, {x: 7.75, y: 4.02, w: 4.65, h: 2.6, fontSize: 10.5});
    }

    // 3. What changed
    {
      const s = slide('What Changed', 'Two views: what the scan found compared with the last scan, and what teams have done in the tracker since.');
      panel(s, 0.7, 1.55, 5.7, 3.9);
      s.addText('Since the last scan', {x: 0.95, y: 1.7, w: 5.2, h: 0.35, fontFace: H, fontSize: 14, bold: true, color: C.ink, margin: 0});
      if (m.diff.baseline) {
        s.addText([
          {text: 'No comparison yet.', options: {bold: true, breakLine: true}},
          {text: `The ${m.runDate} scan is the first full run against Criteria Library v2, so it is the baseline. From the next scan (planned ${m.nextRun}) this panel shows:`},
        ], {x: 0.95, y: 2.15, w: 5.2, h: 1.2, fontFace: B, fontSize: 11.5, color: C.text, margin: 0, valign: 'top', paraSpaceAfter: 4});
        bullets(s, ['New: found for the first time', 'Cleared: no longer found', 'Carried over: still open from the last scan', 'Came back: met the standard last time, failing now', 'Still failing: marked fixed, but the scan still finds it'],
          {x: 0.95, y: 3.4, w: 5.2, h: 1.9, fontSize: 11});
      } else {
        const d = m.diff;
        const rowsD = [['New', d.added], ['Cleared', d.resolved], ['Carried over', d.carried], ['Came back', d.regressed], ['Still failing (marked fixed, still found)', d.stillFailing]];
        s.addText(`Compared with the scan of ${d.prevDate}`, {x: 0.95, y: 2.1, w: 5.2, h: 0.3, fontFace: B, fontSize: 11, color: C.muted, margin: 0});
        rowsD.forEach(([l, v], i) => {
          const y = 2.55 + i * 0.52;
          s.addText(num(v), {x: 0.95, y, w: 0.9, h: 0.42, fontFace: H, fontSize: 20, bold: true, color: i === 4 && v ? C.orange : C.ink, margin: 0});
          s.addText(l, {x: 1.9, y, w: 4.3, h: 0.42, fontFace: B, fontSize: 12, color: C.text, margin: 0, valign: 'middle'});
        });
      }
      panel(s, 6.9, 1.55, 5.7, 3.9);
      s.addText('Since the scan · tracker activity', {x: 7.15, y: 1.7, w: 5.2, h: 0.35, fontFace: H, fontSize: 14, bold: true, color: C.ink, margin: 0});
      const a = m.activity;
      const stats = [[a.updates, 'status updates'], [a.fixed, 'marked fixed'], [a.progress, 'in progress or needs decision'], [m.totals.overdue, 'past fix window']];
      stats.forEach(([v, l], i) => {
        const x = 7.15 + (i % 2) * 2.7, y = 2.2 + Math.floor(i / 2) * 1.05;
        s.addText(num(v), {x, y, w: 2.5, h: 0.5, fontFace: H, fontSize: 26, bold: true, color: i === 3 && v ? C.orange : C.teal, margin: 0});
        s.addText(l, {x, y: y + 0.5, w: 2.5, h: 0.3, fontFace: B, fontSize: 11, color: C.muted, margin: 0});
      });
      const last = a.recent[0];
      s.addText(last ? `Latest update: ${last.id} → ${last.status}, ${new Date(last.at).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}` : 'No updates yet.',
        {x: 7.15, y: 4.45, w: 5.2, h: 0.7, fontFace: B, fontSize: 11, italic: true, color: C.muted, margin: 0, valign: 'top'});
      const sil = a.silent;
      s.addText([
        {text: `No updates yet (${sil.length}): `, options: {bold: true, color: sil.length ? C.orange : C.teal}},
        {text: sil.length ? cut(sil.join(', '), 330) : 'every neighborhood with open items has at least one update.', options: {color: C.text}},
      ], {x: 0.7, y: 5.65, w: 11.9, h: 0.8, fontFace: B, fontSize: 11.5, margin: 0, valign: 'top'});
      s.addText('Scans run every two weeks. Tracker activity is live, so this slide reflects the day the deck was exported.',
        {x: 0.7, y: 6.5, w: 11.9, h: 0.3, fontFace: B, fontSize: 10, italic: true, color: C.muted, margin: 0});
    }

    // 4. Accountability by neighborhood
    {
      const hdr = (t) => ({text: t, options: {bold: true, color: C.white, fill: {color: C.ink}, fontFace: H, fontSize: 10.5}});
      chunk(m.communities, 12).forEach((grp, i) => {
        const s = slide(`Progress by Neighborhood${i ? '  (continued)' : ''}`, 'Open counts High, Medium and Low. Updates = tracker status changes since the scan.');
        const body = grp.map((c) => [
          {text: c.name}, {text: String(c.high), options: {align: 'center', bold: !!c.high, color: c.high ? C.orange : C.text}},
          {text: String(c.open), options: {align: 'center'}}, {text: String(c.fixed), options: {align: 'center', color: c.fixed ? C.teal : C.text}},
          {text: String(c.overdue), options: {align: 'center', color: c.overdue ? C.orange : C.text, bold: !!c.overdue}},
          {text: String(c.updates), options: {align: 'center'}},
          {text: c.lastUpdate || (c.open ? 'No updates yet' : '—'), options: {color: c.lastUpdate ? C.text : (c.open ? C.orange : C.muted)}},
        ]);
        s.addTable([['Neighborhood', 'High', 'Open', 'Fixed', 'Overdue', 'Updates', 'Last update'].map(hdr), ...body],
          {x: 0.7, y: 1.5, w: 11.9, colW: [3.9, 0.95, 0.95, 0.95, 1.05, 1.05, 3.05], rowH: 0.38, fontFace: B, fontSize: 11, color: C.text,
            border: {type: 'solid', pt: 0.5, color: C.line}, valign: 'middle', autoPage: false});
      });
    }

    // 5. High items, grouped by area
    {
      const lines = [];
      for (const g of m.highGroups) { lines.push({group: g}); for (const it of g.items) lines.push({item: it}); }
      const pages = [];
      let cur = [], h = 0;
      for (const l of lines) {
        const need = l.group ? 0.48 : 0.44;
        if (cur.length && (h + need > 5.3 || (l.group && h + need + 0.44 > 5.3))) { pages.push(cur); cur = []; h = 0; }
        cur.push(l); h += need;
      }
      if (cur.length) pages.push(cur);
      if (!pages.length) {
        const s = slide('High — Fix Within 2 Business Days', 'Accuracy or compliance risk, or it costs leads.');
        s.addText('No High items are open.', {x: 0.7, y: 1.7, w: 11, h: 0.4, fontFace: H, fontSize: 15, bold: true, color: C.teal, margin: 0});
      }
      pages.forEach((pg, i) => {
        const s = slide(`High — Fix Within 2 Business Days${i ? '  (continued)' : ''}`, 'Accuracy or compliance risk, or it costs leads. Proposed fix window, pending approval.');
        let y = 1.5;
        for (const l of pg) {
          if (l.group) {
            s.addText(l.group.area, {x: 0.7, y, w: 7, h: 0.32, fontFace: H, fontSize: 13, bold: true, color: C.ink, margin: 0});
            s.addText(`Owner: ${l.group.owner}`, {x: 7.7, y, w: 4.9, h: 0.32, fontFace: B, fontSize: 10.5, color: C.muted, align: 'right', margin: 0});
            y += 0.48;
          } else {
            const it = l.item;
            badge(s, 0.7, y + 0.03, 'High');
            s.addText(it.community, {x: 1.65, y, w: 2.45, h: 0.36, fontFace: B, fontSize: 11, bold: true, color: C.text, margin: 0, valign: 'top'});
            s.addText(cut(it.lead, 125) + (it.status && it.status !== 'Open' ? `  [${it.status}]` : ''), {x: 4.15, y, w: 8.45, h: 0.38, fontFace: B, fontSize: 11, color: C.text, margin: 0, valign: 'top'});
            y += 0.44;
          }
        }
      });
    }

    // 6. One slide (or more) per neighborhood
    for (const c of m.detail) {
      const main = c.items.filter((it) => it.prio !== 'Low');
      const lows = c.items.filter((it) => it.prio === 'Low');
      const sub = `${c.pages ? plural(c.pages, 'page') + ' scanned   ·   ' : ''}Owner: ${c.owners || '—'}`;
      const stats = [[c.pages || '—', 'pages scanned', C.teal], [c.fixed, 'marked fixed', C.teal], [c.open, c.open === 1 ? 'open item' : 'open items', C.orange]];
      const lineFor = (it) => [it.page_type, it.check, it.due ? `due ${it.due}${it.overdue ? ' (overdue)' : ''}` : '', it.status !== 'Open' ? it.status : ''].filter(Boolean).join('   ·   ');
      const groups = chunk(main, 6);
      if (!groups.length) groups.push([]);
      let n = 0;
      groups.forEach((grp, gi) => {
        const s = slide(c.name + (gi ? '  (continued)' : ''), sub, {small: true, titleW: 8.4});
        statNums(s, stats);
        s.addText(gi ? 'Fix this, continued' : 'Fix this', {x: 0.7, y: 1.5, w: 8, h: 0.35, fontFace: H, fontSize: 15, bold: true, color: C.ink, margin: 0});
        if (!grp.length) s.addText('No High, Medium or Heads-Up items. Low items are on the next slide.', {x: 0.7, y: 1.98, w: 8, h: 0.3, fontFace: B, fontSize: 12, color: C.teal, margin: 0});
        grp.forEach((it, i) => {
          const y = 1.98 + i * 0.8;
          n += 1;
          badge(s, 0.7, y + 0.02, it.prio);
          s.addText(`${n}.  ${cut(it.lead, 92)}`, {x: 1.65, y, w: 7.2, h: 0.42, valign: 'top', fontFace: B, fontSize: 12, bold: true, color: C.text, margin: 0, fit: 'shrink'});
          s.addText(cut(lineFor(it), 120), {x: 1.65, y: y + 0.44, w: 7.1, h: 0.28, fontFace: B, fontSize: 10.5, color: it.overdue ? C.orange : C.muted, margin: 0});
        });
        if (gi === 0) {
          panel(s, 9.0, 1.5, 3.6, 4.9);
          s.addText('Already good', {x: 9.2, y: 1.62, w: 3.2, h: 0.32, fontFace: H, fontSize: 13, bold: true, color: C.teal, margin: 0});
          const shown = c.passing.slice(0, 11).map((t) => cut(t, 42));
          bullets(s, shown, {x: 9.2, y: 2.02, w: 3.25, h: 3.95, fontSize: 10.5});
          if (c.passing.length > shown.length) s.addText(`+ ${c.passing.length - shown.length} more passing`, {x: 9.2, y: 6.0, w: 3.2, h: 0.3, fontFace: B, fontSize: 10, italic: true, color: C.muted, margin: 0});
          if (!c.passing.length) s.addText('Nothing in this scope passed a check yet.', {x: 9.2, y: 2.02, w: 3.2, h: 0.5, fontFace: B, fontSize: 10.5, color: C.muted, margin: 0});
        }
      });
      // Low items: batched on one slide in two columns.
      if (lows.length) {
        const s = slide(`${c.name}  (batch these)`, `Low items: batch within 30 days   ·   ${sub}`, {small: true, titleW: 8.4});
        statNums(s, stats);
        s.addText('Batch these', {x: 0.7, y: 1.5, w: 8, h: 0.35, fontFace: H, fontSize: 15, bold: true, color: C.ink, margin: 0});
        const half = Math.ceil(Math.min(lows.length, 16) / 2);
        lows.slice(0, 16).forEach((it, i) => {
          const col = i < half ? 0 : 1, row = col ? i - half : i;
          const x = 0.7 + col * 6.05, y = 1.98 + row * 0.6;
          n += 1;
          badge(s, x, y + 0.02, 'Low', 0.6);
          const note = PENDING[(it.check || '').slice(0, 6)];
          s.addText(`${n}.  ${cut(it.lead, 70)}`, {x: x + 0.72, y, w: 5.2, h: 0.28, fontFace: B, fontSize: 10.5, bold: true, color: C.text, margin: 0, fit: 'shrink'});
          s.addText(cut(note ? `On hold: ${note}` : `${it.page_type} · ${it.check}`, 88), {x: x + 0.72, y: y + 0.28, w: 5.15, h: 0.25, fontFace: B, fontSize: 9.5, color: note ? C.orange : C.muted, margin: 0});
        });
        if (lows.length > 16) s.addText(`+ ${lows.length - 16} more Low items in the tracker`, {x: 0.7, y: 6.6, w: 11, h: 0.3, fontFace: B, fontSize: 10.5, italic: true, color: C.muted, margin: 0});
      }
    }

    // 7. No open items
    if (m.clean.length) {
      const s = slide('No Open Items', `${plural(m.clean.length, 'neighborhood')} passed every check that ran, or every item is marked fixed.`);
      m.clean.slice(0, 24).forEach((name, i) => {
        const x = 0.7 + (i % 3) * 4.0, y = 1.6 + Math.floor(i / 3) * 0.6;
        s.addText('OK', {x, y, w: 0.5, h: 0.3, fill: {color: C.teal}, fontFace: H, fontSize: 9, bold: true, color: C.white, align: 'center', valign: 'middle', margin: 0});
        s.addText(name, {x: x + 0.62, y, w: 3.3, h: 0.3, fontFace: B, fontSize: 12, color: C.text, margin: 0, valign: 'middle'});
      });
    }

    // 8. Systemic patterns
    if (m.patterns.length) {
      const s = slide('Systemic Patterns', 'Same fix, many pages. These are template, process or training issues more than page issues.');
      m.patterns.slice(0, 6).forEach((pt, i) => {
        const x = 0.7 + (i % 2) * 6.05, y = 1.55 + Math.floor(i / 2) * 1.75;
        panel(s, x, y, 5.85, 1.6);
        s.addShape(p.ShapeType.rect, {x, y, w: 0.09, h: 1.6, fill: {color: C[pt.priority] || C.Low}, line: {color: C[pt.priority] || C.Low}});
        s.addText(cut(pt.check, 60), {x: x + 0.3, y: y + 0.12, w: 4.3, h: 0.3, fontFace: H, fontSize: 12.5, bold: true, color: C.ink, margin: 0});
        badge(s, x + 4.85, y + 0.14, pt.priority, 0.82);
        s.addText(`${pt.siteWide ? 'Site-wide, plus ' : ''}${plural(pt.count, 'neighborhood')}. For example: ${cut(pt.example, 120)}`, {x: x + 0.3, y: y + 0.48, w: 5.35, h: 0.6, fontFace: B, fontSize: 10.5, color: C.text, margin: 0, valign: 'top'});
        const note = PENDING[pt.check.slice(0, 6)];
        s.addText(note ? `On hold: ${note}` : `Owner: ${pt.owner || '—'}. One template change or team brief would clear most of these.`,
          {x: x + 0.3, y: y + 1.1, w: 5.35, h: 0.42, fontFace: B, fontSize: 10, italic: true, color: note ? C.orange : C.muted, margin: 0, valign: 'top'});
      });
    }

    // 9. Method and limits
    {
      const s = slide('Method and Limits', 'What this scan covered, and what it did not. Items not checked are not counted in Meets standard.');
      s.addText('Checked', {x: 0.7, y: 1.5, w: 5.6, h: 0.35, fontFace: H, fontSize: 14, bold: true, color: C.teal, margin: 0});
      bullets(s, m.checked.map((r) => `${r.area}${r.status && r.status !== 'Ran' ? ' — ' + r.status.toLowerCase() : ''}`).slice(0, 15), {x: 0.7, y: 1.95, w: 5.6, h: 4.2, fontSize: 10.5});
      s.addText('Not checked', {x: 6.9, y: 1.5, w: 5.7, h: 0.35, fontFace: H, fontSize: 14, bold: true, color: C.orange, margin: 0});
      bullets(s, m.coverage.map((r) => `${r.area} (${r.checks})`).slice(0, 15), {x: 6.9, y: 1.95, w: 5.7, h: 4.2, fontSize: 10.5});
      s.addText(`${plural(m.pages, 'page')} scanned read-only on ${m.runDate}. No forms were submitted. Every High is backed by a quote or screenshot in the results workbook. Fix windows, the hours format, caption wording, rich-data fields and the filler phrase list are still open questions.`,
        {x: 0.7, y: 6.2, w: 11.9, h: 0.7, fontFace: B, fontSize: 10.5, italic: true, color: C.muted, margin: 0, valign: 'top'});
    }
    return p;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = build;
  else root.buildAuditDeck = build;
})(typeof window !== 'undefined' ? window : this);
