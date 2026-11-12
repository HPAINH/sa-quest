(function () {
  const { h } = SAQ;
  const app = () => document.getElementById('app');
  let T = null;
  let cleanups = [];
  SAQ.views = {};

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  SAQ.esc = esc;

  const IC = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    cards: '<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 0 1 2 2v13"/>',
    mock: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4"/>',
    kase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    ref: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M8 7h7M8 11h5"/>',
    lab: '<path d="M9 3h6"/><path d="M10 3v6L4.3 18.6A1.6 1.6 0 0 0 5.7 21h12.6a1.6 1.6 0 0 0 1.4-2.4L14 9V3"/><path d="M7.2 15h9.6"/>',
    atlas: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.6-2.4-5.7-4-8.2-.6 2-1.6 3-3 3.5.4-3-1-6-4-8.5.3 4-3 6.3-3 11.2C5 19.3 8 22 12 22z"/>',
    book: '<path d="M2 5h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H2z"/><path d="M22 5h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>'
  };
  const icon = (n, cls) => '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[n] || '') + '</svg>';
  SAQ.icon = icon;

  SAQ.ring = function (pct, size, stroke, inner, cls) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return h('span', { class: 'ring ' + (cls || ''), style: 'width:' + size + 'px;height:' + size + 'px', html:
      '<svg viewBox="0 0 ' + size + ' ' + size + '" width="' + size + '" height="' + size + '"><circle class="rb" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '"/>' +
      '<circle class="rf" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="' + stroke + '" stroke-dasharray="' + (c * Math.max(0, Math.min(100, pct))) / 100 + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg><span class="ri">' + (inner == null ? '' : inner) + '</span>' });
  };

  SAQ.toast = function (msg, kind) {
    let box = document.getElementById('toasts');
    if (!box) { box = h('div', { id: 'toasts' }); document.body.appendChild(box); }
    const t = h('div', { class: 'toast ' + (kind || ''), html: msg });
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3200);
    setTimeout(() => t.remove(), 3700);
  };

  SAQ.confetti = function () {
    const box = h('div', { class: 'confetti' });
    const colors = ['#6d7cff', '#a35cff', '#22c55e', '#f5a524', '#ff5d8f', '#22d3ee'];
    for (let i = 0; i < 80; i++) {
      box.appendChild(h('i', { style: 'left:' + Math.random() * 100 + '%;background:' + colors[i % colors.length] + ';animation-delay:' + Math.random() * 0.6 + 's;animation-duration:' + (2 + Math.random() * 1.8) + 's' }));
    }
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 4500);
  };

  const NAV = [['', 'Главная', 'home'], ['mock', 'Собеседование', 'mock'], ['case', 'Кейсы', 'kase'], ['cards', 'Карточки', 'cards'], ['ref', 'Справочник', 'ref'], ['lab', 'Лаборатория', 'lab'], ['atlas', 'Атлас', 'atlas']];
  const TABS = [['', 'Главная', 'home'], ['cards', 'Карточки', 'cards'], ['mock', 'Собес', 'mock'], ['ref', 'Справка', 'ref'], ['profile', 'Профиль', 'profile']];

  const curRoute = () => (location.hash.replace(/^#\/?/, '').split('/')[0]) || '';
  const isOn = (k, cur) => k === cur || (k === '' && (cur === 'c' || cur === 'map'));

  function topbar() {
    const s = SAQ.state(), li = SAQ.levelInfo(s.xp), cur = curRoute();
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    return h('header', { class: 'top' },
      h('a', { class: 'logo', href: '#/', html: '<span class="lg">SA</span><span class="lt">Quest</span>' }),
      h('nav', { class: 'nav-main' }, NAV.map(([k, t]) => h('a', { class: isOn(k, cur) ? 'on' : '', href: '#/' + k }, t))),
      h('button', { class: 'searchbtn', type: 'button', title: 'Поиск (Ctrl+K)', onclick: openSearch, html: icon('search') + '<span>Поиск</span><kbd>Ctrl K</kbd>' }),
      h('a', { class: 'xpmini', href: '#/profile', title: 'Профиль' },
        h('span', { class: 'streakmini', html: icon('flame') + (s.streak.n || 0) }),
        h('span', { class: 'xpbox' }, h('span', { class: 'lvlname' }, li.name), h('span', { class: 'bar' }, h('i', { style: 'width:' + li.pct + '%' }))),
        h('span', { class: 'xpn' }, s.xp + ' XP')),
      h('button', { class: 'theme', type: 'button', title: 'Сменить тему', onclick: toggleTheme, html: icon(dark ? 'sun' : 'moon') }));
  }

  function tabbar() {
    const cur = curRoute();
    return h('nav', { class: 'tabbar' }, TABS.map(([k, t, i]) => h('a', { class: isOn(k, cur) ? 'on' : '', href: '#/' + k, html: icon(i) + '<span>' + t + '</span>' })));
  }

  function applyTheme() {
    const st = SAQ.state();
    const t = st && st.theme;
    const th = t || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', th);
    const m = document.querySelector('meta[name=theme-color]');
    if (m) m.setAttribute('content', th === 'light' ? '#f6f7fb' : '#0a0d14');
  }
  function toggleTheme() {
    const s = SAQ.state();
    s.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    SAQ.save();
    applyTheme();
    const b = document.querySelector('button.theme');
    if (b) b.innerHTML = icon(s.theme === 'light' ? 'moon' : 'sun');
  }

  function centerCur() {
    app().querySelectorAll('.chip.cur, .kstep.on').forEach(c => {
      const p = c.parentNode;
      if (p.scrollWidth > p.clientWidth) p.scrollLeft = c.offsetLeft - p.clientWidth / 2 + c.clientWidth / 2;
    });
  }
  function show(...nodes) {
    app().replaceChildren(topbar(), h('main', { class: 'wrap' }, ...nodes), tabbar());
    centerCur();
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  SAQ.show = show;
  function showWide(...nodes) {
    app().replaceChildren(topbar(), h('main', { class: 'wrap wide' }, ...nodes), tabbar());
    centerCur();
    try { window.scrollTo(0, 0); } catch (e) {}
  }
  SAQ.showWide = showWide;

  function crumbs(ch, tail) {
    return h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'Главная'),
      ch ? [' / ', h('a', { href: '#/c/' + ch.id }, 'Глава ' + ch.id)] : '', tail ? ' / ' + tail : '');
  }
  SAQ.crumbs = crumbs;

  const partOf = id => (SAQ.roadmap.find(r => r[0] === id) || [])[1];
  const PARTN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
  SAQ.partOf = partOf;

  function chPct(ch) {
    const cs = SAQ.cs(ch.id);
    const l = Math.max(0, cs.sec + 1) / ch.lesson.length;
    const p = SAQ.prSolved(ch) / ch.practice.length;
    return Math.round((l * 0.3 + p * 0.5 + (SAQ.passed(ch) ? 0.2 : 0)) * 100);
  }
  SAQ.chPct = chPct;

  const words = html => html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const mins = ch => Math.max(1, Math.round(ch.lesson.reduce((a, s) => a + words(s.html), 0) / 150));

  function nextStep() {
    for (const ch of SAQ.chapters) {
      if (SAQ.passed(ch)) continue;
      if (!SAQ.unlocked(ch.id)) continue;
      const cs = SAQ.cs(ch.id);
      if (!SAQ.lessonDone(ch)) return { ch, href: '#/c/' + ch.id + '/l/' + Math.max(0, Math.min(cs.sec + 1, ch.lesson.length - 1)), sub: 'Урок · раздел ' + (Math.max(0, cs.sec + 1) + 1) + ' из ' + ch.lesson.length };
      if (!SAQ.prDone(ch)) {
        const k = ch.practice.findIndex((x, j) => !((cs.pr[j] || {}).ok || (cs.pr[j] || {}).seen));
        return { ch, href: '#/c/' + ch.id + '/p/' + Math.max(0, k), sub: 'Практика · решено ' + SAQ.prSolved(ch) + ' из ' + ch.practice.length };
      }
      return { ch, href: '#/c/' + ch.id + '/t', sub: 'Итоговый тест · порог 80%' };
    }
    return null;
  }

  const dayKey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function heatmap(weeks) {
    const s = SAQ.state(), log = s.log || {};
    const end = new Date(); end.setHours(0, 0, 0, 0);
    const start = new Date(end); start.setDate(end.getDate() - (weeks * 7 - 1) - ((end.getDay() + 6) % 7 === 6 ? 0 : 0));
    const shift = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - shift);
    const cells = [];
    let total = 0, active = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const v = log[dayKey(d)] || 0;
      total += v; if (v) active++;
      const lv = v === 0 ? 0 : v < 15 ? 1 : v < 40 ? 2 : v < 80 ? 3 : 4;
      cells.push(h('i', { class: 'hm l' + lv, title: d.toLocaleDateString('ru-RU') + ': ' + v + ' XP' }));
    }
    return h('div', { class: 'heat' },
      h('div', { class: 'heathead' }, h('b', null, 'Активность'), h('span', { class: 'mut' }, active + ' дн. с занятиями · ' + total + ' XP за ' + weeks + ' нед.')),
      h('div', { class: 'hmgrid' }, cells),
      h('div', { class: 'hmleg' }, 'меньше', ...[0, 1, 2, 3, 4].map(k => h('i', { class: 'hm l' + k })), 'больше'));
  }
  SAQ.heatmap = heatmap;

  function todayCard() {
    const s = SAQ.state(), li = SAQ.levelInfo(s.xp);
    const t = (s.log || {})[SAQ.today()] || 0, g = s.goal || 40;
    const done = t >= g;
    return h('div', { class: 'today' },
      h('div', { class: 'tdgoal' }, SAQ.ring(Math.round((t / g) * 100), 112, 10, '<b>' + t + '</b><small>из ' + g + ' XP</small>', done ? 'done' : ''),
        h('div', null, h('div', { class: 'eyebrow' }, 'Цель дня'), h('b', { class: 'tdt' }, done ? 'Выполнена' : 'Осталось ' + (g - t) + ' XP'), h('div', { class: 'mut' }, 'задание ≈ 10 XP, карточка 1 XP'))),
      h('div', { class: 'tdrow' },
        h('div', { class: 'tdi', html: icon('flame', 'fl') + '<div><b>' + (s.streak.n || 0) + '</b><span>дней подряд · рекорд ' + (s.streak.best || 0) + '</span></div>' }),
        h('div', { class: 'tdi', html: icon('trophy', 'tr') + '<div><b>' + li.name + '</b><span>' + s.xp + ' XP' + (li.next ? ' · до «' + li.next + '» ' + (100 - li.pct) + '%' : '') + '</span></div>' })),
      h('div', { class: 'bar lvl' }, h('i', { style: 'width:' + li.pct + '%' })));
  }

  function viewHome() {
    const s = SAQ.state();
    const total = SAQ.chapters.reduce((a, c) => a + c.practice.length, 0);
    const solved = SAQ.chapters.reduce((a, c) => a + SAQ.prSolved(c), 0);
    const passed = SAQ.chapters.filter(c => SAQ.passed(c)).length;
    const lessons = SAQ.chapters.reduce((a, c) => a + c.lesson.length, 0);
    const ns = nextStep();
    const achN = Object.keys(s.ach || {}).length, achT = (SAQ.achievements || []).length;
    const hero = h('section', { class: 'hero2' },
      h('div', { class: 'hero-l' },
        h('div', { class: 'eyebrow' }, 'Тренажёр системного аналитика'),
        h('h1', null, 'От нуля до ', h('span', { class: 'grad' }, 'оффера джуна')),
        h('p', { class: 'lead' }, SAQ.chapters.length + ' глав, ' + lessons + ' разделов теории и ' + total + ' практических заданий: требования, BPMN, UML, ER, SQL, REST API и собеседования.'),
        h('div', { class: 'row' },
          ns ? h('a', { class: 'btn big', href: ns.href, html: 'Продолжить: глава ' + ns.ch.id + icon('arrow') }) : h('a', { class: 'btn big', href: '#/mock', html: 'Пройти собеседование' + icon('arrow') }),
          h('a', { class: 'btn ghost big', href: '#/mock', html: icon('mock') + 'Собеседование' })),
        ns ? h('div', { class: 'mut nextsub' }, ns.ch.title + ' · ' + ns.sub) : ''),
      h('div', { class: 'hero-r' }, todayCard()));
    const stat = (n, t, i) => h('div', { class: 'stat', html: icon(i) + '<div><b>' + n + '</b><span>' + t + '</span></div>' });
    const stats = h('div', { class: 'stats' }, stat(passed + '/' + SAQ.chapters.length, 'глав пройдено', 'flag'), stat(solved + '/' + total, 'заданий решено', 'check'), stat(Object.values(s.cards || {}).filter(c => c.b >= 3).length + '/' + (SAQ.cards || []).length, 'карточек выучено', 'cards'), stat(achN + '/' + achT, 'достижений', 'trophy'));
    const tile = (href, ico, t, d, cls) => h('a', { class: 'tile ' + (cls || ''), href, html: '<span class="ti">' + icon(ico) + '</span><b>' + t + '</b><span class="mut">' + d + '</span>' });
    const tiles = h('div', { class: 'tiles' },
      tile('#/mock', 'mock', 'Симулятор собеседования', 'вопросы на время, самооценка и отчёт по слабым темам', 't1'),
      tile('#/case', 'kase', 'Сквозные кейсы', 'от бизнес-запроса до требований, BPMN, ER, API и SQL', 't2'),
      tile('#/cards', 'cards', 'Карточки', (SAQ.cards || []).length + ' вопросов с интервальным повторением', 't3'),
      tile('#/ref', 'ref', 'Справочник', 'глоссарий и шпаргалки по HTTP, SQL, BPMN, UML, OpenAPI', 't4'),
      tile('#/lab', 'lab', 'Лаборатория', 'свободные SQL-песочница и мини-Postman', 't5'),
      tile('#/atlas', 'atlas', 'Атлас диаграмм', Object.keys(SAQ.diagrams || {}).length + ' эталонных диаграмм с разбором', 't6'));
    const path = h('div', { class: 'path' });
    const partsSeen = [];
    SAQ.roadmap.forEach(r => { if (!partsSeen.includes(r[1])) partsSeen.push(r[1]); });
    partsSeen.forEach(p => {
      const ids = SAQ.roadmap.filter(r => r[1] === p).map(r => r[0]);
      const chs = ids.map(id => SAQ.chapters.find(c => c.id === id)).filter(Boolean);
      const pp = chs.length ? Math.round(chs.reduce((a, c) => a + chPct(c), 0) / chs.length) : 0;
      const grid = h('div', { class: 'pgrid' });
      chs.forEach(ch => {
        const id = ch.id, open = SAQ.unlocked(id), cs = SAQ.cs(id), pass = SAQ.passed(ch), pct = chPct(ch);
        grid.append(h(open ? 'a' : 'div', { class: 'card' + (open ? '' : ' lock') + (pass ? ' done' : ''), href: open ? '#/c/' + id : null },
          SAQ.ring(pct, 52, 5, pass ? icon('check') : open ? '<b>' + id + '</b>' : icon('lock')),
          h('div', { class: 'cb' }, h('b', null, ch.title), h('div', { class: 'mut clamp' }, ch.summary),
            open ? h('div', { class: 'pills' },
              h('span', { class: 'pill' + (SAQ.lessonDone(ch) ? ' ok' : ''), html: icon('book') + Math.max(0, cs.sec + 1) + '/' + ch.lesson.length }),
              h('span', { class: 'pill' + (SAQ.prDone(ch) ? ' ok' : ''), html: icon('play') + SAQ.prSolved(ch) + '/' + ch.practice.length }),
              h('span', { class: 'pill' + (pass ? ' ok' : ''), html: icon('flag') + (cs.t ? cs.t.best + '%' : '—') }),
              h('span', { class: 'pill ghostp', html: icon('clock') + mins(ch) + ' мин' })) : h('div', { class: 'mut' }, 'Откроется после теста предыдущей главы'))));
      });
      path.append(h('section', { class: 'part p' + PARTN[p] },
        h('div', { class: 'parthead' }, h('span', { class: 'pnum' }, p), h('div', null, h('b', null, SAQ.parts[p]), h('div', { class: 'mut' }, chs.length + ' ' + (chs.length === 1 ? 'глава' : chs.length < 5 ? 'главы' : 'глав'))), h('span', { class: 'pbar' }, h('i', { style: 'width:' + pp + '%' })), h('span', { class: 'ppct' }, pp + '%')),
        grid));
    });
    showWide(hero, stats, h('div', { class: 'two' }, heatmap(18), h('div', { class: 'modes' }, h('h2', { class: 'sec' }, 'Режимы подготовки'), tiles)), h('h2', { class: 'sec' }, 'Путь обучения'), path);
  }

  function viewHub(ch) {
    const cs = SAQ.cs(ch.id);
    const lessonOk = SAQ.lessonDone(ch), prOk = SAQ.prDone(ch), pass = SAQ.passed(ch), all = SAQ.state().all;
    const stage = (n, ico, title, desc, href, on, status, done) => h(on ? 'a' : 'div', { class: 'stage' + (on ? '' : ' lock') + (done ? ' done' : ''), href: on ? href : null },
      h('div', { class: 'stn' }, done ? h('span', { html: icon('check') }) : String(n)),
      h('div', { class: 'sti', html: icon(on ? ico : 'lock') }),
      h('div', null, h('b', null, title), h('div', { class: 'mut' }, desc), h('div', { class: 'sts' }, status)));
    const next = SAQ.chapters.find(c => c.id === ch.id + 1);
    const p = partOf(ch.id);
    const types = {};
    ch.practice.forEach(e => { types[e.type] = (types[e.type] || 0) + 1; });
    const TN = { sql: 'SQL', api: 'API', dgfind: 'диаграммы', dgfill: 'диаграммы', codehunt: 'код', write: 'письменные' };
    const tags = [...new Set(Object.keys(types).map(t => TN[t]).filter(Boolean))];
    show(crumbs(ch),
      h('div', { class: 'hubcover p' + PARTN[p] },
        SAQ.ring(chPct(ch), 92, 8, '<b>' + chPct(ch) + '%</b>', 'big'),
        h('div', null, h('div', { class: 'eyebrow' }, 'Часть ' + p + ' · ' + SAQ.parts[p]), h('h1', null, 'Глава ' + ch.id + '. ' + ch.title), h('p', { class: 'lead' }, ch.summary),
          h('div', { class: 'pills' }, h('span', { class: 'pill', html: icon('book') + ch.lesson.length + ' разделов' }), h('span', { class: 'pill', html: icon('clock') + '~' + mins(ch) + ' мин чтения' }), h('span', { class: 'pill', html: icon('play') + ch.practice.length + ' заданий' }), ...tags.map(t => h('span', { class: 'pill tag' }, t))))),
      h('div', { class: 'card static goals' }, h('div', { class: 'cb' }, h('b', { html: icon('target') + ' К концу главы вы сможете' }), h('ul', null, ch.goals.map(g => h('li', { html: g }))))),
      h('div', { class: 'stages' },
        stage(1, 'book', 'Урок', ch.lesson.length + ' разделов с примерами, диаграммами и проверкой себя', '#/c/' + ch.id + '/l/' + Math.max(0, Math.min(cs.sec + 1, ch.lesson.length - 1)), true, 'Прочитано ' + Math.max(0, cs.sec + 1) + ' из ' + ch.lesson.length, lessonOk),
        stage(2, 'play', 'Практика', ch.practice.length + ' заданий с подсказками и разбором', '#/c/' + ch.id + '/p/0', lessonOk || all, lessonOk || all ? 'Решено ' + SAQ.prSolved(ch) + ' из ' + ch.practice.length : 'Откроется после урока', prOk),
        stage(3, 'flag', 'Итоговый тест', ch.test.length + ' вопросов без подсказок, порог 80%', '#/c/' + ch.id + '/t', prOk || all, prOk || all ? (cs.t ? 'Лучший результат ' + cs.t.best + '%' + (pass ? ' · пройден' : '') : 'Ещё не сдавался') : 'Откроется после практики', pass)),
      h('div', { class: 'card static toclist' }, h('div', { class: 'cb' }, h('b', { html: icon('list') + ' Содержание урока' }),
        h('ol', null, ch.lesson.map((s, k) => h('li', { class: k <= cs.sec ? 'seen' : '' }, h('a', { href: '#/c/' + ch.id + '/l/' + k }, s.h)))))),
      pass && next ? h('a', { class: 'btn', href: '#/c/' + next.id, html: 'Следующая глава' + icon('arrow') }) : '');
  }

  function microCheck(c, key) {
    const box = h('div', { class: 'exbox' }), fb = h('div', { class: 'fb' });
    let ans = null;
    const btn = h('button', { class: 'btn sm', type: 'button', disabled: true }, 'Проверить');
    const ctl = SAQ.mount(box, c, key, a => { ans = a; btn.disabled = !SAQ.ready(c, a); });
    btn.addEventListener('click', () => {
      const r = SAQ.check(c, ans);
      fb.className = 'fb ' + (r.ok ? 'good' : 'bad');
      fb.innerHTML = (r.ok ? '✅ Верно. ' : '❌ Не совсем. ') + (c.explain || '');
      anim(box, r.ok);
      if (r.ok) { ctl.lock(); btn.disabled = true; }
      ctl.show(SAQ.solution(c), ans);
    });
    return h('div', { class: 'micro' }, h('div', { class: 'mq' }, h('span', { class: 'mtag', html: icon('target') + 'Проверь себя' }), h('span', { html: c.q })), box, btn, fb);
  }

  function anim(el, ok) {
    el.classList.remove('shake', 'pop');
    void el.offsetWidth;
    el.classList.add(ok ? 'pop' : 'shake');
  }

  function onCleanup(fn) { cleanups.push(fn); }
  function setKeys(fn) {
    if (!fn) return;
    document.addEventListener('keydown', fn);
    onCleanup(() => document.removeEventListener('keydown', fn));
  }

  function enhance(root) {
    root.querySelectorAll('pre').forEach(pre => {
      if (pre.parentNode.classList && pre.parentNode.classList.contains('codewrap')) return;
      const w = h('div', { class: 'codewrap' });
      pre.parentNode.insertBefore(w, pre);
      w.append(pre);
      const b = h('button', { class: 'copy', type: 'button', title: 'Скопировать', html: icon('copy') });
      b.addEventListener('click', () => {
        const t = pre.innerText;
        const done = () => { b.classList.add('ok'); b.innerHTML = icon('check'); setTimeout(() => { b.classList.remove('ok'); b.innerHTML = icon('copy'); }, 1400); };
        try { navigator.clipboard.writeText(t).then(done, done); } catch (e) { done(); }
      });
      w.append(b);
    });
    root.querySelectorAll('table').forEach(t => {
      if (t.parentNode.classList && (t.parentNode.classList.contains('tblw') || t.parentNode.classList.contains('tbl'))) return;
      const w = h('div', { class: 'tblw' });
      t.parentNode.insertBefore(w, t);
      w.append(t);
    });
  }
  SAQ.enhance = enhance;

  function viewLesson(ch, i) {
    i = Math.max(0, Math.min(i, ch.lesson.length - 1));
    const cs = SAQ.cs(ch.id), s = ch.lesson[i];
    if (cs.sec < i) { cs.sec = i; SAQ.save(); }
    const last = i === ch.lesson.length - 1;
    const body = h('div', { class: 'lesson', html: s.html });
    SAQ.dgMount(body);
    enhance(body);
    const toc = h('aside', { class: 'toc' },
      h('a', { class: 'tochead', href: '#/c/' + ch.id }, h('span', { class: 'eyebrow' }, 'Глава ' + ch.id), h('b', null, ch.title)),
      h('ol', null, ch.lesson.map((x, k) => h('li', { class: (k === i ? 'cur' : '') + (k <= cs.sec && k !== i ? ' seen' : '') }, h('a', { href: '#/c/' + ch.id + '/l/' + k }, h('span', { class: 'tn', html: k <= cs.sec && k !== i ? icon('check') : String(k + 1) }), h('span', null, x.h))))),
      h('div', { class: 'tocnext' },
        h('a', { href: '#/c/' + ch.id + '/p/0', class: SAQ.lessonDone(ch) || SAQ.state().all ? '' : 'dis', html: icon('play') + 'Практика · ' + SAQ.prSolved(ch) + '/' + ch.practice.length }),
        h('a', { href: '#/c/' + ch.id + '/t', class: SAQ.prDone(ch) || SAQ.state().all ? '' : 'dis', html: icon('flag') + 'Итоговый тест' })));
    const readbar = h('div', { class: 'readbar' }, h('i'));
    const onScroll = () => {
      const d = document.documentElement;
      const max = Math.max(1, d.scrollHeight - window.innerHeight);
      readbar.firstChild.style.width = Math.min(100, (window.scrollY / max) * 100) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onCleanup(() => window.removeEventListener('scroll', onScroll));
    const art = h('article', { class: 'lart' },
      crumbs(ch, 'Урок'),
      h('div', { class: 'dots' }, ch.lesson.map((x, k) => h('a', { class: 'dot' + (k === i ? ' cur' : k <= cs.sec ? ' seen' : ''), href: '#/c/' + ch.id + '/l/' + k, title: x.h }))),
      h('div', { class: 'lmeta', html: icon('book') + 'Раздел ' + (i + 1) + ' из ' + ch.lesson.length + '<span>·</span>' + icon('clock') + '~' + Math.max(1, Math.round(words(s.html) / 150)) + ' мин<span>·</span><kbd>←</kbd><kbd>→</kbd>' }),
      h('h1', null, s.h), body,
      s.check ? microCheck(s.check, 'l' + ch.id + '-' + i) : '',
      h('div', { class: 'nav' },
        i > 0 ? h('a', { class: 'btn ghost', href: '#/c/' + ch.id + '/l/' + (i - 1) }, '← Назад') : h('a', { class: 'btn ghost', href: '#/c/' + ch.id }, '← К главе'),
        last ? h('a', { class: 'btn', href: '#/c/' + ch.id + '/p/0' }, 'К практике →') : h('a', { class: 'btn', href: '#/c/' + ch.id + '/l/' + (i + 1) }, 'Дальше →')));
    app().replaceChildren(topbar(), readbar, h('main', { class: 'wrap lwrap' }, h('div', { class: 'llayout' }, toc, art)), tabbar());
    try { window.scrollTo(0, 0); } catch (e) {}
    setKeys(ev => {
      if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      if (ev.key === 'ArrowRight') location.hash = last ? '#/c/' + ch.id + '/p/0' : '#/c/' + ch.id + '/l/' + (i + 1);
      if (ev.key === 'ArrowLeft') location.hash = i > 0 ? '#/c/' + ch.id + '/l/' + (i - 1) : '#/c/' + ch.id;
    });
  }

  function fbHtml(e, r) {
    if (r.parts) return r.parts.map(p => '<div>' + (p.ok ? '✅ ' : '❌ ') + esc(p.msg) + '</div>').join('');
    if (r.msg) return esc(r.msg) + (r.html || '');
    if (r.found != null) return 'Найдено ' + r.found + ' из ' + r.total + ', лишних отметок: ' + r.extra + '.';
    if (r.total != null) return 'Верно ' + r.n + ' из ' + r.total + '.';
    return 'Пока не то. Подумайте ещё или возьмите подсказку.';
  }
  SAQ.fbHtml = fbHtml;

  const TYPE_NAME = { choice: 'Выбор ответа', multi: 'Несколько ответов', tf: 'Верно или нет', classify: 'Классификация', order: 'Порядок', match: 'Соответствие', cloze: 'Пропуски', hunt: 'Найди ошибки', write: 'Свободный ответ', sql: 'SQL-запрос', api: 'Запросы к API', dgfind: 'Ошибки на диаграмме', dgfill: 'Пропуски на диаграмме', codehunt: 'Ошибки в коде' };
  SAQ.TYPE_NAME = TYPE_NAME;

  function viewPractice(ch, i) {
    i = Math.max(0, Math.min(i, ch.practice.length - 1));
    const cs = SAQ.cs(ch.id), e = ch.practice[i];
    const rec = cs.pr[i] || (cs.pr[i] = { ok: false, seen: false, hints: 0, xp: 0, tries: 0 });
    const chips = h('div', { class: 'chips' }, ch.practice.map((x, k) => {
      const r = cs.pr[k];
      return h('a', { class: 'chip' + (k === i ? ' cur' : '') + (r && r.ok ? ' ok' : r && r.seen ? ' seen' : ''), href: '#/c/' + ch.id + '/p/' + k, title: TYPE_NAME[x.type] || '' }, String(k + 1));
    }));
    const solvedN = SAQ.prSolved(ch);
    const box = h('div', { class: 'exbox' }), fb = h('div', { class: 'fb' }), hintBox = h('div', { class: 'hints' }), expl = h('div', { class: 'explain' });
    const btnCheck = h('button', { class: 'btn', type: 'button', disabled: true }, 'Проверить');
    const btnHint = h('button', { class: 'btn ghost', type: 'button' }, '');
    const btnShow = h('button', { class: 'btn ghost', type: 'button', style: 'display:none' }, 'Показать разбор');
    const nextHref = () => {
      const k = ch.practice.findIndex((x, j) => j !== i && !((cs.pr[j] || {}).ok || (cs.pr[j] || {}).seen));
      return k >= 0 ? '#/c/' + ch.id + '/p/' + k : '#/c/' + ch.id;
    };
    const nextBtn = h('a', { class: 'btn', href: '#', style: 'display:none' }, 'Дальше →');
    let ans = null;
    const ctl = SAQ.mount(box, e, 'p' + ch.id + '-' + i, a => { ans = a; btnCheck.disabled = !SAQ.ready(e, a); });
    const renderHints = () => {
      hintBox.replaceChildren(...e.hints.slice(0, rec.hints).map((t, k) => h('div', { class: 'hint' }, h('b', null, '💡 ' + (k + 1) + '. '), h('span', { html: t }))));
      btnHint.textContent = '💡 Подсказка (' + rec.hints + '/' + e.hints.length + ')';
      btnHint.disabled = rec.hints >= e.hints.length;
    };
    const finish = () => {
      ctl.lock();
      btnCheck.disabled = true; btnShow.style.display = 'none'; btnHint.style.display = 'none';
      expl.innerHTML = '<b>Разбор.</b> ' + (e.explain || '');
      enhance(expl);
      nextBtn.href = nextHref();
      nextBtn.style.display = '';
      nextBtn.textContent = nextHref() === '#/c/' + ch.id ? 'К итогам главы →' : 'Дальше →';
    };
    btnHint.addEventListener('click', () => {
      if (rec.hints < e.hints.length) { rec.hints++; SAQ.save(); renderHints(); }
      if (rec.hints >= e.hints.length || rec.tries > 0) btnShow.style.display = '';
    });
    btnShow.addEventListener('click', () => {
      if (!rec.ok) rec.seen = true;
      SAQ.save();
      ctl.show(SAQ.solution(e), ans);
      finish();
      fb.className = 'fb'; fb.textContent = 'Разбор открыт: задание не принесёт XP. Перерешайте позже сами.';
    });
    btnCheck.addEventListener('click', () => {
      btnCheck.disabled = true;
      Promise.resolve(SAQ.check(e, ans)).then(r => {
        rec.tries++;
        anim(box, r.ok);
        if (r.ok) {
          rec.ok = true;
          if (!rec.xp) {
            rec.xp = Math.max(2, 10 - 2 * rec.hints);
            const st = SAQ.state();
            st.xp += rec.xp;
            st.stats.ok++;
            if (e.type === 'sql') st.stats.sql++;
            if (e.type === 'api') st.stats.api++;
            SAQ.toast('+' + rec.xp + ' XP', 'xp');
          }
          SAQ.save();
          fb.className = 'fb good';
          fb.innerHTML = '✅ Верно! +' + rec.xp + ' XP ' + (r.html || '');
          ctl.show(SAQ.solution(e), ans);
          finish();
        } else {
          SAQ.save();
          fb.className = 'fb bad';
          fb.innerHTML = '❌ ' + fbHtml(e, r);
          btnCheck.disabled = !SAQ.ready(e, ans);
          btnShow.style.display = '';
        }
      }, err => { fb.className = 'fb bad'; fb.textContent = err.message; btnCheck.disabled = false; });
    });
    renderHints();
    if (rec.ok || rec.seen) { ctl.show(SAQ.solution(e), SAQ.solution(e)); finish(); if (rec.ok) { fb.className = 'fb good'; fb.textContent = '✅ Решено ранее.'; } }
    else if (rec.tries > 0 || rec.hints >= e.hints.length) btnShow.style.display = '';
    show(crumbs(ch, 'Практика'),
      h('div', { class: 'prhead' }, h('div', null, h('div', { class: 'eyebrow' }, 'Практика · глава ' + ch.id), h('b', null, ch.title)), h('div', { class: 'prprog' }, h('span', { class: 'mut' }, 'Решено ' + solvedN + ' из ' + ch.practice.length), h('span', { class: 'bar' }, h('i', { style: 'width:' + Math.round((solvedN / ch.practice.length) * 100) + '%' })))),
      chips,
      h('section', { class: 'task' },
        h('div', { class: 'taskmeta' }, h('span', { class: 'tnum' }, 'Задание ' + (i + 1) + ' из ' + ch.practice.length), h('span', { class: 'ttype' }, TYPE_NAME[e.type] || e.type), rec.ok ? h('span', { class: 'tdone', html: icon('check') + 'решено' }) : ''),
        h('div', { class: 'qtext', html: e.q }), box,
        h('div', { class: 'row' }, btnCheck, btnHint, btnShow), hintBox, fb, expl, h('div', { class: 'row' }, nextBtn)));
  }

  function startTest(ch) {
    const cs = SAQ.cs(ch.id), n = ((cs.t && cs.t.n) || 0) + 1;
    const order = SAQ.perm(ch.test.length, 'test' + ch.id + '-' + n);
    T = { ch, n, order, i: 0, ans: [], done: false };
  }

  function viewTest(ch) {
    const cs = SAQ.cs(ch.id);
    if (!T || T.ch !== ch || T.done) {
      show(crumbs(ch, 'Тест'),
        h('div', { class: 'hubcover p' + PARTN[partOf(ch.id)] }, h('span', { class: 'bigic', html: icon('flag') }), h('div', null, h('div', { class: 'eyebrow' }, 'Итоговый тест · глава ' + ch.id), h('h1', null, ch.title))),
        h('div', { class: 'card static' }, h('div', { class: 'cb' }, h('ul', { class: 'rules' },
          h('li', null, ch.test.length + ' вопросов разных типов, порядок перемешивается.'),
          h('li', null, 'Подсказок нет, результат виден только в конце.'),
          h('li', null, 'Порог: ' + Math.ceil(ch.test.length * 0.8) + ' верных из ' + ch.test.length + ' (80%). Попыток сколько угодно.'),
          h('li', null, 'За первую успешную сдачу: 5 XP за каждый верный ответ + 50 XP бонус.')))),
        cs.t ? h('p', null, 'Лучший результат: ' + cs.t.best + '%') : '',
        h('button', { class: 'btn big', type: 'button', onclick: () => { startTest(ch); viewTest(ch); } }, cs.t ? 'Пересдать' : 'Начать тест'));
      return;
    }
    const qi = T.order[T.i], q = ch.test[qi];
    const box = h('div', { class: 'exbox' });
    let ans = null;
    const btn = h('button', { class: 'btn', type: 'button', disabled: true }, T.i === ch.test.length - 1 ? 'Завершить' : 'Ответить');
    SAQ.mount(box, q, 't' + ch.id + '-' + T.n + '-' + qi, a => { ans = a; btn.disabled = !SAQ.ready(q, a); });
    btn.addEventListener('click', () => {
      T.ans[qi] = ans;
      T.i++;
      if (T.i >= ch.test.length) finishTest(ch); else viewTest(ch);
    });
    show(crumbs(ch, 'Тест'), h('div', { class: 'prog' }, h('i', { style: 'width:' + Math.round((T.i / ch.test.length) * 100) + '%' })),
      h('section', { class: 'task' }, h('div', { class: 'taskmeta' }, h('span', { class: 'tnum' }, 'Вопрос ' + (T.i + 1) + ' из ' + ch.test.length), h('span', { class: 'ttype' }, TYPE_NAME[q.type] || '')),
        h('div', { class: 'qtext', html: q.q }), box, h('div', { class: 'row' }, btn)));
  }

  function finishTest(ch) {
    T.done = true;
    const cs = SAQ.cs(ch.id);
    const results = ch.test.map((q, i) => SAQ.check(q, T.ans[i]));
    const correct = results.filter(r => r.ok).length;
    const need = Math.ceil(ch.test.length * 0.8);
    const pass = correct >= need;
    const pct = Math.round((correct / ch.test.length) * 100);
    let gain = 0;
    const was = !!(cs.t && cs.t.pass);
    if (pass && !was) { gain = correct * 5 + 50; SAQ.state().xp += gain; }
    cs.t = { n: T.n, best: Math.max(pct, (cs.t && cs.t.best) || 0), pass: pass || was };
    SAQ.save();
    if (pass) { SAQ.confetti(); if (gain) SAQ.toast('🏁 Тест пройден: +' + gain + ' XP', 'xp'); }
    const next = SAQ.chapters.find(c => c.id === ch.id + 1);
    const review = ch.test.map((q, i) => {
      const ok = results[i].ok;
      return h('div', { class: 'rev ' + (ok ? 'good' : 'bad') },
        h('div', { html: (ok ? '✅ ' : '❌ ') + q.q }),
        ok ? '' : h('div', { class: 'mut', html: '<b>Разбор.</b> ' + (q.explain || 'Вернитесь к уроку по этой теме.') }));
    });
    show(crumbs(ch, 'Результат'),
      h('div', { class: 'result ' + (pass ? 'good' : 'bad') }, SAQ.ring(pct, 120, 10, '<b>' + pct + '%</b><small>' + correct + ' из ' + ch.test.length + '</small>', pass ? 'done' : 'fail'),
        h('div', null, h('h1', null, pass ? 'Тест пройден' : 'Пока не хватило'), h('p', { class: 'lead' }, 'Нужно ' + need + ' из ' + ch.test.length + '.' + (gain ? ' Получено +' + gain + ' XP.' : '')),
          h('div', { class: 'row' },
            pass && next ? h('a', { class: 'btn', href: '#/c/' + next.id }, 'Следующая глава →') : '',
            h('button', { class: 'btn ghost', type: 'button', onclick: () => { startTest(ch); viewTest(ch); } }, 'Пересдать'),
            h('a', { class: 'btn ghost', href: '#/c/' + ch.id + '/l/0' }, 'Перечитать урок')))),
      h('h2', null, 'Разбор ответов'), ...review);
  }

  function viewProfile() {
    const s = SAQ.state(), li = SAQ.levelInfo(s.xp);
    const ta = h('textarea', { class: 'wr code', rows: '4', spellcheck: 'false' });
    ta.value = SAQ.exportCode();
    const msg = h('div', { class: 'fb' });
    const imp = h('textarea', { class: 'wr code', rows: '3', placeholder: 'Вставьте код сохранения SAQ1-…' });
    const done = SAQ.chapters.filter(c => SAQ.passed(c)).length;
    const ach = (SAQ.achievements || []).map(a => {
      const got = s.ach && s.ach[a.id];
      return h('div', { class: 'ach' + (got ? ' got' : '') }, h('span', { class: 'ai' }, got ? a.i : '🔒'), h('div', null, h('b', null, a.t), h('div', { class: 'mut' }, a.d + (got ? ' · ' + got : ''))));
    });
    const goal = h('div', { class: 'tabs' }, [20, 40, 80, 120].map(g => h('button', { class: 'tab' + ((s.goal || 40) === g ? ' on' : ''), type: 'button', onclick: () => { s.goal = g; SAQ.save(); viewProfile(); } }, g + ' XP')));
    const mocks = (s.mock || []).slice(-5).reverse();
    show(crumbs(null, 'Профиль'),
      h('div', { class: 'hubcover p1' }, SAQ.ring(li.pct, 100, 9, '<b>' + li.pct + '%</b>', 'big'),
        h('div', null, h('div', { class: 'eyebrow' }, 'Уровень'), h('h1', null, li.name), h('p', { class: 'lead' }, s.xp + ' XP · ' + (li.next ? 'до «' + li.next + '» ' + (100 - li.pct) + '%' : 'максимальный уровень') + ' · глав ' + done + ' из ' + SAQ.chapters.length + ' · серия ' + s.streak.n + ', рекорд ' + s.streak.best))),
      heatmap(26),
      h('h2', null, 'Цель на день'), goal,
      mocks.length ? [h('h2', null, 'Последние собеседования'), h('div', { class: 'gl' }, mocks.map(m => h('div', { class: 'term' }, h('b', null, m.score + '%'), ' · ' + m.date + ' · ' + m.n + ' вопросов · ' + m.topic)))] : '',
      h('h2', null, 'Достижения (' + Object.keys(s.ach || {}).length + '/' + (SAQ.achievements || []).length + ')'), h('div', { class: 'achs' }, ach),
      h('h2', null, 'Код сохранения'),
      h('p', { class: 'mut' }, 'Прогресс хранится в браузере. Чтобы перенести его на другое устройство или сохранить на случай очистки данных, скопируйте код.'),
      ta, h('div', { class: 'row' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { ta.select(); try { document.execCommand('copy'); SAQ.toast('Код скопирован'); } catch (e) {} } }, 'Скопировать')),
      h('h2', null, 'Загрузить прогресс'), imp,
      h('div', { class: 'row' }, h('button', { class: 'btn sm', type: 'button', onclick: () => { if (SAQ.importCode(imp.value)) { location.hash = '#/'; render(); } else { msg.className = 'fb bad'; msg.textContent = 'Код не распознан.'; } } }, 'Загрузить')), msg,
      h('h2', null, 'Режим просмотра'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: s.all, onchange: ev => { s.all = ev.target.checked; SAQ.save(); } }), ' Открыть все главы и этапы без прохождения'),
      h('h2', null, 'Сброс'),
      h('button', { class: 'btn ghost sm', type: 'button', onclick: () => { if (confirm('Удалить весь прогресс?')) { SAQ.reset(); location.hash = '#/'; render(); } } }, 'Сбросить прогресс'));
  }

  let IDX = null;
  function buildIndex() {
    if (IDX) return IDX;
    IDX = [];
    SAQ.chapters.forEach(ch => ch.lesson.forEach((s, k) => IDX.push({ kind: 'Урок', t: s.h, sub: 'Глава ' + ch.id + '. ' + ch.title, body: s.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), href: '#/c/' + ch.id + '/l/' + k })));
    (SAQ.glossary || []).forEach(g => IDX.push({ kind: 'Термин', t: g.t, sub: g.d, body: g.d, href: '#/ref' }));
    (SAQ.cards || []).forEach(c => IDX.push({ kind: 'Вопрос', t: c.q, sub: c.a, body: c.a, href: '#/cards' }));
    (SAQ.sheets || []).forEach(x => IDX.push({ kind: 'Шпаргалка', t: x.t, sub: 'Справочник', body: x.html.replace(/<[^>]+>/g, ' '), href: '#/ref' }));
    return IDX;
  }
  SAQ.search = function (q) {
    const k = q.trim().toLowerCase();
    if (k.length < 2) return [];
    const terms = k.split(/\s+/);
    const out = [];
    buildIndex().forEach(it => {
      const t = it.t.toLowerCase(), b = it.body.toLowerCase();
      if (!terms.every(w => t.includes(w) || b.includes(w))) return;
      let sc = 0;
      terms.forEach(w => { if (t.includes(w)) sc += 10; if (t.startsWith(w)) sc += 5; });
      if (it.kind === 'Урок') sc += 2;
      if (it.kind === 'Термин' && t === k) sc += 30;
      const pos = b.indexOf(terms[0]);
      const snip = pos >= 0 ? (pos > 40 ? '…' : '') + it.body.slice(Math.max(0, pos - 40), pos + 110) + '…' : it.sub;
      out.push(Object.assign({ sc, snip }, it));
    });
    return out.sort((a, b) => b.sc - a.sc).slice(0, 30);
  };
  function hl(text, q) {
    let s = esc(text);
    q.trim().split(/\s+/).filter(w => w.length > 1).forEach(w => { s = s.replace(new RegExp('(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>'); });
    return s;
  }
  function openSearch() {
    if (document.getElementById('srch')) return;
    const inp = h('input', { class: 'in sin', type: 'search', placeholder: 'Поиск по урокам, терминам, вопросам… например «идемпотентность»', autocomplete: 'off' });
    const res = h('div', { class: 'sres' });
    let sel = 0, items = [];
    const close = () => { ov.remove(); document.removeEventListener('keydown', key, true); };
    const draw = () => {
      items = SAQ.search(inp.value);
      if (!inp.value.trim()) { res.replaceChildren(h('div', { class: 'sempty' }, h('b', null, 'Попробуйте: '), ['REST', 'идемпотентность', 'шлюз', 'нормальная форма', 'INVEST', '401'].map(w => h('button', { class: 'tab', type: 'button', onclick: () => { inp.value = w; draw(); inp.focus(); } }, w)))); return; }
      if (!items.length) { res.replaceChildren(h('div', { class: 'sempty' }, 'Ничего не нашлось.')); return; }
      sel = Math.min(sel, items.length - 1);
      res.replaceChildren(...items.map((it, k) => h('a', { class: 'sitem' + (k === sel ? ' on' : ''), href: it.href, onclick: close },
        h('span', { class: 'skind k' + it.kind.length }, it.kind), h('div', null, h('b', { html: hl(it.t, inp.value) }), h('div', { class: 'mut', html: hl(it.snip || '', inp.value) })))));
    };
    const key = ev => {
      if (ev.key === 'Escape') { ev.preventDefault(); close(); }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); sel = Math.min(items.length - 1, sel + 1); draw(); }
      if (ev.key === 'ArrowUp') { ev.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      if (ev.key === 'Enter' && items[sel]) { ev.preventDefault(); location.hash = items[sel].href; close(); }
    };
    inp.addEventListener('input', () => { sel = 0; draw(); });
    const ov = h('div', { id: 'srch', class: 'overlay', onclick: ev => { if (ev.target === ov) close(); } },
      h('div', { class: 'sbox' }, h('div', { class: 'shead', html: icon('search') }, inp, h('kbd', null, 'Esc')), res,
        h('div', { class: 'sfoot mut' }, '↑↓ выбор · Enter открыть · Esc закрыть')));
    document.body.append(ov);
    document.addEventListener('keydown', key, true);
    draw();
    inp.focus();
  }
  SAQ.openSearch = openSearch;
  document.addEventListener('keydown', ev => {
    const t = ev.target && ev.target.tagName;
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'k' || ev.key === 'K' || ev.key === 'л' || ev.key === 'Л')) { ev.preventDefault(); openSearch(); }
    else if (ev.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t)) { ev.preventDefault(); openSearch(); }
  });

  function render() {
    cleanups.forEach(f => { try { f(); } catch (e) {} });
    cleanups = [];
    const s = document.getElementById('srch'); if (s) s.remove();
    applyTheme();
    const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
    if (!p.length || p[0] === 'map') return viewHome();
    if (p[0] === 'profile') return viewProfile();
    if (SAQ.views[p[0]]) return SAQ.views[p[0]](p.slice(1), { onCleanup });
    if (p[0] === 'c' && p[1]) {
      const id = Number(p[1]);
      const ch = SAQ.chapters.find(c => c.id === id);
      if (!ch || !SAQ.unlocked(id)) { location.hash = '#/'; return; }
      const all = SAQ.state().all;
      if (!p[2]) return viewHub(ch);
      if (p[2] === 'l') return viewLesson(ch, Number(p[3] || 0));
      if (p[2] === 'p') {
        if (!SAQ.lessonDone(ch) && !all) { location.hash = '#/c/' + id; return; }
        return viewPractice(ch, Number(p[3] || 0));
      }
      if (p[2] === 't') {
        if (!SAQ.prDone(ch) && !all) { location.hash = '#/c/' + id; return; }
        return viewTest(ch);
      }
    }
    return viewHome();
  }

  SAQ.render = render;
  SAQ.onCleanup = onCleanup;
  SAQ.anim = anim;
  SAQ.start = function () {
    SAQ.load();
    applyTheme();
    if (SAQ.hookAch) SAQ.hookAch();
    window.addEventListener('hashchange', render);
    render();
  };
})();
