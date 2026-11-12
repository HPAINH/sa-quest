const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const deps = process.env.SAQ_DEPS || '/tmp/saqdeps/node_modules';
const initSqlJs = require(path.join(deps, 'sql.js'));

const store = {};
const win = {
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
  btoa: s => Buffer.from(s, 'binary').toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString('binary'),
  addEventListener() {},
  scrollTo() {}
};
win.window = win;
win.document = { createElement: () => ({ style: {}, classList: { toggle() {}, add() {} }, append() {}, appendChild() {}, addEventListener() {}, setAttribute() {} }), head: { appendChild() {} }, getElementById: () => null };
win.URL = URL; win.URLSearchParams = URLSearchParams; win.unescape = unescape; win.escape = escape;
const ctx = vm.createContext(win);
const files = ['core', 'exercises', 'extra', 'dsl', 'diagram', 'data/diagrams', 'data/cards', 'data/ref', 'data/cases'].map(f => 'js/' + f + '.js');
for (let i = 1; i <= 25; i++) files.push('js/chapters/ch' + String(i).padStart(2, '0') + '.js');
files.push('js/ext/ext1.js', 'js/ext/ext2.js', 'js/ext/ext3.js', 'js/ext/ext4.js', 'js/ext/ext5.js', 'js/ext/ext6.js');
for (const f of files) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const SAQ = win.SAQ;

let errors = 0, tasks = 0;
const err = m => { errors++; console.log('ERR', m); };

(async () => {
  SAQ._SQL = await initSqlJs();
  if (SAQ.chapters.length !== 25) err('chapters: ' + SAQ.chapters.length);
  const seen = new Set();
  for (const ch of SAQ.chapters) {
    const tag = 'ch' + ch.id;
    if (seen.has(ch.id)) err(tag + ' duplicate');
    seen.add(ch.id);
    if (!ch.title || !ch.summary || !ch.goals.length) err(tag + ' meta');
    if (ch.lesson.length < 3) err(tag + ' lesson sections ' + ch.lesson.length);
    if (ch.practice.length < 6) err(tag + ' practice ' + ch.practice.length);
    if (ch.test.length < 8) err(tag + ' test ' + ch.test.length);
    ch.lesson.forEach((s, i) => {
      if (!s.h || !s.html || s.html.length < 300) err(tag + ' lesson ' + i + ' thin');
      if (s.check) await_check(tag + ' micro' + i, s.check, false);
    });
    for (let i = 0; i < ch.practice.length; i++) await await_check(tag + ' p' + i, ch.practice[i], true);
    for (let i = 0; i < ch.test.length; i++) await await_check(tag + ' t' + i, ch.test[i], false);
  }
  for (const [k, d] of Object.entries(SAQ.diagrams)) { const ve = SAQ.dg.validate(JSON.parse(JSON.stringify(d.spec))); if (ve.length) err('diagram ' + k + ' ' + ve.join(';')); }
  for (const [k, d] of Object.entries(SAQ.diagrams)) { if (d.spec.type === 'bpmn' || d.spec.type === 'activity') SAQ.dg.lint(d.spec).forEach(m => err('lint ' + k + ': ' + m)); }
  if (SAQ.cards.length < 100) err('cards ' + SAQ.cards.length);
  if (!SAQ.cases || SAQ.cases.length < 2) err('cases');
  for (const k of SAQ.cases || []) {
    if (!k.id || !k.title || !k.brief || !k.steps.length) err('case meta ' + k.id);
    for (let i = 0; i < k.steps.length; i++) {
      const st = k.steps[i];
      if (!st.t || !st.model || !st.intro) err('case ' + k.id + ' step ' + i + ' meta');
      await await_check('case ' + k.id + ' s' + i, st.task, true);
    }
  }
  const ids = new Set();
  for (const ch of SAQ.chapters) ch.lesson.forEach((s, i) => { const key = ch.id + ':' + s.h; if (ids.has(key)) err('dup lesson ' + key); ids.add(key); });
  console.log('tasks checked:', tasks, 'errors:', errors);
  process.exit(errors ? 1 : 0);

  function shape(tag, e) {
    const L = e.options && e.options.length;
    switch (e.type) {
      case 'choice': if (!(e.answer >= 0 && e.answer < L)) err(tag + ' answer range'); break;
      case 'multi': if (!e.answer.length || e.answer.some(a => a < 0 || a >= L)) err(tag + ' multi answer'); break;
      case 'tf': if (!e.statements.length) err(tag + ' tf'); break;
      case 'classify': if (e.items.some(i => i.b < 0 || i.b >= e.buckets.length)) err(tag + ' classify bucket'); break;
      case 'order': if (e.items.length < 2) err(tag + ' order'); break;
      case 'match': if (e.pairs.length < 2) err(tag + ' match'); break;
      case 'cloze': {
        const n = (e.text.match(/\{\{\d+\}\}/g) || []).length;
        if (n !== e.blanks.length) err(tag + ' cloze placeholders');
        e.blanks.forEach((b, i) => { if (!(Number.isInteger(b.answer) && b.answer >= 0 && b.answer < b.options.length)) err(tag + ' cloze blank ' + i + ' answer index'); });
        break;
      }
      case 'hunt': if (e.bad.some(i => i < 0 || i >= e.tokens.length)) err(tag + ' hunt idx'); break;
      case 'write': if (!e.rules.length || !e.sample) err(tag + ' write'); break;
      case 'sql': case 'api': break;
      case 'dgfind': case 'dgfill': {
        const ids = SAQ.dg.ids(e.dg);
        const ve = SAQ.dg.validate(JSON.parse(JSON.stringify(e.dg)));
        if (ve.length) err(tag + ' diagram: ' + ve.join(';'));
        if (e.type === 'dgfind') { if (!e.bad.length) err(tag + ' no bad'); e.bad.forEach(b => { if (!ids.includes(b)) err(tag + ' bad id missing ' + b); }); }
        else {
          const nb = SAQ.dg.blanks(e.dg).length;
          if (nb !== e.blanks.length) err(tag + ' blanks ' + nb + ' vs ' + e.blanks.length);
          e.blanks.forEach((b, i) => { if (!(Number.isInteger(b.answer) && b.answer < b.options.length)) err(tag + ' blank ans ' + i); });
        }
        break;
      }
      case 'codehunt': if (!e.bad.length || e.bad.some(i => i < 0 || i >= e.lines.length)) err(tag + ' codehunt idx'); break;
      default: err(tag + ' unknown type ' + e.type);
    }
  }

  async function await_check(tag, e, practice) {
    tasks++;
    if (!e.q) err(tag + ' no q');
    shape(tag, e);
    if (e.dg && e.type !== 'dgfind' && e.type !== 'dgfill') { const ve = SAQ.dg.validate(JSON.parse(JSON.stringify(e.dg))); if (ve.length) err(tag + ' static diagram ' + ve.join(';')); }
    if (practice && (!e.hints || e.hints.length < 1)) err(tag + ' no hints');
    if (practice && !e.explain && e.type !== 'sql') { /* allow */ }
    let r;
    try { r = await SAQ.check(e, SAQ.solution(e)); } catch (x) { return err(tag + ' check threw ' + x.message); }
    if (!r.ok) err(tag + ' solution rejected: ' + JSON.stringify(r).slice(0, 300));
    if (e.type === 'choice') {
      const wrong = e.options.findIndex((o, i) => i !== e.answer);
      if (SAQ.check(e, wrong).ok) err(tag + ' wrong accepted');
    }
    if (e.type === 'write' && SAQ.check(e, 'x').ok) err(tag + ' trivial write accepted');
    if (e.type === 'api' && (await SAQ.check(e, [{ method: 'GET', url: '/nope', headers: '', body: '' }])).ok) err(tag + ' api trivial accepted');
  }
})();
