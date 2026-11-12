(function () {
  const { h } = SAQ;
  const icon = (n, c) => SAQ.icon(n, c);

  SAQ.achievements = [
    { id: 'first', i: '🌱', t: 'Первый шаг', d: 'Решите первое задание' },
    { id: 'ten', i: '🔟', t: 'Десяточка', d: 'Решите 10 заданий' },
    { id: 'fifty', i: '💪', t: 'Полсотни', d: 'Решите 50 заданий' },
    { id: 'hundred', i: '🏋️', t: 'Сотня', d: 'Решите 100 заданий' },
    { id: 'twohundred', i: '🧗', t: 'Двести', d: 'Решите 200 заданий' },
    { id: 'ch1', i: '🏁', t: 'Первая глава', d: 'Сдайте тест первой главы' },
    { id: 'ch5', i: '🧭', t: 'Пять глав', d: 'Пройдите 5 глав' },
    { id: 'ch12', i: '🚀', t: 'Двенадцать глав', d: 'Пройдите 12 глав' },
    { id: 'ch25', i: '🎓', t: 'Выпускник', d: 'Пройдите все главы' },
    { id: 'sql10', i: '🗃️', t: 'SQL-практик', d: '10 SQL-заданий' },
    { id: 'api10', i: '🔌', t: 'API-практик', d: '10 API-заданий' },
    { id: 'xp500', i: '⭐', t: '500 XP', d: 'Наберите 500 XP' },
    { id: 'xp2000', i: '🌟', t: '2000 XP', d: 'Наберите 2000 XP' },
    { id: 'goal', i: '🎯', t: 'Цель дня', d: 'Выполните дневную цель по XP' },
    { id: 'streak3', i: '🔥', t: 'Серия 3 дня', d: 'Занимайтесь три дня подряд' },
    { id: 'streak7', i: '☄️', t: 'Серия 7 дней', d: 'Неделя без пропусков' },
    { id: 'cards20', i: '🃏', t: 'Карточный игрок', d: 'Правильно ответьте на 20 карточек' },
    { id: 'cards100', i: '🧠', t: 'Память как у слона', d: 'Выучите 30 карточек (уровень 3+)' },
    { id: 'mock1', i: '🎤', t: 'Первое собеседование', d: 'Пройдите симуляцию собеседования' },
    { id: 'mock80', i: '🏆', t: 'Готов к офферу', d: 'Наберите 80% в собеседовании из 10+ вопросов' },
    { id: 'case1', i: '💼', t: 'Первый кейс', d: 'Пройдите сквозной кейс целиком' },
    { id: 'perfect', i: '💯', t: 'Без единой ошибки', d: 'Пройдите тест на 100%' }
  ];
  const passedN = () => SAQ.chapters.filter(c => SAQ.passed(c)).length;
  const cond = {
    first: s => s.stats.ok >= 1, ten: s => s.stats.ok >= 10, fifty: s => s.stats.ok >= 50, hundred: s => s.stats.ok >= 100, twohundred: s => s.stats.ok >= 200,
    ch1: () => SAQ.chapters.some(c => c.id === 1 && SAQ.passed(c)), ch5: () => passedN() >= 5, ch12: () => passedN() >= 12, ch25: () => passedN() >= SAQ.chapters.length,
    sql10: s => s.stats.sql >= 10, api10: s => s.stats.api >= 10, xp500: s => s.xp >= 500, xp2000: s => s.xp >= 2000,
    goal: s => ((s.log || {})[SAQ.today()] || 0) >= (s.goal || 40),
    streak3: s => s.streak.best >= 3, streak7: s => s.streak.best >= 7, cards20: s => s.stats.rev >= 20,
    cards100: s => Object.values(s.cards).filter(c => c.b >= 3).length >= 30,
    mock1: s => (s.mock || []).length >= 1, mock80: s => (s.mock || []).some(m => m.n >= 10 && m.score >= 80),
    case1: s => Object.values(s.kase || {}).some(k => k.fin),
    perfect: () => SAQ.chapters.some(c => { const t = SAQ.cs(c.id).t; return t && t.best === 100; })
  };
  let checking = false;
  SAQ.checkAch = function () {
    if (checking) return;
    checking = true;
    try {
      const s = SAQ.state();
      s.ach = s.ach || {};
      let got = false;
      SAQ.achievements.forEach(a => {
        if (!s.ach[a.id] && cond[a.id](s)) { s.ach[a.id] = SAQ.today(); got = true; SAQ.toast(a.i + ' Достижение: <b>' + a.t + '</b>', 'ach'); }
      });
      if (got) SAQ.save();
    } finally { checking = false; }
  };
  SAQ.hookAch = function () {
    const base = SAQ.save;
    SAQ.save = function () { const r = base.apply(this, arguments); SAQ.checkAch(); return r; };
  };

  const INT = [0, 1, 3, 7, 16];
  const DAY = 86400000;
  const dayNum = () => Math.floor(Date.now() / DAY);
  const TOPIC_CH = { 'Требования': [4, 5, 6, 7], 'BPMN': [8], 'UML': [9], 'ER и БД': [10, 11], 'SQL': [12], 'HTTP и REST': [14], 'Безопасность': [14], 'Спецификации': [16], 'Postman': [17], 'Брокеры': [15], 'Интеграции': [13, 15], 'Документация': [7, 18], 'Собеседование': [23, 24], 'ИИ': [20, 21] };
  SAQ.TOPIC_CH = TOPIC_CH;
  const rateCard = (id, ok) => {
    const s = SAQ.state();
    const r = s.cards[id] || { b: 0, due: 0 };
    r.b = ok ? Math.min(INT.length - 1, r.b + 1) : 0;
    r.due = dayNum() + (ok ? INT[r.b] : 0);
    s.cards[id] = r;
  };

  function head(ico, title, lead) {
    return h('div', { class: 'hubcover p1' }, h('span', { class: 'bigic', html: icon(ico) }), h('div', null, h('h1', null, title), h('p', { class: 'lead' }, lead)));
  }

  function viewCards() {
    const s = SAQ.state();
    const topics = ['Все', ...new Set(SAQ.cards.map(c => c.topic))];
    let topic = 'Все', cur = null, flipped = false;
    const body = h('div');
    const due = c => { const r = s.cards[c.id]; return !r || r.due <= dayNum(); };
    const pool = () => SAQ.cards.filter(c => (topic === 'Все' || c.topic === topic) && due(c));
    const pick = () => {
      const p = pool();
      if (!p.length) return null;
      const b = c => (s.cards[c.id] || { b: -1 }).b;
      p.sort((x, y) => b(x) - b(y));
      const low = p.filter(c => b(c) === b(p[0]));
      return low[Math.floor(Math.random() * low.length)];
    };
    const rate = ok => {
      rateCard(cur.id, ok);
      if (ok) { s.xp += 1; s.stats.rev++; }
      SAQ.save();
      cur = pick(); flipped = false; draw();
    };
    const draw = () => {
      const learned = Object.values(s.cards).filter(c => c.b >= 3).length;
      const left = pool().length;
      const tabs = h('div', { class: 'tabs' }, topics.map(t => h('button', { class: 'tab' + (t === topic ? ' on' : ''), type: 'button', onclick: () => { topic = t; cur = pick(); flipped = false; draw(); } }, t)));
      const bx = h('div');
      if (!cur) {
        bx.append(h('div', { class: 'fc' }, h('div', null, '🎉 На сегодня по этой теме всё', h('div', { class: 'mut' }, 'Карточки вернутся по графику повторений. Выберите другую тему или пройдите собеседование.'))));
      } else {
        const fc = h('div', { class: 'fc' + (flipped ? ' back' : ''), onclick: () => { flipped = true; draw(); } }, flipped ? h('div', null, h('div', { class: 'eyebrow' }, cur.topic + ' · ответ'), h('div', { html: SAQ.esc(cur.a) })) : h('div', null, h('div', { class: 'eyebrow' }, cur.topic), h('div', { style: 'margin:10px 0' }, cur.q), h('div', { class: 'mut' }, 'нажмите или пробел, чтобы увидеть ответ')));
        bx.append(h('div', { class: 'fcard' }, fc),
          flipped ? h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => rate(true) }, '✅ Знал(а)'), h('button', { class: 'btn ghost', type: 'button', onclick: () => rate(false) }, '🔁 Повторить')) :
            h('div', { class: 'row' }, h('button', { class: 'btn ghost', type: 'button', onclick: () => { flipped = true; draw(); } }, 'Показать ответ')));
      }
      const pct = Math.round((learned / SAQ.cards.length) * 100);
      body.replaceChildren(tabs, h('div', { class: 'prhead' }, h('span', { class: 'mut' }, 'К повторению сейчас: ' + left), h('div', { class: 'prprog' }, h('span', { class: 'mut' }, 'Выучено ' + learned + ' из ' + SAQ.cards.length), h('span', { class: 'bar' }, h('i', { style: 'width:' + pct + '%' })))), bx);
    };
    cur = pick();
    draw();
    SAQ.show(head('cards', 'Карточки', 'Интервальные повторения: вспомнили — карточка вернётся через 1, 3, 7, 16 дней; не вспомнили — снова сегодня. +1 XP за верный ответ.'), body);
    const key = ev => {
      if (/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName) || !cur) return;
      if (ev.key === ' ' && !flipped) { ev.preventDefault(); flipped = true; draw(); }
      else if (flipped && (ev.key === '1' || ev.key === 'ArrowRight')) rate(true);
      else if (flipped && (ev.key === '2' || ev.key === 'ArrowLeft')) rate(false);
    };
    document.addEventListener('keydown', key);
    SAQ.onCleanup(() => document.removeEventListener('keydown', key));
  }

  function viewRef() {
    let mode = 'sheets', q = '', sid = SAQ.sheets[0].id;
    const body = h('div');
    const draw = () => {
      const tabs = h('div', { class: 'tabs' },
        h('button', { class: 'tab' + (mode === 'sheets' ? ' on' : ''), type: 'button', onclick: () => { mode = 'sheets'; draw(); } }, 'Шпаргалки (' + SAQ.sheets.length + ')'),
        h('button', { class: 'tab' + (mode === 'gl' ? ' on' : ''), type: 'button', onclick: () => { mode = 'gl'; draw(); } }, 'Глоссарий (' + SAQ.glossary.length + ')'));
      const kids = [tabs];
      if (mode === 'sheets') {
        kids.push(h('div', { class: 'tabs' }, SAQ.sheets.map(x => h('button', { class: 'tab' + (x.id === sid ? ' on' : ''), type: 'button', onclick: () => { sid = x.id; draw(); } }, x.t))));
        const sh = SAQ.sheets.find(x => x.id === sid);
        const el = h('div', { class: 'cb lesson', html: '<h3 style="margin-top:0">' + sh.t + '</h3>' + sh.html });
        SAQ.enhance(el);
        kids.push(h('div', { class: 'card static' }, el));
      } else {
        const inp = h('input', { class: 'in', type: 'search', placeholder: 'Поиск по термину…', value: q });
        inp.addEventListener('input', () => { q = inp.value; list(); });
        const box = h('div', { class: 'gl' });
        const list = () => {
          const k = q.trim().toLowerCase();
          const items = SAQ.glossary.filter(g => !k || g.t.toLowerCase().includes(k) || g.d.toLowerCase().includes(k)).slice().sort((a, b) => a.t.localeCompare(b.t, 'ru'));
          box.replaceChildren(...items.map(g => h('div', { class: 'term' }, h('b', null, g.t), ' — ' + g.d)));
        };
        list();
        kids.push(h('div', { class: 'row' }, inp), box);
      }
      body.replaceChildren(...kids);
    };
    draw();
    SAQ.show(head('ref', 'Справочник', 'Шпаргалки для работы и собеседования и глоссарий терминов. Полнотекстовый поиск по всему материалу — Ctrl+K.'), body);
  }

  function viewLab() {
    let tab = 'sql';
    const body = h('div');
    const draw = () => {
      const tabs = h('div', { class: 'tabs' },
        h('button', { class: 'tab' + (tab === 'sql' ? ' on' : ''), type: 'button', onclick: () => { tab = 'sql'; draw(); } }, 'SQL-песочница'),
        h('button', { class: 'tab' + (tab === 'api' ? ' on' : ''), type: 'button', onclick: () => { tab = 'api'; draw(); } }, 'Мини-Postman'));
      const box = h('div', { class: 'exbox' });
      SAQ.mount(box, tab === 'sql' ? { type: 'sql' } : { type: 'api' }, 'lab-' + tab, () => {});
      body.replaceChildren(tabs, tab === 'api' ? h('p', { class: 'mut' }, 'Свободный режим: тренировочный сервер ничего не проверяет. Токен: Authorization: Bearer demo-token. Описание методов — в блоке «Справочник по API».') : h('p', { class: 'mut' }, 'База интернет-магазина работает прямо в браузере. Разрешены SELECT и WITH.'), h('div', { class: 'task' }, box));
    };
    draw();
    SAQ.show(head('lab', 'Лаборатория', 'Свободная практика без оценок: пишите любые SQL-запросы и отправляйте HTTP-запросы на тренировочный сервер.'), body);
  }

  function viewAtlas(p) {
    const names = Object.keys(SAQ.diagrams);
    const sel = p && p[0] && SAQ.diagrams[p[0]] ? p[0] : null;
    const TN = { bpmn: 'BPMN', seq: 'UML Sequence', state: 'UML State', er: 'ER', arch: 'Архитектура', activity: 'UML Activity' };
    if (sel) {
      const d = SAQ.diagrams[sel];
      const w = h('div');
      w.append(h('div', { class: 'dg', 'data-dg': sel }));
      SAQ.dgMount(w);
      const i = names.indexOf(sel);
      SAQ.showWide(SAQ.crumbs(null, 'Атлас'), h('div', { class: 'eyebrow' }, TN[d.spec.type] || d.spec.type), h('h1', null, d.title), w,
        h('div', { class: 'nav' }, i > 0 ? h('a', { class: 'btn ghost', href: '#/atlas/' + names[i - 1] }, '← ' + SAQ.diagrams[names[i - 1]].title) : h('a', { class: 'btn ghost', href: '#/atlas' }, '← Все диаграммы'),
          i < names.length - 1 ? h('a', { class: 'btn', href: '#/atlas/' + names[i + 1] }, SAQ.diagrams[names[i + 1]].title + ' →') : h('a', { class: 'btn', href: '#/atlas' }, 'Все диаграммы')));
      return;
    }
    SAQ.show(head('atlas', 'Атлас диаграмм', 'Эталонные модели: как они должны выглядеть и как их читать. Каждая проверена по правилам нотации.'),
      h('div', { class: 'tiles' }, names.map(n => h('a', { class: 'tile', href: '#/atlas/' + n, html: '<span class="eyebrow">' + (TN[SAQ.diagrams[n].spec.type] || '') + '</span><b>' + SAQ.diagrams[n].title + '</b><span class="mut">' + SAQ.esc(SAQ.diagrams[n].note || '').slice(0, 110) + '…</span>' }))));
  }

  let M = null;
  const fmt = n => Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
  function viewMock(p, ctx) {
    const s = SAQ.state();
    const topics = ['Все темы', ...new Set(SAQ.cards.map(c => c.topic))];
    if (!M) M = { stage: 'setup', topic: 'Все темы', n: 10, sec: 90 };
    if (M.stage === 'setup') {
      const box = h('div');
      const start = () => {
        const pool = SAQ.cards.filter(c => M.topic === 'Все темы' || c.topic === M.topic);
        const w = c => { const r = s.cards[c.id]; return (r ? r.b : -1) + Math.random() * 2.5; };
        const qs = pool.slice().sort((a, b) => w(a) - w(b)).slice(0, M.n);
        Object.assign(M, { stage: 'q', qs, i: 0, res: [], ans: [] });
        viewMock(p, ctx);
      };
      const draw = () => {
        const opt = (k, v, t, d) => h('button', { class: 'mockopt' + (M[k] === v ? ' on' : ''), type: 'button', onclick: () => { M[k] = v; draw(); } }, h('b', null, t), d ? h('span', { class: 'mut' }, d) : '');
        box.replaceChildren(
          h('h2', null, '1. Тема'), h('div', { class: 'tabs' }, topics.map(t => h('button', { class: 'tab' + (M.topic === t ? ' on' : ''), type: 'button', onclick: () => { M.topic = t; draw(); } }, t))),
          h('h2', null, '2. Длительность'), h('div', { class: 'mockset' }, opt('n', 5, '5 вопросов', 'разминка, ~7 минут'), opt('n', 10, '10 вопросов', 'как первый технический этап'), opt('n', 15, '15 вопросов', 'полный технический этап')),
          h('h2', null, '3. Время на ответ'), h('div', { class: 'mockset' }, opt('sec', 60, '60 секунд', 'короткие чёткие ответы'), opt('sec', 90, '90 секунд', 'стандарт собеседования'), opt('sec', 150, '150 секунд', 'ответ с примером')),
          h('div', { class: 'row' }, h('button', { class: 'btn big', type: 'button', onclick: start, html: icon('play') + 'Начать собеседование' })));
      };
      draw();
      const hist = (s.mock || []).slice(-3).reverse();
      SAQ.show(head('mock', 'Симулятор собеседования', 'Вопросы как на техническом интервью системного аналитика. Отвечайте вслух или письменно, затем сравните с эталоном и честно оцените себя.'),
        h('div', { class: 'card static' }, h('div', { class: 'cb' }, h('b', null, 'Как проходит'), h('ol', null, h('li', null, 'Вопрос и таймер. Ответьте вслух или напишите тезисы.'), h('li', null, 'Откройте эталонный ответ и сравните.'), h('li', null, 'Оцените себя: не знал, частично, знал. Оценка обновляет карточки.'), h('li', null, 'В конце — отчёт по темам и главы, которые стоит повторить.')))),
        box, hist.length ? [h('h2', null, 'Прошлые попытки'), h('div', { class: 'gl' }, hist.map(m => h('div', { class: 'term' }, h('b', null, m.score + '%'), ' · ' + m.date + ' · ' + m.topic + ' · ' + m.n + ' вопросов')))] : '');
      return;
    }
    if (M.stage === 'report') return report();
    const q = M.qs[M.i];
    let left = M.sec, revealed = false;
    const tEl = h('span', { class: 'timer', html: icon('clock') + fmt(left) });
    const ta = h('textarea', { class: 'wr', rows: '4', placeholder: 'Тезисы ответа (необязательно). Лучше проговорить вслух, как на собеседовании.' });
    const ansBox = h('div');
    const btnShow = h('button', { class: 'btn', type: 'button' }, 'Показать эталон');
    const next = v => {
      M.res[M.i] = v;
      rateCard(q.id, v === 2);
      M.i++;
      if (M.i >= M.qs.length) finish(); else viewMock(p, ctx);
    };
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      clearInterval(timer);
      M.ans[M.i] = ta.value;
      btnShow.remove();
      ta.disabled = true;
      ansBox.replaceChildren(h('div', { class: 'mockans' }, h('div', { class: 'eyebrow' }, 'Эталонный ответ'), h('div', null, q.a)),
        h('div', { class: 'mut', style: 'margin:6px 0' }, 'Насколько ваш ответ совпал с эталоном?'),
        h('div', { class: 'rate' },
          h('button', { class: 'btn r0', type: 'button', onclick: () => next(0) }, 'Не знал'),
          h('button', { class: 'btn r1', type: 'button', onclick: () => next(1) }, 'Частично'),
          h('button', { class: 'btn r2', type: 'button', onclick: () => next(2) }, 'Знал')));
    };
    btnShow.addEventListener('click', reveal);
    const timer = setInterval(() => {
      left--;
      tEl.innerHTML = icon('clock') + fmt(Math.max(0, left));
      if (left <= 15) tEl.classList.add('low');
      if (left <= 0) reveal();
    }, 1000);
    ctx.onCleanup(() => clearInterval(timer));
    SAQ.show(SAQ.crumbs(null, 'Собеседование'),
      h('div', { class: 'mockq' },
        h('div', { class: 'mockbar' }, h('span', { class: 'tnum' }, 'Вопрос ' + (M.i + 1) + ' из ' + M.qs.length), h('span', { class: 'bar' }, h('i', { style: 'width:' + Math.round((M.i / M.qs.length) * 100) + '%' })), tEl),
        h('span', { class: 'ttype' }, q.topic),
        h('div', { class: 'qq' }, q.q), ta, h('div', { class: 'row' }, btnShow, h('button', { class: 'btn ghost', type: 'button', onclick: () => { M = null; SAQ.render(); } }, 'Прервать')), ansBox));
  }
  function finish() {
    const s = SAQ.state();
    const sum = M.res.reduce((a, b) => a + b, 0);
    const score = Math.round((sum / (2 * M.qs.length)) * 100);
    const gain = M.res.reduce((a, v) => a + (v === 2 ? 2 : v === 1 ? 1 : 0), 0) + 5;
    s.xp += gain;
    s.stats.mock = (s.stats.mock || 0) + 1;
    s.mock = (s.mock || []).concat([{ date: SAQ.today(), score, n: M.qs.length, topic: M.topic }]).slice(-30);
    M.stage = 'report'; M.score = score; M.gain = gain;
    SAQ.save();
    SAQ.toast('+' + gain + ' XP за собеседование', 'xp');
    if (score >= 80) SAQ.confetti();
    report();
  }
  function report() {
    const by = {};
    M.qs.forEach((q, i) => { const t = by[q.topic] || (by[q.topic] = { s: 0, n: 0 }); t.s += M.res[i]; t.n += 2; });
    const weak = M.qs.map((q, i) => ({ q, v: M.res[i], a: M.ans[i] })).filter(x => x.v < 2);
    const chs = new Set();
    weak.forEach(x => (TOPIC_CH[x.q.topic] || []).forEach(id => chs.add(id)));
    const verdict = M.score >= 80 ? 'Уверенный уровень' : M.score >= 55 ? 'Хорошая база, есть пробелы' : 'Пока рано идти на собеседование';
    const sub = M.score >= 80 ? 'Можно откликаться на вакансии и проходить технические интервью.' : M.score >= 55 ? 'Повторите темы ниже и пройдите собеседование ещё раз.' : 'Пройдите отмеченные главы и вернитесь к симулятору.';
    SAQ.show(SAQ.crumbs(null, 'Отчёт'),
      h('div', { class: 'result ' + (M.score >= 55 ? 'good' : 'bad') }, SAQ.ring(M.score, 120, 10, '<b>' + M.score + '%</b><small>' + M.qs.length + ' вопросов</small>', M.score >= 80 ? 'done' : M.score >= 55 ? '' : 'fail'),
        h('div', null, h('div', { class: 'eyebrow' }, 'Отчёт о собеседовании · ' + M.topic), h('h1', null, verdict), h('p', { class: 'lead' }, sub + ' +' + M.gain + ' XP.'),
          h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { M = null; SAQ.render(); } }, 'Новое собеседование'), h('a', { class: 'btn ghost', href: '#/cards' }, 'К карточкам')))),
      h('h2', null, 'Результат по темам'),
      h('div', { class: 'card static' }, h('div', { class: 'cb' }, Object.entries(by).map(([t, v]) => { const pc = Math.round((v.s / v.n) * 100); return h('div', { class: 'topicbar' }, h('span', null, t), h('span', { class: 'bar' }, h('i', { style: 'width:' + pc + '%' })), h('b', null, pc + '%')); }))),
      chs.size ? [h('h2', null, 'Что повторить'), h('div', { class: 'pills' }, [...chs].sort((a, b) => a - b).map(id => { const c = SAQ.chapters.find(x => x.id === id); return c ? h('a', { class: 'pill tag', href: '#/c/' + id }, 'Глава ' + id + '. ' + c.title) : ''; }))] : '',
      weak.length ? [h('h2', null, 'Вопросы с пробелами'), ...weak.map(x => h('div', { class: 'rev ' + (x.v === 1 ? '' : 'bad') }, h('b', null, (x.v === 1 ? '◐ ' : '✗ ') + x.q.q), h('div', { class: 'mut', style: 'margin-top:4px' }, x.q.a), x.a ? h('div', { class: 'mut', style: 'margin-top:4px' }, 'Ваш ответ: ' + x.a) : ''))] : h('p', null, 'Все ответы на «знал» — отличный результат.'));
  }

  function viewCase(p) {
    const s = SAQ.state();
    const list = SAQ.cases || [];
    const k = p && p[0] ? list.find(c => c.id === p[0]) : null;
    if (!k) {
      SAQ.show(head('kase', 'Сквозные кейсы', 'Реальная задача от бизнеса целиком: стейкхолдеры, вопросы, требования, процесс, данные, API и проверка SQL. Так выглядит тестовое задание и первая задача на работе.'),
        h('div', { class: 'kases' }, list.map(c => {
          const st = s.kase[c.id] || {};
          const done = Object.keys(st.done || {}).length;
          return h('a', { class: 'kcard p' + (c.part || 1), href: '#/case/' + c.id },
            h('div', { class: 'eyebrow' }, c.tag), h('h3', null, c.title), h('div', { class: 'mut' }, c.short),
            h('div', { class: 'pills' }, h('span', { class: 'pill' + (st.fin ? ' ok' : ''), html: icon('list') + done + '/' + c.steps.length + ' этапов' }), h('span', { class: 'pill', html: icon('clock') + c.time })),
            h('span', { class: 'bar' }, h('i', { style: 'width:' + Math.round((done / c.steps.length) * 100) + '%' })));
        })));
      return;
    }
    const st = s.kase[k.id] || (s.kase[k.id] = { done: {}, fin: false });
    st.done = st.done || {};
    const i = Math.max(0, Math.min(Number(p[1] || 0), k.steps.length));
    const steps = h('div', { class: 'ksteps' },
      h('a', { class: 'kstep' + (i === 0 ? ' on' : ''), href: '#/case/' + k.id + '/0', html: '<span class="kn">' + icon('book') + '</span>Бриф' }),
      k.steps.map((x, j) => h('a', { class: 'kstep' + (i === j + 1 ? ' on' : '') + (st.done[j] ? ' ok' : ''), href: '#/case/' + k.id + '/' + (j + 1), html: '<span class="kn">' + (st.done[j] ? icon('check') : j + 1) + '</span>' + x.t })));
    if (i === 0) {
      const brief = h('div', { class: 'kbrief lesson', html: k.brief });
      SAQ.dgMount(brief);
      SAQ.enhance(brief);
      SAQ.showWide(SAQ.crumbs(null, 'Кейсы'), h('div', { class: 'eyebrow' }, k.tag), h('h1', null, k.title), steps, brief,
        h('div', { class: 'row' }, h('a', { class: 'btn big', href: '#/case/' + k.id + '/1', html: 'Начать: ' + k.steps[0].t + icon('arrow') })));
      return;
    }
    const step = k.steps[i - 1], e = step.task;
    const box = h('div', { class: 'exbox' }), fb = h('div', { class: 'fb' }), model = h('div');
    const btn = h('button', { class: 'btn', type: 'button', disabled: true }, 'Проверить');
    const btnShow = h('button', { class: 'btn ghost', type: 'button' }, 'Показать решение');
    let ans = null;
    const ctl = SAQ.mount(box, e, 'k' + k.id + '-' + i, a => { ans = a; btn.disabled = !SAQ.ready(e, a); });
    const nextLink = i < k.steps.length ? h('a', { class: 'btn', href: '#/case/' + k.id + '/' + (i + 1), html: 'Дальше: ' + k.steps[i].t + icon('arrow') }) : h('a', { class: 'btn', href: '#/case', html: 'Ко всем кейсам' + icon('arrow') });
    nextLink.style.display = 'none';
    const showModel = () => {
      const m = h('div', { class: 'art' }, h('div', { class: 'ah', html: icon('check') + 'Как это сделал бы опытный аналитик' }), h('div', { class: 'ab lesson', html: step.model }));
      SAQ.dgMount(m);
      SAQ.enhance(m);
      model.replaceChildren(m);
      nextLink.style.display = '';
    };
    const markDone = () => {
      if (!st.done[i - 1]) { st.done[i - 1] = true; s.xp += 15; SAQ.toast('+15 XP за этап кейса', 'xp'); }
      if (Object.keys(st.done).length === k.steps.length && !st.fin) { st.fin = true; s.stats.kase = (s.stats.kase || 0) + 1; s.xp += 50; SAQ.confetti(); SAQ.toast('💼 Кейс пройден: +50 XP', 'xp'); }
      SAQ.save();
    };
    btn.addEventListener('click', () => {
      btn.disabled = true;
      Promise.resolve(SAQ.check(e, ans)).then(r => {
        SAQ.anim(box, r.ok);
        if (r.ok) {
          fb.className = 'fb good'; fb.innerHTML = '✅ Этап выполнен. ' + (r.html || '');
          ctl.lock(); ctl.show(SAQ.solution(e), ans); btn.style.display = 'none'; btnShow.style.display = 'none'; markDone(); showModel();
        } else {
          fb.className = 'fb bad'; fb.innerHTML = '❌ ' + SAQ.fbHtml(e, r);
          btn.disabled = !SAQ.ready(e, ans);
        }
      });
    });
    btnShow.addEventListener('click', () => { ctl.show(SAQ.solution(e), ans); ctl.lock(); btn.style.display = 'none'; btnShow.style.display = 'none'; showModel(); });
    if (st.done[i - 1]) { ctl.show(SAQ.solution(e), SAQ.solution(e)); ctl.lock(); btn.style.display = 'none'; btnShow.style.display = 'none'; fb.className = 'fb good'; fb.textContent = '✅ Этап выполнен ранее.'; showModel(); }
    const intro = h('div', { class: 'lesson', html: step.intro });
    SAQ.dgMount(intro);
    SAQ.enhance(intro);
    SAQ.showWide(SAQ.crumbs(null, 'Кейсы'), h('div', { class: 'eyebrow' }, k.title), steps,
      h('section', { class: 'task' }, h('div', { class: 'taskmeta' }, h('span', { class: 'tnum' }, 'Этап ' + i + ' из ' + k.steps.length), h('span', { class: 'ttype' }, step.t)),
        intro, h('div', { class: 'qtext', html: e.q }), box, h('div', { class: 'row' }, btn, btnShow), fb, model, h('div', { class: 'row' }, nextLink)));
  }

  SAQ.views.cards = viewCards;
  SAQ.views.ref = viewRef;
  SAQ.views.lab = viewLab;
  SAQ.views.atlas = viewAtlas;
  SAQ.views.mock = viewMock;
  SAQ.views.case = viewCase;
})();
