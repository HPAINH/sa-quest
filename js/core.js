(function () {
  const SAQ = (window.SAQ = {
    chapters: [],
    levels: [
      [0, 'Новичок'], [150, 'Стажёр'], [400, 'Младший аналитик'], [800, 'Junior'],
      [1400, 'Junior+'], [2200, 'Middle-'], [3200, 'Middle'], [4300, 'Senior-'], [5200, 'Senior']
    ],
    parts: {
      I: 'Введение в профессию',
      II: 'Ядро профессии: требования',
      III: 'Моделирование и нотации',
      IV: 'Технический фундамент: данные и SQL',
      V: 'Архитектура и интеграции',
      VI: 'Инструменты повседневной работы',
      VII: 'ИИ в работе аналитика',
      VIII: 'Подготовка к трудоустройству'
    },
    roadmap: [
      [1, 'I', 'Кто такой системный аналитик'], [2, 'I', 'Как учиться: карта компетенций и маршрут'],
      [3, 'II', 'SDLC и место аналитика'], [4, 'II', 'Выявление и сбор требований'],
      [5, 'II', 'Виды требований: функциональные и нефункциональные'], [6, 'II', 'User Story и Use Case'],
      [7, 'II', 'Документирование требований и ТЗ'], [8, 'III', 'Моделирование процессов: BPMN'],
      [9, 'III', 'UML и диаграмма последовательности'], [10, 'III', 'Модели данных и ER-диаграммы'],
      [11, 'IV', 'Базы данных: основы'], [12, 'IV', 'SQL для аналитика'],
      [13, 'V', 'Архитектура приложений'], [14, 'V', 'Интеграции и REST API'],
      [15, 'V', 'Брокеры сообщений'], [16, 'VI', 'Swagger / OpenAPI'], [17, 'VI', 'Postman'],
      [18, 'VI', 'Confluence, Jira и трекеры'], [19, 'VI', 'Методологии разработки'],
      [20, 'VII', 'Основы ИИ и промптинг'], [21, 'VII', 'ИИ для задач аналитика'],
      [22, 'VIII', 'Pet-проект и портфолио'], [23, 'VIII', 'Резюме и сопроводительное письмо'],
      [24, 'VIII', 'Техническое собеседование'], [25, 'VIII', 'Симуляция собеседования']
    ]
  });

  SAQ.register = function (c) {
    SAQ.chapters.push(c);
    SAQ.chapters.sort((a, b) => a.id - b.id);
  };

  SAQ.h = function (tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else if (v === true) el.setAttribute(k, '');
        else if (v !== false && v != null) el.setAttribute(k, v);
      }
    }
    for (const c of kids.flat()) {
      if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return el;
  };

  function hash(s) {
    let h = 1779033703 ^ s.length;
    for (let i = 0; i < s.length; i++) {
      h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  SAQ.perm = function (n, key) {
    const r = rng(hash(String(key)));
    const p = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return p;
  };

  const KEY = 'saq.progress.v1';
  let state = null;
  const blank = () => ({ v: 1, xp: 0, all: false, ch: {}, ach: {}, streak: { last: null, n: 0, best: 0 }, cards: {}, stats: { api: 0, sql: 0, rev: 0, ok: 0, mock: 0, kase: 0 }, theme: null, log: {}, goal: 40, lxp: 0, mock: [], kase: {} });

  function fix(o) {
    const b = blank();
    const st = Object.assign(b, o);
    st.stats = Object.assign(blank().stats, st.stats);
    st.streak = Object.assign({ last: null, n: 0, best: 0 }, st.streak);
    if (typeof st.lxp !== 'number' || st.lxp > st.xp) st.lxp = st.xp;
    if (!st.log || typeof st.log !== 'object') st.log = {};
    if (!Array.isArray(st.mock)) st.mock = [];
    if (!st.kase || typeof st.kase !== 'object') st.kase = {};
    return st;
  }
  SAQ.load = function () {
    try {
      const r = localStorage.getItem(KEY);
      state = fix(r ? JSON.parse(r) : {});
    } catch (e) { state = blank(); }
    return state;
  };
  const day = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  SAQ.today = () => day(new Date());
  SAQ.touch = function () {
    const st = state.streak, t = SAQ.today();
    if (st.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    st.n = st.last === day(y) ? st.n + 1 : 1;
    st.best = Math.max(st.best || 0, st.n);
    st.last = t;
  };
  SAQ.save = function () {
    try {
      SAQ.touch();
      if (state.xp > state.lxp) { const t = SAQ.today(); state.log[t] = (state.log[t] || 0) + state.xp - state.lxp; }
      state.lxp = state.xp;
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  };
  SAQ.state = () => state;
  SAQ.reset = function () { state = blank(); SAQ.save(); };
  SAQ.cs = id => state.ch[id] || (state.ch[id] = { sec: -1, pr: {}, t: null });

  SAQ.exportCode = () => 'SAQ1-' + btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  SAQ.importCode = function (s) {
    try {
      const t = String(s).trim();
      if (!t.startsWith('SAQ1-')) return false;
      const o = JSON.parse(decodeURIComponent(escape(atob(t.slice(5)))));
      if (!o || o.v !== 1 || typeof o.xp !== 'number' || typeof o.ch !== 'object') return false;
      state = fix(o);
      SAQ.save();
      return true;
    } catch (e) { return false; }
  };

  SAQ.levelInfo = function (xp) {
    let i = 0;
    SAQ.levels.forEach((l, k) => { if (xp >= l[0]) i = k; });
    const cur = SAQ.levels[i], nxt = SAQ.levels[i + 1];
    return {
      name: cur[1],
      next: nxt ? nxt[1] : null,
      pct: nxt ? Math.round(((xp - cur[0]) / (nxt[0] - cur[0])) * 100) : 100
    };
  };

  SAQ.lessonDone = ch => SAQ.cs(ch.id).sec >= ch.lesson.length - 1;
  SAQ.prSolved = ch => ch.practice.filter((e, i) => (SAQ.cs(ch.id).pr[i] || {}).ok).length;
  SAQ.prDone = ch => ch.practice.every((e, i) => { const r = SAQ.cs(ch.id).pr[i]; return r && (r.ok || r.seen); });
  SAQ.passed = ch => { const c = SAQ.cs(ch.id); return !!(c.t && c.t.pass); };
  SAQ.unlocked = function (id) {
    if (state.all) return true;
    const i = SAQ.chapters.findIndex(c => c.id === id);
    if (i < 0) return false;
    if (i === 0) return true;
    return SAQ.passed(SAQ.chapters[i - 1]);
  };
})();
