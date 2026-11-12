(function () {
  const { h } = SAQ;
  const DG = (SAQ.dg = {});
  SAQ.diagrams = {};
  SAQ.addDg = (name, d) => { SAQ.diagrams[name] = Object.assign({ name }, d); };
  const CIR = '①②③④⑤⑥⑦⑧⑨⑩';
  DG.CIR = CIR;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fx = n => Math.round(n * 10) / 10;
  let uidN = 0;

  function wrap(t, n) {
    const out = [];
    let cur = '';
    String(t).split(/\s+/).forEach(w => {
      if (cur && (cur + ' ' + w).length > n) { out.push(cur); cur = w; } else cur = (cur ? cur + ' ' : '') + w;
    });
    if (cur) out.push(cur);
    return out;
  }
  function txt(x, y, lines, cls, lh) {
    lh = lh || 13;
    const y0 = y - ((lines.length - 1) * lh) / 2;
    return '<text class="' + cls + '" x="' + fx(x) + '" y="' + fx(y0) + '" text-anchor="middle" dominant-baseline="central">' +
      lines.map((l, i) => '<tspan x="' + fx(x) + '" dy="' + (i ? lh : 0) + '">' + esc(l) + '</tspan>').join('') + '</text>';
  }
  function lblAt(x, y, lines) {
    const y0 = y - (lines.length - 1) * 13;
    return '<text class="dg-lbl" x="' + fx(x) + '" y="' + fx(y0) + '" text-anchor="end">' + lines.map((l, i) => '<tspan x="' + fx(x) + '" dy="' + (i ? 13 : 0) + '">' + esc(l) + '</tspan>').join('') + '</text>';
  }
  function defs(u) {
    return '<defs><marker id="f' + u + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="dg-arrow"/></marker>' +
      '<marker id="c' + u + '" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7"><circle cx="5" cy="5" r="3.5" class="dg-circ"/></marker>' +
      '<marker id="o' + u + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 1L9 5L0 9" class="dg-arrow-open"/></marker></defs>';
  }

  let CW = 140;
  const RH = 96;
  function dims(n) {
    switch (n.k) {
      case 'start': case 'end': case 'mid': return { hw: 15, hh: 15 };
      case 'gw': case 'and': case 'or': case 'evgw': return { hw: 24, hh: 24 };
      case 'sub': return { hw: 58, hh: 30 };
      case 'state': return { hw: 56, hh: 22 };
      case 'box': return { hw: 60, hh: 26 };
      case 'db': return { hw: 46, hh: 30 };
      default: return { hw: 56, hh: 26 };
    }
  }
  const isGw = n => ['gw', 'and', 'or', 'evgw'].includes(n.k);

  function layout(sp) {
    CW = sp.cw || 140;
    const lanes = sp.lanes && sp.lanes.length;
    const ML = (lanes ? 40 : 14) + (sp.pool ? 28 : 0), MT = 14;
    const map = {};
    let maxX = 0, maxY = 0;
    sp.nodes.forEach(n => {
      const d = dims(n);
      n.hw = d.hw; n.hh = d.hh;
      n.cx = ML + n.x * CW + CW / 2;
      n.cy = MT + n.y * RH + RH / 2;
      map[n.id] = n;
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });
    return { map, ML, MT, maxX, maxY, lanes };
  }

  function route(a, b, f) {
    const A = { r: [a.cx + a.hw, a.cy], l: [a.cx - a.hw, a.cy], t: [a.cx, a.cy - a.hh], b: [a.cx, a.cy + a.hh] };
    const B = { r: [b.cx + b.hw, b.cy], l: [b.cx - b.hw, b.cy], t: [b.cx, b.cy - b.hh], b: [b.cx, b.cy + b.hh] };
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    if (f.msg) {
      const p = dy > 0 ? A.b : A.t, q = dy > 0 ? B.t : B.b;
      if (Math.abs(dx) < 2) return [p, q];
      const my = (p[1] + q[1]) / 2;
      return [p, [p[0], my], [q[0], my], q];
    }
    if (f.via || dx < -2) {
      const over = f.via === 'over';
      const lvl = over ? Math.min(a.cy - a.hh, b.cy - b.hh) - (f.lift || 34) : Math.max(a.cy + a.hh, b.cy + b.hh) + (f.lift || 34);
      const gx = B.l[0] - 22;
      return [over ? A.t : A.b, [a.cx, lvl], [gx, lvl], [gx, b.cy], B.l];
    }
    if (Math.abs(dy) < 2 && dx > 0) return [A.r, B.l];
    if (Math.abs(dx) < 2) return dy > 0 ? [A.b, B.t] : [A.t, B.b];
    if (isGw(a) && !isGw(b)) return [dy > 0 ? A.b : A.t, [a.cx, b.cy], B.l];
    if (isGw(b) && !isGw(a)) return [A.r, [b.cx, a.cy], dy > 0 ? B.t : B.b];
    const mx = A.r[0] + (B.l[0] - A.r[0]) / 2;
    return [A.r, [mx, a.cy], [mx, b.cy], B.l];
  }
  DG.route = route;

  function nodeSvg(n) {
    const { cx, cy, hw, hh } = n;
    const bl = n.blank ? ' blank' : '';
    const label = n.blank ? CIR[n.blank - 1] : n.t || '';
    let s = '<g class="dg-el dg-node' + bl + '" data-id="' + esc(n.id) + '">';
    const icon = { timer: '⏱', msg: '✉', err: '⚡', sig: '△' }[n.ev] || '';
    switch (n.k) {
      case 'start':
        s += '<circle class="dg-shape" cx="' + cx + '" cy="' + cy + '" r="15"/>';
        if (icon) s += '<text class="dg-icon" x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central">' + icon + '</text>';
        if (label) s += txt(cx, cy + (n.lt ? -30 : 30), wrap(label, 18), 'dg-lbl');
        break;
      case 'end':
        s += '<circle class="dg-shape thick" cx="' + cx + '" cy="' + cy + '" r="15"/>';
        if (icon) s += '<text class="dg-icon" x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central">' + icon + '</text>';
        if (label) s += txt(cx, cy + (n.lt ? -30 : 30), wrap(label, 18), 'dg-lbl');
        break;
      case 'mid':
        s += '<circle class="dg-shape" cx="' + cx + '" cy="' + cy + '" r="15"/><circle class="dg-shape" cx="' + cx + '" cy="' + cy + '" r="11"/>';
        if (icon) s += '<text class="dg-icon" x="' + cx + '" y="' + cy + '" text-anchor="middle" dominant-baseline="central">' + icon + '</text>';
        if (label) s += txt(cx, cy + (n.lt ? -30 : 30), wrap(label, 18), 'dg-lbl');
        break;
      case 'gw': case 'and': case 'or': case 'evgw': {
        s += '<polygon class="dg-shape" points="' + cx + ',' + (cy - 24) + ' ' + (cx + 24) + ',' + cy + ' ' + cx + ',' + (cy + 24) + ' ' + (cx - 24) + ',' + cy + '"/>';
        const sym = n.k === 'gw' ? '<path class="dg-sym" d="M' + (cx - 8) + ' ' + (cy - 8) + 'L' + (cx + 8) + ' ' + (cy + 8) + 'M' + (cx + 8) + ' ' + (cy - 8) + 'L' + (cx - 8) + ' ' + (cy + 8) + '"/>' :
          n.k === 'and' ? '<path class="dg-sym" d="M' + cx + ' ' + (cy - 10) + 'L' + cx + ' ' + (cy + 10) + 'M' + (cx - 10) + ' ' + cy + 'L' + (cx + 10) + ' ' + cy + '"/>' :
            n.k === 'or' ? '<circle class="dg-sym" cx="' + cx + '" cy="' + cy + '" r="9"/>' :
              '<circle class="dg-sym" cx="' + cx + '" cy="' + cy + '" r="9"/><circle class="dg-sym" cx="' + cx + '" cy="' + cy + '" r="6"/>';
        s += sym;
        if (label) s += lblAt(cx - 30, cy - 32, wrap(label, 14));
        break;
      }
      case 'sub':
        s += '<rect class="dg-shape" x="' + (cx - hw) + '" y="' + (cy - hh) + '" width="' + hw * 2 + '" height="' + hh * 2 + '" rx="10"/>' +
          '<rect class="dg-shape" x="' + (cx - 7) + '" y="' + (cy + hh - 15) + '" width="14" height="12" rx="2"/><path class="dg-sym" d="M' + (cx - 4) + ' ' + (cy + hh - 9) + 'h8M' + cx + ' ' + (cy + hh - 13) + 'v8"/>';
        s += txt(cx, cy - 4, wrap(label, 17), 'dg-lbl');
        break;
      case 'state':
        s += '<rect class="dg-shape" x="' + (cx - hw) + '" y="' + (cy - hh) + '" width="' + hw * 2 + '" height="' + hh * 2 + '" rx="20"/>';
        s += txt(cx, cy, wrap(label, 16), 'dg-lbl');
        break;
      case 'box':
        s += '<rect class="dg-shape" x="' + (cx - hw) + '" y="' + (cy - hh) + '" width="' + hw * 2 + '" height="' + hh * 2 + '" rx="6"/>';
        s += txt(cx, cy, wrap(label, 17), 'dg-lbl');
        break;
      case 'db':
        s += '<path class="dg-shape" d="M' + (cx - hw) + ' ' + (cy - hh + 8) + 'v' + (hh * 2 - 16) + 'a' + hw + ' 8 0 0 0 ' + hw * 2 + ' 0v' + -(hh * 2 - 16) + 'a' + hw + ' 8 0 0 0 ' + -hw * 2 + ' 0z"/><path class="dg-shape" d="M' + (cx - hw) + ' ' + (cy - hh + 8) + 'a' + hw + ' 8 0 0 0 ' + hw * 2 + ' 0"/>';
        s += txt(cx, cy + 4, wrap(label, 13), 'dg-lbl');
        break;
      default: {
        s += '<rect class="dg-shape" x="' + (cx - hw) + '" y="' + (cy - hh) + '" width="' + hw * 2 + '" height="' + hh * 2 + '" rx="9"/>';
        const mk = { user: '👤', service: '⚙', manual: '✋', send: '✉', receive: '📩', rule: '▦' }[n.k];
        if (mk) s += '<text class="dg-icon sm" x="' + (cx - hw + 6) + '" y="' + (cy - hh + 12) + '">' + mk + '</text>';
        s += txt(cx, cy + (mk ? 4 : 0), wrap(label, 15), 'dg-lbl');
      }
    }
    return s + '</g>';
  }

  function polyD(pts) { return 'M' + pts.map(p => fx(p[0]) + ' ' + fx(p[1])).join('L'); }

  function flowSvg(f, a, b, u) {
    const pts = route(a, b, f);
    const d = polyD(pts);
    const label = f.blank ? CIR[f.blank - 1] : f.t;
    let s = '<g class="dg-el dg-edge' + (f.blank ? ' blank' : '') + '" data-id="' + esc(f.id) + '"><path class="dg-hit" d="' + d + '"/>' +
      '<path class="dg-line' + (f.msg ? ' msg' : '') + '" d="' + d + '" marker-end="url(#' + (f.msg ? 'o' : 'f') + u + ')"' + (f.msg ? ' marker-start="url(#c' + u + ')"' : '') + '/>';
    if (label) {
      const p0 = pts[0], p1 = pts[1];
      const vert = Math.abs(p0[0] - p1[0]) < 2;
      const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      if (pts.length === 2 && vert) s += '<text class="dg-flbl" x="' + fx(mx + 8) + '" y="' + fx(my + 4) + '">' + esc(label) + '</text>';
      else if (pts.length === 2) s += '<text class="dg-flbl" x="' + fx(mx) + '" y="' + fx(my - 7) + '" text-anchor="middle">' + esc(label) + '</text>';
      else if (vert) s += '<text class="dg-flbl" x="' + fx(p0[0] + 6) + '" y="' + fx(p0[1] + (p1[1] > p0[1] ? 16 : -8)) + '">' + esc(label) + '</text>';
      else s += '<text class="dg-flbl" x="' + fx(p0[0] + 6) + '" y="' + fx(p0[1] - 7) + '">' + esc(label) + '</text>';
    }
    return s + '</g>';
  }

  function gridSvg(sp, u) {
    const L = layout(sp);
    const W = L.ML + (L.maxX + 1) * CW + 16;
    const extra = sp.flows.some(f => f.via === 'under' || (L.map[f.a] && L.map[f.b] && L.map[f.b].cx <= L.map[f.a].cx && !f.via)) ? 46 : 20;
    const H = L.MT + (L.maxY + 1) * RH + extra;
    let s = '<svg class="dg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img">' + defs(u);
    if (L.lanes) {
      const off = sp.pool ? 28 : 0;
      if (sp.pool) {
        const y1 = L.MT + Math.min(...sp.lanes.map(l => l.from)) * RH, y2 = L.MT + (Math.max(...sp.lanes.map(l => l.to)) + 1) * RH;
        s += '<rect class="dg-lane" x="6" y="' + y1 + '" width="' + (W - 12) + '" height="' + (y2 - y1) + '"/><rect class="dg-lanehead" x="6" y="' + y1 + '" width="28" height="' + (y2 - y1) + '"/>' +
          '<text class="dg-lanetxt" transform="translate(22 ' + (y1 + (y2 - y1) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(sp.pool) + '</text>';
      }
      sp.lanes.forEach(ln => {
        const y1 = L.MT + ln.from * RH, y2 = L.MT + (ln.to + 1) * RH;
        s += '<rect class="dg-lane" x="' + (6 + off) + '" y="' + y1 + '" width="' + (W - 12 - off) + '" height="' + (y2 - y1) + '"/><rect class="dg-lanehead" x="' + (6 + off) + '" y="' + y1 + '" width="28" height="' + (y2 - y1) + '"/>' +
          '<text class="dg-lanetxt" transform="translate(' + (22 + off) + ' ' + (y1 + (y2 - y1) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(ln.t) + '</text>';
      });
    }
    sp.flows.forEach(f => { if (!f.id) f.id = f.a + '>' + f.b; });
    sp.flows.forEach(f => { s += flowSvg(f, L.map[f.a], L.map[f.b], u); });
    sp.nodes.forEach(n => { s += nodeSvg(n); });
    return s + '</svg>';
  }

  function seqSvg(sp, u) {
    const PW = sp.pw || 190, ML = 80, y0 = 92, SH = sp.sh || 46;
    const parts = sp.parts;
    const idx = {};
    parts.forEach((p, i) => { idx[p.id] = i; });
    const px = i => ML + i * PW;
    const n = sp.msgs.length;
    const W = ML * 2 + (parts.length - 1) * PW, H = y0 + n * SH + 24;
    let s = '<svg class="dg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img">' + defs(u);
    (sp.frames || []).forEach(f => {
      const x1 = px(f.a == null ? 0 : f.a) - 56, x2 = px(f.b == null ? parts.length - 1 : f.b) + 56;
      const y1 = y0 + f.from * SH - 28, y2 = y0 + f.to * SH + 18;
      s += '<rect class="dg-frame" x="' + x1 + '" y="' + y1 + '" width="' + (x2 - x1) + '" height="' + (y2 - y1) + '"/>';
      const tw = f.k.length * 8 + 14;
      s += '<path class="dg-frametab" d="M' + x1 + ' ' + y1 + 'h' + tw + 'v12l-6 6h-' + (tw - 6) + 'z"/><text class="dg-frametxt" x="' + (x1 + 6) + '" y="' + (y1 + 13) + '">' + esc(f.k) + '</text>';
      if (f.t) s += '<text class="dg-flbl" x="' + (x1 + tw + 8) + '" y="' + (y1 + 13) + '">[' + esc(f.t) + ']</text>';
      if (f.else != null) {
        const ye = y0 + f.else * SH - 26;
        s += '<line class="dg-frameelse" x1="' + x1 + '" x2="' + x2 + '" y1="' + ye + '" y2="' + ye + '"/>';
        if (f.et) s += '<text class="dg-flbl" x="' + (x1 + 8) + '" y="' + (ye + 14) + '">[' + esc(f.et) + ']</text>';
      }
    });
    parts.forEach((p, i) => {
      s += '<line class="dg-life" x1="' + px(i) + '" x2="' + px(i) + '" y1="52" y2="' + (H - 8) + '"/>';
    });
    parts.forEach((p, i) => {
      const bl = p.blank ? ' blank' : '';
      s += '<g class="dg-el dg-node' + bl + '" data-id="' + esc(p.id) + '"><rect class="dg-shape" x="' + (px(i) - 62) + '" y="14" width="124" height="38" rx="' + (p.actor ? 19 : 6) + '"/>' +
        txt(px(i), 33, wrap((p.actor ? '👤 ' : '') + (p.blank ? CIR[p.blank - 1] : p.t), 17), 'dg-lbl', 12) + '</g>';
    });
    sp.msgs.forEach((m, i) => {
      m.id = m.id || 'm' + i;
      const y = y0 + i * SH, a = idx[m.a], b = idx[m.b];
      const label = m.blank ? CIR[m.blank - 1] : m.t;
      const cls = 'dg-line' + (m.k === 'ret' ? ' ret' : '');
      const mk = m.k === 'sync' || m.k == null ? 'f' : 'o';
      s += '<g class="dg-el dg-edge' + (m.blank ? ' blank' : '') + '" data-id="' + esc(m.id) + '">';
      if (a === b) {
        const x = px(a);
        const d = 'M' + x + ' ' + y + 'h44v18h-44';
        s += '<path class="dg-hit" d="' + d + '"/><path class="' + cls + '" d="' + d + '" marker-end="url(#' + mk + u + ')"/><text class="dg-flbl" x="' + (x + 50) + '" y="' + (y + 12) + '">' + esc(label) + '</text>';
      } else {
        const x1 = px(a), x2 = px(b), dir = x2 > x1 ? 1 : -1;
        const d = 'M' + x1 + ' ' + y + 'L' + (x2 - dir * 1) + ' ' + y;
        s += '<path class="dg-hit" d="' + d + '"/><path class="' + cls + '" d="' + d + '" marker-end="url(#' + mk + u + ')"/>' +
          '<text class="dg-flbl" x="' + (x1 + x2) / 2 + '" y="' + (y - 8) + '" text-anchor="middle">' + esc(label) + '</text>';
      }
      s += '</g>';
    });
    return s + '</svg>';
  }

  const EW = 190;
  function entBox(e) {
    const hgt = 32 + e.attrs.length * 20 + 6;
    return { x: 20 + e.x * 270, y: 20 + e.y * 210, w: EW, h: hgt };
  }
  function glyph(P, d, card, blankN) {
    const nx = -d[1], ny = d[0];
    const at = (k, o) => [P[0] - d[0] * k + nx * (o || 0), P[1] - d[1] * k + ny * (o || 0)];
    const ln = (p, q) => '<path class="dg-line thin" d="M' + fx(p[0]) + ' ' + fx(p[1]) + 'L' + fx(q[0]) + ' ' + fx(q[1]) + '"/>';
    if (blankN) {
      const c = at(24, 14);
      return '<text class="dg-blank" x="' + fx(c[0]) + '" y="' + fx(c[1]) + '" text-anchor="middle" dominant-baseline="central">' + CIR[blankN - 1] + '</text>';
    }
    let s = '';
    const foot = /N$/.test(card);
    if (foot) { const q = at(16, 0); s += ln(q, at(0, 8)) + ln(q, at(0, -8)) + ln(q, at(0, 0)); }
    if (card === '1' || card === '0..1') s += ln(at(10, 7), at(10, -7));
    if (card === '1..N') s += ln(at(22, 7), at(22, -7));
    if (card === '0..1' || card === '0..N') { const c = at(foot ? 24 : 20, 0); s += '<circle class="dg-shape thin" cx="' + fx(c[0]) + '" cy="' + fx(c[1]) + '" r="5"/>'; }
    const t = at(40, 12);
    s += '<text class="dg-card" x="' + fx(t[0]) + '" y="' + fx(t[1]) + '" text-anchor="middle" dominant-baseline="central">' + esc(card) + '</text>';
    return s;
  }
  function erSvg(sp) {
    const boxes = {};
    let W = 0, H = 0;
    sp.ents.forEach(e => { const b = entBox(e); boxes[e.id] = b; W = Math.max(W, b.x + b.w + 30); H = Math.max(H, b.y + b.h + 30); });
    let s = '<svg class="dg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img">';
    sp.rels.forEach(r => {
      if (!r.id) r.id = r.a + '-' + r.b;
      const A = boxes[r.a], B = boxes[r.b];
      const ac = [A.x + A.w / 2, A.y + A.h / 2], bc = [B.x + B.w / 2, B.y + B.h / 2];
      const dx = bc[0] - ac[0], dy = bc[1] - ac[1];
      const horiz = r.sa ? /[lr]/.test(r.sa) : Math.abs(dx) * 0.55 >= Math.abs(dy);
      let pts;
      const oa = r.oa || 0, ob = r.ob || 0;
      if (horiz) {
        const ra = r.sa ? r.sa === 'r' : dx > 0;
        const p = [ra ? A.x + A.w : A.x, ac[1] + oa], q = [ra ? B.x : B.x + B.w, bc[1] + ob];
        const mx = (p[0] + q[0]) / 2;
        pts = Math.abs(p[1] - q[1]) < 2 ? [p, q] : [p, [mx, p[1]], [mx, q[1]], q];
      } else {
        const bt = r.sa ? r.sa === 'b' : dy > 0;
        const p = [ac[0] + oa, bt ? A.y + A.h : A.y], q = [bc[0] + ob, bt ? B.y : B.y + B.h];
        const my = (p[1] + q[1]) / 2;
        pts = Math.abs(p[0] - q[0]) < 2 ? [p, q] : [p, [p[0], my], [q[0], my], q];
      }
      const unit = (p, q) => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1; return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
      const dA = unit(pts[1], pts[0]), dB = unit(pts[pts.length - 2], pts[pts.length - 1]);
      s += '<g class="dg-el dg-edge' + (r.ba || r.bb ? ' blank' : '') + '" data-id="' + esc(r.id) + '"><path class="dg-hit" d="' + polyD(pts) + '"/><path class="dg-line" d="' + polyD(pts) + '"/>';
      s += glyph(pts[0], dA, r.ka, r.ba) + glyph(pts[pts.length - 1], dB, r.kb, r.bb);
      if (r.t) {
        const i = Math.floor((pts.length - 1) / 2);
        const m = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
        s += '<text class="dg-flbl" x="' + fx(m[0]) + '" y="' + fx(m[1] - 6) + '" text-anchor="middle">' + esc(r.t) + '</text>';
      }
      s += '</g>';
    });
    sp.ents.forEach(e => {
      const b = boxes[e.id];
      s += '<g class="dg-el dg-node" data-id="' + esc(e.id) + '"><rect class="dg-shape" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="6"/>' +
        '<rect class="dg-enthead" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="28" rx="6"/>' +
        '<text class="dg-enttxt" x="' + (b.x + b.w / 2) + '" y="' + (b.y + 15) + '" text-anchor="middle" dominant-baseline="central">' + esc(e.t) + '</text>';
      e.attrs.forEach((a, i) => {
        const key = /\bPK\b/.test(a) ? ' pk' : /\bFK\b/.test(a) ? ' fk' : '';
        s += '<text class="dg-attr' + key + '" x="' + (b.x + 10) + '" y="' + (b.y + 28 + 14 + i * 20) + '" dominant-baseline="central">' + esc(a) + '</text>';
      });
      s += '</g>';
    });
    return s + '</svg>';
  }

  DG.svg = function (sp) {
    const u = ++uidN;
    if (sp.type === 'seq') return seqSvg(sp, u);
    if (sp.type === 'er') return erSvg(sp);
    return gridSvg(sp, u);
  };

  DG.ids = function (sp) {
    const out = [];
    if (sp.type === 'seq') { sp.parts.forEach(p => out.push(p.id)); sp.msgs.forEach((m, i) => out.push(m.id || 'm' + i)); }
    else if (sp.type === 'er') { sp.ents.forEach(e => out.push(e.id)); sp.rels.forEach(r => out.push(r.id || r.a + '-' + r.b)); }
    else { sp.nodes.forEach(n => out.push(n.id)); sp.flows.forEach(f => out.push(f.id || f.a + '>' + f.b)); }
    return out;
  };
  DG.blanks = function (sp) {
    const out = [];
    const add = n => { if (n) out.push(n); };
    if (sp.type === 'seq') { sp.parts.forEach(p => add(p.blank)); sp.msgs.forEach(m => add(m.blank)); }
    else if (sp.type === 'er') { sp.rels.forEach(r => { add(r.ba); add(r.bb); }); sp.ents.forEach(e => add(e.blank)); }
    else { sp.nodes.forEach(n => add(n.blank)); sp.flows.forEach(f => add(f.blank)); }
    return out.sort((a, b) => a - b);
  };

  DG.lint = function (sp) {
    const errs = [];
    if (sp.type === 'seq' || sp.type === 'er') return errs;
    const L = layout(JSON.parse(JSON.stringify(sp)));
    const sp2 = JSON.parse(JSON.stringify(sp));
    const L2 = layout(sp2);
    const gw = k => ['gw', 'and', 'or', 'evgw'].includes(k);
    const inc = {}, out = {};
    sp2.flows.forEach(f => { f.id = f.id || f.a + '>' + f.b; (out[f.a] = out[f.a] || []).push(f); (inc[f.b] = inc[f.b] || []).push(f); });
    sp2.nodes.forEach(n => {
      const i = (inc[n.id] || []).filter(f => !f.msg), o = (out[n.id] || []).filter(f => !f.msg);
      if (n.k === 'start' && i.length) errs.push(n.id + ': у начала есть входящий поток');
      if (n.k === 'end' && o.length) errs.push(n.id + ': у конца есть исходящий поток');
      if (n.k !== 'start' && !i.length && !(n.k === 'mid' && n.ev === 'msg' && (inc[n.id] || []).length)) errs.push(n.id + ': нет входящего потока');
      if (n.k !== 'end' && !o.length) errs.push(n.id + ': нет исходящего потока');
      if (n.k === 'gw' || n.k === 'or' || n.k === 'evgw') { if (o.length > 1 && o.some(f => !f.t && !f.blank)) errs.push(n.id + ': ветка шлюза без подписи'); }
      if (n.k === 'and' && o.length > 1 && o.some(f => f.t)) errs.push(n.id + ': ветки параллельного шлюза подписывать нельзя');
      if (gw(n.k) && (inc[n.id] || []).some(f => f.msg)) errs.push(n.id + ': шлюз и сообщение');
      if (!n.blank && !n.t && n.k !== 'and' && n.k !== 'gw' && n.k !== 'or' && n.k !== 'evgw' && sp2.type === 'bpmn' && n.k !== 'end') errs.push(n.id + ': нет подписи');
    });
    sp2.flows.forEach(f => {
      const a = L2.map[f.a], b = L2.map[f.b];
      const pts = route(a, b, f);
      const last = pts[pts.length - 1], prev = pts[pts.length - 2];
      if (f.msg) {
        if (b.k === 'end' || gw(b.k) || gw(a.k) || a.k === 'start') errs.push(f.id + ': недопустимый конец потока сообщений');
        if (!f.t) errs.push(f.id + ': поток сообщений без имени');
        const lane = n => (sp2.lanes || []).findIndex(l => n.y >= l.from && n.y <= l.to);
        if (sp2.lanes && lane(a) === lane(b)) errs.push(f.id + ': сообщение внутри одного участника');
        return;
      }
      if (!gw(b.k) && !(Math.abs(last[0] - (b.cx - b.hw)) < 1 && prev[0] < last[0] - 1 && Math.abs(prev[1] - last[1]) < 1)) errs.push(f.id + ': поток входит не в левую сторону элемента');
      const back = f.via || b.cx < a.cx - 2;
      if (!gw(a.k) && !back && !(Math.abs(pts[0][0] - (a.cx + a.hw)) < 1 && Math.abs(pts[0][1] - a.cy) < 1)) errs.push(f.id + ': поток выходит не из правой стороны элемента');
    });
    return errs;
  };

  DG.validate = function (sp) {
    const errs = [];
    const ids = DG.ids(sp);
    if (new Set(ids).size !== ids.length) errs.push('duplicate ids');
    if (sp.type === 'seq') {
      const pid = new Set(sp.parts.map(p => p.id));
      sp.msgs.forEach(m => { if (!pid.has(m.a) || !pid.has(m.b)) errs.push('msg endpoints ' + m.t); });
      (sp.frames || []).forEach(f => { if (f.from < 0 || f.to >= sp.msgs.length) errs.push('frame range'); });
    } else if (sp.type === 'er') {
      const eid = new Set(sp.ents.map(e => e.id));
      sp.rels.forEach(r => { if (!eid.has(r.a) || !eid.has(r.b)) errs.push('rel endpoints'); });
    } else {
      const nid = new Set(sp.nodes.map(n => n.id));
      sp.flows.forEach(f => { if (!nid.has(f.a) || !nid.has(f.b)) errs.push('flow endpoints ' + f.a + '>' + f.b); });
    }
    const bl = DG.blanks(sp);
    bl.forEach((n, i) => { if (n !== i + 1) errs.push('blank numbering'); });
    try { DG.svg(JSON.parse(JSON.stringify(sp))); } catch (e) { errs.push('render ' + e.message); }
    return errs;
  };

  SAQ.dgMount = function (root) {
    root.querySelectorAll('.dg[data-dg]').forEach(el => {
      const d = SAQ.diagrams[el.getAttribute('data-dg')];
      if (!d) { el.textContent = 'Диаграмма не найдена: ' + el.getAttribute('data-dg'); return; }
      el.innerHTML = '<div class="dgwrap">' + DG.svg(JSON.parse(JSON.stringify(d.spec))) + '</div>' + (d.title ? '<div class="dgcap"><b>' + esc(d.title) + '.</b> ' + (d.note || '') + '</div>' : '');
    });
  };

  const baseCheck = SAQ.check, baseSol = SAQ.solution, baseReady = SAQ.ready, baseMount = SAQ.mount;
  SAQ.check = function (e, a) {
    if (e.type === 'dgfind' || e.type === 'codehunt') {
      const s = new Set(a || []), bad = e.bad;
      const found = bad.filter(x => s.has(x)).length;
      const extra = [...s].filter(x => !bad.includes(x)).length;
      return { ok: found === bad.length && extra === 0, found, extra, total: bad.length };
    }
    if (e.type === 'dgfill') {
      const n = Array.isArray(a) ? e.blanks.filter((b, i) => a[i] === b.answer).length : 0;
      return { ok: n === e.blanks.length, n, total: e.blanks.length };
    }
    return baseCheck(e, a);
  };
  SAQ.solution = e => (e.type === 'dgfind' || e.type === 'codehunt' ? e.bad.slice() : e.type === 'dgfill' ? e.blanks.map(b => b.answer) : baseSol(e));
  SAQ.ready = (e, a) => (e.type === 'dgfind' || e.type === 'codehunt' ? Array.isArray(a) && a.length > 0 : e.type === 'dgfill' ? Array.isArray(a) && a.length === e.blanks.length && a.every(x => x !== null && x !== undefined) : baseReady(e, a));

  SAQ.mount = function (box, e, key, set) {
    if (e.type === 'dgfind') {
      const wrapEl = h('div', { class: 'dgwrap pick', html: DG.svg(JSON.parse(JSON.stringify(e.dg))) });
      box.append(wrapEl, h('div', { class: 'mut' }, 'Нажимайте на блоки, стрелки и сообщения, в которых ошибка. Повторный клик снимает отметку.'));
      const cur = new Set();
      let locked = false;
      wrapEl.addEventListener('click', ev => {
        if (locked) return;
        const g = ev.target.closest('[data-id]');
        if (!g || !wrapEl.contains(g)) return;
        const id = g.getAttribute('data-id');
        if (cur.has(id)) cur.delete(id); else cur.add(id);
        g.classList.toggle('sel', cur.has(id));
        set([...cur]);
      });
      set([]);
      return {
        lock() { locked = true; },
        show(sol) {
          wrapEl.querySelectorAll('[data-id]').forEach(g => {
            const id = g.getAttribute('data-id');
            g.classList.toggle('right', sol.includes(id));
            g.classList.toggle('wrong', cur.has(id) && !sol.includes(id));
          });
        }
      };
    }
    if (e.type === 'dgfill') {
      box.append(h('div', { class: 'dgwrap', html: DG.svg(JSON.parse(JSON.stringify(e.dg))) }));
      const cur = e.blanks.map(() => null);
      let locked = false;
      const rows = e.blanks.map((b, i) => {
        const perm = SAQ.perm(b.options.length, key + '-' + i);
        const s = h('select', { class: 'sel-in' }, h('option', { value: '' }, '— выбрать —'), perm.map(j => h('option', { value: String(j), html: b.options[j] })));
        s.addEventListener('change', () => {
          if (locked) return;
          cur[i] = s.value === '' ? null : Number(s.value);
          set(cur.slice());
        });
        const row = h('div', { class: 'mrow' }, h('div', { class: 'ml' }, h('b', null, CIR[i] + ' '), b.label || 'Что здесь?'), s);
        row._s = s;
        return row;
      });
      box.append(...rows);
      return {
        lock() { locked = true; rows.forEach(r => { r._s.disabled = true; }); },
        show(sol) {
          rows.forEach((r, i) => {
            r.classList.toggle('right', cur[i] === sol[i]);
            r.classList.toggle('wrong', cur[i] !== sol[i]);
            r._s.value = String(sol[i]);
          });
        }
      };
    }
    if (e.type === 'codehunt') {
      const pre = h('div', { class: 'codehunt' });
      const cur = new Set();
      let locked = false;
      const lines = e.lines.map((l, i) => {
        const el = h('div', { class: 'cl' }, h('span', { class: 'ln' }, String(i + 1)), h('code', null, l === '' ? ' ' : l));
        el.addEventListener('click', () => {
          if (locked) return;
          if (cur.has(i)) cur.delete(i); else cur.add(i);
          el.classList.toggle('sel', cur.has(i));
          set([...cur]);
        });
        pre.append(el);
        return el;
      });
      box.append(pre, h('div', { class: 'mut' }, 'Нажимайте на строки с ошибками.'));
      set([]);
      return {
        lock() { locked = true; },
        show(sol) {
          lines.forEach((el, i) => {
            el.classList.toggle('right', sol.includes(i));
            el.classList.toggle('wrong', cur.has(i) && !sol.includes(i));
          });
        }
      };
    }
    if (e.dg) box.append(h('div', { class: 'dgwrap', html: DG.svg(JSON.parse(JSON.stringify(e.dg))) }));
    return baseMount(box, e, key, set);
  };
})();
