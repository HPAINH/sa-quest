(function () {
  const { h } = SAQ;

  const cnt = (arr, fn) => arr.filter(fn).length;

  const K = {
    choice: (e, a) => ({ ok: a === e.answer }),
    multi: (e, a) => ({
      ok: Array.isArray(a) && a.length === e.answer.length && e.answer.every(x => a.includes(x))
    }),
    tf: (e, a) => {
      const n = Array.isArray(a) ? cnt(e.statements, (s, i) => a[i] === s.v) : 0;
      return { ok: n === e.statements.length, n, total: e.statements.length };
    },
    classify: (e, a) => {
      const n = Array.isArray(a) ? cnt(e.items, (s, i) => a[i] === s.b) : 0;
      return { ok: n === e.items.length, n, total: e.items.length };
    },
    order: (e, a) => {
      const n = Array.isArray(a) ? cnt(a, (x, i) => x === i) : 0;
      return { ok: n === e.items.length && Array.isArray(a) && a.length === e.items.length, n, total: e.items.length };
    },
    match: (e, a) => {
      const n = Array.isArray(a) ? cnt(e.pairs, (p, i) => a[i] === i) : 0;
      return { ok: n === e.pairs.length, n, total: e.pairs.length };
    },
    cloze: (e, a) => {
      const n = Array.isArray(a) ? cnt(e.blanks, (b, i) => a[i] === b.answer) : 0;
      return { ok: n === e.blanks.length, n, total: e.blanks.length };
    },
    hunt: (e, a) => {
      const s = new Set(a || []);
      const found = cnt(e.bad, i => s.has(i));
      const extra = [...s].filter(i => !e.bad.includes(i)).length;
      return { ok: found === e.bad.length && extra === 0, found, extra, total: e.bad.length };
    },
    write: (e, a) => {
      const t = String(a || '');
      const parts = (e.rules || []).map(r => {
        const m = new RegExp(r.re, r.flags || 'i').test(t);
        return { ok: r.not ? !m : m, msg: r.msg };
      });
      if (e.minLen) parts.unshift({ ok: t.trim().length >= e.minLen, msg: 'Не короче ' + e.minLen + ' символов' });
      return { ok: parts.every(p => p.ok), parts };
    }
  };

  SAQ.check = (e, a) => K[e.type](e, a);

  SAQ.solution = function (e) {
    switch (e.type) {
      case 'choice': case 'multi': return e.answer;
      case 'tf': return e.statements.map(s => s.v);
      case 'classify': return e.items.map(i => i.b);
      case 'order': return e.items.map((x, i) => i);
      case 'match': return e.pairs.map((x, i) => i);
      case 'cloze': return e.blanks.map(b => b.answer);
      case 'hunt': return e.bad.slice();
      case 'write': return e.sample;
    }
  };

  SAQ.ready = function (e, a) {
    if (a == null) return false;
    switch (e.type) {
      case 'multi': return a.length > 0;
      case 'tf': case 'classify': case 'match': case 'cloze': return a.every(x => x !== null && x !== undefined);
      case 'write': return String(a).trim().length > 0;
      default: return true;
    }
  };

  const R = {};

  R.choice = R.multi = function (box, e, key, set) {
    const multi = e.type === 'multi';
    const p = e.fixed ? [...e.options.keys()] : SAQ.perm(e.options.length, key);
    let cur = multi ? [] : null, locked = false;
    const btns = p.map(i => {
      const b = h('button', { class: 'opt', type: 'button' }, h('span', { class: 'mk' }), h('span', { html: e.options[i] }));
      b._i = i;
      b.addEventListener('click', () => {
        if (locked) return;
        if (multi) {
          cur = cur.includes(i) ? cur.filter(x => x !== i) : [...cur, i];
          b.classList.toggle('sel', cur.includes(i));
          set(cur.slice());
        } else {
          cur = i;
          btns.forEach(x => x.classList.toggle('sel', x._i === i));
          set(i);
        }
      });
      return b;
    });
    box.append(h('div', { class: 'opts' }, btns));
    return {
      lock() { locked = true; },
      show(sol, ans) {
        const s = multi ? sol : [sol];
        const a = multi ? ans || [] : [ans];
        btns.forEach(b => {
          b.classList.toggle('right', s.includes(b._i));
          b.classList.toggle('wrong', a.includes(b._i) && !s.includes(b._i));
        });
      }
    };
  };

  function segRows(box, texts, labels, set) {
    const cur = texts.map(() => null);
    let locked = false;
    const rows = texts.map((t, i) => {
      const bs = labels.map((l, j) => {
        const b = h('button', { class: 'seg', type: 'button' }, l);
        b.addEventListener('click', () => {
          if (locked) return;
          cur[i] = j;
          bs.forEach((x, k) => x.classList.toggle('sel', k === j));
          set(cur.slice());
        });
        return b;
      });
      const row = h('div', { class: 'segrow' }, h('div', { class: 'segt', html: t }), h('div', { class: 'segs' }, bs));
      row._bs = bs;
      return row;
    });
    box.append(...rows);
    return {
      lock() { locked = true; },
      show(sol) {
        rows.forEach((row, i) => row._bs.forEach((b, j) => {
          b.classList.toggle('right', j === sol[i]);
          b.classList.toggle('wrong', cur[i] === j && j !== sol[i]);
        }));
      }
    };
  }

  R.classify = (box, e, key, set) => {
    box.append(h('div', { class: 'legend' }, e.buckets.map((b, i) => h('span', { class: 'lg' }, (i + 1) + ' — ' + b))));
    const order = SAQ.perm(e.items.length, key);
    const texts = order.map(i => e.items[i].t);
    const inner = segRows(box, texts, e.buckets.map((b, i) => String(i + 1)), a => {
      const out = e.items.map(() => null);
      order.forEach((orig, k) => { out[orig] = a[k]; });
      set(out);
    });
    return {
      lock: inner.lock,
      show(sol) { inner.show(order.map(orig => sol[orig])); }
    };
  };

  R.tf = (box, e, key, set) => {
    const inner = segRows(box, e.statements.map(s => s.t), ['Верно', 'Неверно'], a => set(a.map(x => (x === null ? null : x === 0))));
    return { lock: inner.lock, show(sol) { inner.show(sol.map(v => (v ? 0 : 1))); } };
  };

  R.order = (box, e, key, set) => {
    const n = e.items.length;
    const p = SAQ.perm(n, key);
    if (p.every((v, i) => v === i)) p.push(p.shift());
    let locked = false, revealed = false;
    const list = h('div', { class: 'ordl' });
    const draw = () => {
      list.replaceChildren(...p.map((i, k) => h('div', { class: 'ordr' + (revealed ? ' right' : '') },
        h('span', { class: 'n' }, String(k + 1)),
        h('span', { class: 't', html: e.items[i] }),
        h('button', { class: 'mv', type: 'button', onclick: () => move(k, -1) }, '↑'),
        h('button', { class: 'mv', type: 'button', onclick: () => move(k, 1) }, '↓'))));
    };
    const move = (k, d) => {
      if (locked) return;
      const j = k + d;
      if (j < 0 || j >= n) return;
      [p[k], p[j]] = [p[j], p[k]];
      draw();
      set(p.slice());
    };
    box.append(list);
    draw();
    set(p.slice());
    return {
      lock() { locked = true; },
      show(sol) { sol.forEach((v, i) => { p[i] = v; }); revealed = true; draw(); }
    };
  };

  R.match = (box, e, key, set) => {
    const n = e.pairs.length;
    const rp = SAQ.perm(n, key);
    const cur = e.pairs.map(() => null);
    let locked = false;
    const sels = e.pairs.map((pr, i) => {
      const s = h('select', { class: 'sel-in' }, h('option', { value: '' }, '— выбрать —'),
        rp.map(j => h('option', { value: String(j), html: e.pairs[j][1] })));
      s.addEventListener('change', () => {
        if (locked) return;
        cur[i] = s.value === '' ? null : Number(s.value);
        set(cur.slice());
      });
      return s;
    });
    const rows = e.pairs.map((pr, i) => h('div', { class: 'mrow' }, h('div', { class: 'ml', html: pr[0] }), sels[i]));
    box.append(...rows);
    return {
      lock() { locked = true; sels.forEach(s => { s.disabled = true; }); },
      show(sol) {
        sels.forEach((s, i) => {
          s.value = String(sol[i]);
          rows[i].classList.toggle('right', cur[i] === sol[i]);
          rows[i].classList.toggle('wrong', cur[i] !== sol[i]);
        });
      }
    };
  };

  R.cloze = (box, e, key, set) => {
    const cur = e.blanks.map(() => null);
    const sels = [];
    let locked = false;
    const frag = [];
    e.text.split(/(\{\{\d+\}\})/).forEach(part => {
      const m = part.match(/^\{\{(\d+)\}\}$/);
      if (!m) { frag.push(h('span', { html: part })); return; }
      const i = Number(m[1]);
      const perm = SAQ.perm(e.blanks[i].options.length, key + '-' + i);
      const s = h('select', { class: 'sel-in inl' }, h('option', { value: '' }, '…'),
        perm.map(j => h('option', { value: String(j), html: e.blanks[i].options[j] })));
      s.addEventListener('change', () => {
        if (locked) return;
        cur[i] = s.value === '' ? null : Number(s.value);
        set(cur.slice());
      });
      sels[i] = s;
      frag.push(s);
    });
    box.append(h('div', { class: 'cloze' }, frag));
    return {
      lock() { locked = true; sels.forEach(s => { s.disabled = true; }); },
      show(sol) {
        sels.forEach((s, i) => {
          s.classList.toggle('right', cur[i] === sol[i]);
          s.classList.toggle('wrong', cur[i] !== sol[i]);
          s.value = String(sol[i]);
        });
      }
    };
  };

  R.hunt = (box, e, key, set) => {
    const cur = new Set();
    let locked = false;
    const spans = e.tokens.map((t, i) => {
      const s = h('span', { class: 'tok', html: t });
      s.addEventListener('click', () => {
        if (locked) return;
        if (cur.has(i)) cur.delete(i); else cur.add(i);
        s.classList.toggle('sel', cur.has(i));
        set([...cur]);
      });
      return s;
    });
    const wrap = h('div', { class: 'hunt' });
    spans.forEach(s => { wrap.append(s, ' '); });
    box.append(wrap);
    set([]);
    return {
      lock() { locked = true; },
      show(sol) {
        spans.forEach((s, i) => {
          s.classList.toggle('right', sol.includes(i));
          s.classList.toggle('wrong', cur.has(i) && !sol.includes(i));
        });
      }
    };
  };

  R.write = (box, e, key, set) => {
    const ta = h('textarea', { class: 'wr', rows: '7', placeholder: e.placeholder || 'Ваш ответ…' });
    ta.addEventListener('input', () => set(ta.value));
    box.append(ta);
    let note = null;
    return {
      lock() { ta.disabled = true; },
      show(sol) {
        if (note) return;
        note = h('div', { class: 'sample' }, h('b', null, 'Пример сильного ответа'), h('div', { class: 'pre', html: String(sol).replace(/\n/g, '<br>') }));
        box.append(note);
      }
    };
  };

  SAQ.mount = (box, e, key, set) => R[e.type](box, e, key, set);
})();
