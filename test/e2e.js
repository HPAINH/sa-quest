const { chromium } = require('playwright');
const FILE = process.argv[2] || 'file:///mnt/user-data/outputs/sa-quest/dist/index.html';
const only = process.argv[3] ? Number(process.argv[3]) : null;
const skipCh = process.env.SKIPCH === '1';
const strip = s => s.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => m.type() === 'error' && errs.push('CONSOLE ' + m.text()));
  await p.goto(FILE);
  await p.evaluate(() => { SAQ.state().all = true; SAQ.save(); });
  const fails = [];
  const F = (t, m) => { fails.push(t + ': ' + m); };

  async function solve(scope, e, tag) {
    const S = (s) => p.locator(scope + ' ' + s);
    switch (e.type) {
      case 'choice': case 'multi': {
        const ids = await p.evaluate(sc => [...document.querySelectorAll(sc + ' .opt')].map(b => b._i), scope);
        const want = e.type === 'choice' ? [e.answer] : e.answer;
        for (let k = 0; k < ids.length; k++) if (want.includes(ids[k])) await S('.opt').nth(k).click();
        break;
      }
      case 'tf': case 'classify': {
        const rows = await p.evaluate(sc => [...document.querySelectorAll(sc + ' .segrow .segt')].map(x => x.innerHTML), scope);
        for (let k = 0; k < rows.length; k++) {
          const it = e.type === 'tf' ? e.statements.find(s => s.t === rows[k]) : e.items.find(s => s.t === rows[k]);
          if (!it) { F(tag, 'row text not found ' + rows[k]); continue; }
          const idx = e.type === 'tf' ? (it.v ? 0 : 1) : it.b;
          await S('.segrow').nth(k).locator('.seg').nth(idx).click();
        }
        break;
      }
      case 'order': {
        for (let target = 0; target < e.items.length; target++) {
          for (let guard = 0; guard < 30; guard++) {
            const cur = await p.evaluate(sc => [...document.querySelectorAll(sc + ' .ordr .t')].map(x => x.innerHTML), scope);
            const pos = cur.indexOf(e.items[target]);
            if (pos < 0) { F(tag, 'order item missing'); break; }
            if (pos === target) break;
            await S('.ordr').nth(pos).locator('.mv').nth(0).click();
          }
        }
        break;
      }
      case 'match': {
        const rows = await p.evaluate(sc => [...document.querySelectorAll(sc + ' .mrow')].map(r => r.querySelector('.ml').innerHTML), scope);
        for (let k = 0; k < rows.length; k++) {
          const i = e.pairs.findIndex(pr => pr[0] === rows[k]);
          await S('.mrow').nth(k).locator('select').selectOption(String(i));
        }
        break;
      }
      case 'cloze': {
        const n = e.blanks.length;
        for (let i = 0; i < n; i++) {
          const val = await p.evaluate(([sc, i, ans]) => {
            const s = document.querySelectorAll(sc + ' .cloze select')[i];
            return [...s.options].find(o => o.value === String(ans))?.value;
          }, [scope, i, e.blanks[i].answer]);
          if (val == null) { F(tag, 'cloze opt missing'); continue; }
          await S('.cloze select').nth(i).selectOption(val);
        }
        break;
      }
      case 'dgfind': for (const id of e.bad) { const ok = await p.evaluate(([sc, id]) => { const g = document.querySelector(sc + ' .dgwrap.pick [data-id="' + id + '"]'); if (!g) return false; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, [scope, id]); if (!ok) F(tag, 'dg id missing ' + id); } break;
      case 'dgfill': for (let i = 0; i < e.blanks.length; i++) await S('.mrow select').nth(i).selectOption(String(e.blanks[i].answer)); break;
      case 'codehunt': for (const i of e.bad) await S('.cl').nth(i).click(); break;
      case 'hunt': for (const i of e.bad) await S('.tok').nth(i).click(); break;
      case 'write': await S('textarea').fill(e.sample); break;
      case 'sql': await S('textarea').fill(e.sample); break;
      case 'api': {
        for (const r of e.sample) {
          await S('select').selectOption(r.method);
          await S('input.in').fill(r.url);
          await S('textarea').nth(0).fill(r.headers || '');
          await S('textarea').nth(1).fill(r.body || '');
          await S('button >> text=Send').click();
        }
        break;
      }
    }
  }

  const chs = await p.evaluate(() => SAQ.chapters.map(c => ({ id: c.id, lesson: c.lesson.map(s => s.check || null), practice: c.practice, test: c.test })));
  for (const ch of chs) {
    if ((only && ch.id !== only) || skipCh) continue;
    for (let i = 0; i < ch.lesson.length; i++) {
      await p.evaluate(([id, i]) => { location.hash = '#/c/' + id + '/l/' + i; }, [ch.id, i]);
      await p.waitForTimeout(30);
      const dgs = await p.evaluate(() => [document.querySelectorAll('.lesson .dg').length, document.querySelectorAll('.lesson .dg svg').length]);
      if (dgs[0] !== dgs[1]) F(`ch${ch.id} l${i}`, 'diagram not rendered ' + dgs);
      const c = ch.lesson[i];
      if (c) {
        const tag = `ch${ch.id} micro${i}`;
        try {
          await solve('.micro', c, tag);
          await p.locator('.micro .btn').click({ timeout: 3000 });
          const t = await p.locator('.micro .fb').textContent();
          if (!/Верно/.test(t)) F(tag, 'not correct: ' + t.slice(0, 40));
        } catch (x) { F(tag, x.message.split('\n')[0]); }
      }
      const next = p.locator('.nav .btn').last();
      if (i < ch.lesson.length - 1) {
        try { await next.click({ timeout: 3000 }); await p.waitForTimeout(30); const h = await p.evaluate(() => location.hash); if (h !== `#/c/${ch.id}/l/${i + 1}`) F(`ch${ch.id} l${i}`, 'next went to ' + h); } catch (x) { F(`ch${ch.id} l${i}`, 'next ' + x.message.split('\n')[0]); }
      }
    }
    for (let i = 0; i < ch.practice.length; i++) {
      const e = ch.practice[i], tag = `ch${ch.id} p${i}(${e.type})`;
      await p.evaluate(([id, i]) => { location.hash = '#/c/' + id + '/p/' + i; }, [ch.id, i]);
      await p.waitForTimeout(30);
      try {
        // hint button
        await p.locator('button >> text=/Подсказка/').click({ timeout: 3000 });
        if (!(await p.locator('.hint').count())) F(tag, 'hint not shown');
        await solve('.exbox', e, tag);
        const chk = p.locator('button.btn >> text=Проверить');
        await chk.click({ timeout: 3000 });
        await p.waitForSelector('.fb.good', { timeout: e.type === 'sql' ? 20000 : 3000 });
        if (!(await p.locator('a.btn:visible >> text=/Дальше|К итогам/').count())) F(tag, 'no next btn after success');
      } catch (x) { F(tag, x.message.split('\n')[0]); }
    }
    // test via UI
    await p.evaluate(([id]) => { location.hash = '#/c/' + id + '/t'; }, [ch.id]);
    await p.waitForTimeout(30);
    try {
      await p.locator('button.btn').click({ timeout: 3000 });
      for (let n = 0; n < ch.test.length; n++) {
        const qh = await p.locator('.qtext').innerHTML();
        const q = ch.test.find(t => t.q === qh) || ch.test.find(t => strip(t.q) === strip(qh));
        if (!q) { F(`ch${ch.id} t${n}`, 'question not found'); break; }
        await solve('.exbox', q, `ch${ch.id} t${n}(${q.type})`);
        await p.locator('button.btn >> text=/Ответить|Завершить/').click({ timeout: 3000 });
      }
      const txt = await p.locator('main').textContent();
      if (!/Тест пройден/.test(txt)) F(`ch${ch.id}`, 'test not passed');
    } catch (x) { F(`ch${ch.id} test`, x.message.split('\n')[0]); }
  }
  if (!only) {
    for (const v of ['', 'cards', 'ref', 'lab', 'atlas', 'profile']) {
      await p.evaluate(v => { location.hash = '#/' + v; }, v); await p.waitForTimeout(80);
      if (!(await p.locator('main h1, main .hero2').count())) F('view ' + v, 'empty');
    }
    await p.evaluate(() => { location.hash = '#/cards'; }); await p.waitForTimeout(50);
    await p.locator('.fc').click(); await p.locator('button >> text=Знал').click();
    if (!(await p.evaluate(() => SAQ.state().stats.rev === 1))) F('cards', 'rev not counted');
    await p.evaluate(() => { location.hash = '#/atlas'; }); await p.waitForTimeout(50);
    const n = await p.locator('.tile').count(); if (n < 10) F('atlas', 'tiles ' + n);
    await p.locator('.tile').first().click(); await p.waitForTimeout(80);
    if (!(await p.locator('.dgwrap svg').count())) F('atlas', 'diagram not shown');
    await p.evaluate(() => { location.hash = '#/lab'; }); await p.waitForTimeout(50);
    await p.locator('textarea').fill('select count(*) c from orders'); await p.locator('button >> text=Выполнить').click(); await p.waitForSelector('.sqlout table', { timeout: 20000 }).catch(() => F('lab', 'sql no result'));
    await p.locator('button.tab >> text=Мини-Postman').click(); await p.locator('button >> text=Send').click();
    if (!(await p.locator('.apires .st').count())) F('lab', 'api no response');
    const cases = await p.evaluate(() => SAQ.cases.map(k => ({ id: k.id, steps: k.steps.map(s => s.task) })));
    for (const k of cases) {
      for (let i = 0; i < k.steps.length; i++) {
        const e = k.steps[i], tag = 'case ' + k.id + ' s' + i + '(' + e.type + ')';
        await p.evaluate(([id, i]) => { location.hash = '#/case/' + id + '/' + (i + 1); }, [k.id, i]);
        await p.waitForTimeout(40);
        try {
          await solve('.exbox', e, tag);
          await p.locator('button.btn >> text=Проверить').click({ timeout: 3000 });
          await p.waitForSelector('.fb.good', { timeout: e.type === 'sql' ? 20000 : 3000 });
          if (!(await p.locator('.art').count())) F(tag, 'model not shown');
        } catch (x) { F(tag, x.message.split('\n')[0]); }
      }
      if (!(await p.evaluate(id => !!SAQ.state().kase[id].fin, k.id))) F('case ' + k.id, 'not finished');
    }
    await p.evaluate(() => { location.hash = '#/mock'; }); await p.waitForTimeout(60);
    try {
      await p.locator('.mockopt b >> text="5 вопросов"').click();
      await p.locator('button >> text=Начать собеседование').click();
      for (let n = 0; n < 5; n++) {
        await p.locator('button >> text=Показать эталон').click({ timeout: 3000 });
        await p.locator('.rate button.r2').click({ timeout: 3000 });
      }
      await p.waitForSelector('.result', { timeout: 3000 });
      const m = await p.evaluate(() => SAQ.state().mock);
      if (!m.length || m[m.length - 1].score !== 100) F('mock', 'result not saved ' + JSON.stringify(m));
    } catch (x) { F('mock', x.message.split('\n')[0]); }
    try {
      await p.evaluate(() => { location.hash = '#/'; }); await p.waitForTimeout(60);
      await p.keyboard.press('Control+k');
      await p.locator('#srch input').fill('идемпотент');
      await p.waitForTimeout(60);
      const n = await p.locator('.sitem').count();
      if (n < 3) F('search', 'few results ' + n);
      await p.keyboard.press('Enter'); await p.waitForTimeout(60);
      const hh = await p.evaluate(() => location.hash);
      if (!/^#\/(c|cards|ref)/.test(hh)) F('search', 'enter went to ' + hh);
    } catch (x) { F('search', x.message.split('\n')[0]); }
    for (const v of ['mock', 'case', 'case/clinic/0']) {
      await p.evaluate(v => { location.hash = '#/' + v; }, v); await p.waitForTimeout(60);
      if (!(await p.locator('main h1').count())) F('view ' + v, 'empty');
    }
    await p.locator('button.theme').click();
    const th = await p.evaluate(() => document.documentElement.getAttribute('data-theme')); if (!th) F('theme', 'not set');
  }
  console.log('FAILS', fails.length); fails.slice(0, 60).forEach(f => console.log(' ', f));
  console.log('ERRS', errs.slice(0, 10));
  await b.close();
})();
