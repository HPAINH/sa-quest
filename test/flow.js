const path = require('path');
const deps = process.env.SAQ_DEPS || '/tmp/saqdeps/node_modules';
const { JSDOM, VirtualConsole } = require(path.join(deps, 'jsdom'));
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole(); let bad = 0;
vc.on('jsdomError', e => { if (/scrollTo|fonts.googleapis/.test(e.message)) return; bad++; console.log('JSERR', e.message); });
JSDOM.fromFile(file, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc, url: 'file://' + file }).then(dom => {
  const w = dom.window, d = w.document;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const $$ = s => [...d.querySelectorAll(s)];
  const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  w.addEventListener('load', async () => {
    await wait(300);
    const ch = w.SAQ.chapters[0];
    ch.lesson.forEach((s, i) => { w.location.hash = '#/c/1/l/' + i; w.SAQ.render(); });
    ok(w.SAQ.lessonDone(ch), 'lesson done after visiting all');
    w.location.hash = '#/c/1/p/1'; w.SAQ.render();
    const e = ch.practice[1];
    $$('.opt').find(b => b._i === e.answer).click();
    $$('.btn').find(b => b.textContent === 'Проверить').click();
    await wait(50);
    ok(d.querySelector('.fb.good'), 'practice correct shows good');
    ok(w.SAQ.state().xp > 0, 'xp awarded');
    function answerTest(q) {
      if (q.type === 'choice' || q.type === 'multi') {
        const set = q.type === 'choice' ? [q.answer] : q.answer;
        $$('.opt').filter(b => set.includes(b._i)).forEach(b => b.click());
      } else if (q.type === 'tf') {
        $$('.segrow').forEach((row, k) => {
          const txt = row.querySelector('.segt').textContent;
          const st = q.statements.find(s => s.t === txt);
          row.querySelectorAll('.seg')[st.v ? 0 : 1].click();
        });
      } else throw new Error('type ' + q.type);
    }
    w.location.hash = '#/c/1/t'; w.SAQ.render();
    ok(/#\/c\/1$/.test(w.location.hash), 'test guarded until practice done');
    w.SAQ.state().all = true; w.location.hash = '#/c/1/t'; w.SAQ.render();
    $$('.btn').find(b => /Начать|Пересдать/.test(b.textContent)).click();
    for (let n = 0; n < ch.test.length; n++) {
      const qtext = d.querySelector('.qtext').innerHTML;
      const q = ch.test.find(t => t.q === qtext) || ch.test.find(t => d.querySelector('.qtext').textContent === t.q.replace(/<[^>]+>/g, ''));
      ok(q, 'found question ' + n);
      answerTest(q);
      const b = $$('.btn').find(b => /Ответить|Завершить/.test(b.textContent));
      ok(b && !b.disabled, 'next enabled ' + n);
      b.click();
    }
    ok(/Тест пройден/.test(d.body.textContent), 'test passed screen');
    ok(w.SAQ.passed(ch), 'passed recorded');
    w.SAQ.state().all = false;
    ok(w.SAQ.unlocked(2), 'chapter 2 unlocked');
    console.log('flow done, failures:', bad, 'xp:', w.SAQ.state().xp);
    process.exit(bad ? 1 : 0);
  });
});
