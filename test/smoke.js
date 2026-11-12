const path = require('path');
const deps = process.env.SAQ_DEPS || '/tmp/saqdeps/node_modules';
const { JSDOM, VirtualConsole } = require(path.join(deps, 'jsdom'));
const file = process.argv[2] || path.join(__dirname, '..', 'index.html');
const vc = new VirtualConsole();
let jsErr = 0;
vc.on('jsdomError', e => { if (/scrollTo|fonts.googleapis/.test(e.message)) return; jsErr++; console.log('JSERR', e.message); });
vc.on('error', e => { jsErr++; console.log('CONSOLE.ERROR', e); });
JSDOM.fromFile(file, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc, url: 'file://' + file }).then(dom => {
  const w = dom.window;
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const $ = s => w.document.querySelector(s);
  const $$ = s => [...w.document.querySelectorAll(s)];
  const fail = m => { console.log('FAIL', m); jsErr++; };
  w.addEventListener('load', async () => {
    try {
      await wait(300);
      if (!$('.hero2')) fail('map not rendered');
      if ($$('a.card').length !== 1) fail('only chapter 1 should be open: ' + $$('a.card').length);
      w.SAQ.state().all = true; w.SAQ.save();
      w.location.hash = '#/';
      w.SAQ.render();
      if ($$('a.card').length !== 25) fail('all 25 chapters should be open: ' + $$('a.card').length);
      for (const ch of w.SAQ.chapters) {
        w.location.hash = '#/c/' + ch.id; w.SAQ.render();
        if (!$('h1') || !/Глава/.test($('h1').textContent)) fail('hub ' + ch.id);
        for (let i = 0; i < ch.lesson.length; i++) {
          w.location.hash = '#/c/' + ch.id + '/l/' + i; w.SAQ.render();
          if (!$('.lesson')) fail('lesson ' + ch.id + '/' + i);
          if (ch.lesson[i].check && !$('.micro .exbox *')) fail('micro ' + ch.id + '/' + i);
        }
        for (let i = 0; i < ch.practice.length; i++) {
          w.location.hash = '#/c/' + ch.id + '/p/' + i; w.SAQ.render();
          if (!$('.qtext')) fail('practice ' + ch.id + '/' + i);
        }
        w.location.hash = '#/c/' + ch.id + '/t'; w.SAQ.render();
        if (!$('.btn')) fail('test intro ' + ch.id);
      }
      w.location.hash = '#/profile'; w.SAQ.render();
      if (!$('textarea')) fail('profile');
      w.location.hash = '#/c/1/p/1'; w.SAQ.render();
      const opts = $$('.opt'); 
      if (opts.length) { opts[0].click(); }
      const btns = $$('.btn').filter(b => b.textContent === 'Проверить');
      console.log('practice1 type buttons ok', btns.length);
      const code = w.SAQ.exportCode();
      if (!w.SAQ.importCode(code)) fail('import code');
      console.log('smoke done, errors:', jsErr);
      process.exit(jsErr ? 1 : 0);
    } catch (e) { console.log('EXC', e.stack); process.exit(1); }
  });
});
