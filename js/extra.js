(function () {
  const { h } = SAQ;

  SAQ.sqlSeed = `
CREATE TABLE departments(id INTEGER PRIMARY KEY, title TEXT);
CREATE TABLE employees(id INTEGER PRIMARY KEY, name TEXT, department_id INTEGER, salary INTEGER);
CREATE TABLE clients(id INTEGER PRIMARY KEY, name TEXT, email TEXT, city TEXT, created_at TEXT);
CREATE TABLE products(id INTEGER PRIMARY KEY, title TEXT, price INTEGER, stock INTEGER);
CREATE TABLE orders(id INTEGER PRIMARY KEY, client_id INTEGER, total INTEGER, status TEXT, created_at TEXT);
CREATE TABLE order_items(id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER, price INTEGER);
INSERT INTO departments VALUES (1,'Аналитика'),(2,'Разработка'),(3,'Тестирование'),(4,'Поддержка');
INSERT INTO employees VALUES (1,'Анна',1,90000),(2,'Борис',1,70000),(3,'Вера',2,150000),(4,'Глеб',2,130000),(5,'Дарья',2,150000),(6,'Егор',3,80000),(7,'Жанна',3,65000),(8,'Зина',4,50000),(9,'Игорь',NULL,60000);
INSERT INTO clients VALUES (1,'Иван','ivan@mail.ru','Москва','2025-01-10'),(2,'Мария','maria@mail.ru','Казань','2025-02-03'),(3,'Пётр','petr@mail.ru','Москва','2025-03-15'),(4,'Ольга','olga@mail.ru','Самара','2025-04-21'),(5,'Сергей','sergey@mail.ru','Казань','2026-01-09'),(6,'Тимур','timur@mail.ru','Москва','2026-02-14');
INSERT INTO products VALUES (1,'Книга',500,40),(2,'Ручка',50,200),(3,'Блокнот',150,0),(4,'Рюкзак',2500,12),(5,'Лампа',1200,7);
INSERT INTO orders VALUES (10,1,1050,'оплачен','2025-05-01'),(11,1,800,'новый','2025-06-02'),(12,2,2300,'оплачен','2025-06-10'),(13,2,150,'отменён','2025-07-01'),(14,3,3700,'оплачен','2025-07-15'),(15,1,500,'оплачен','2025-08-01'),(16,1,2500,'доставлен','2025-09-09'),(17,4,1200,'новый','2025-10-10'),(18,2,550,'доставлен','2026-01-20');
INSERT INTO order_items VALUES (1,10,1,2,500),(2,10,2,1,50),(3,11,3,1,150),(4,11,1,1,500),(5,11,2,3,50),(6,12,4,1,2500),(7,13,3,1,150),(8,14,5,1,1200),(9,14,4,1,2500),(10,15,1,1,500),(11,16,4,1,2500),(12,17,5,1,1200),(13,18,1,1,500),(14,18,2,1,50);
`;

  SAQ.sqlSchemaHtml = `<div class="schema"><b>Схема данных</b>
<div>departments(id, title) · employees(id, name, department_id, salary)</div>
<div>clients(id, name, email, city, created_at) · products(id, title, price, stock)</div>
<div>orders(id, client_id, total, status, created_at) · order_items(id, order_id, product_id, quantity, price)</div>
<div class="mut">Статусы заказов: новый, оплачен, доставлен, отменён. У сотрудника Игоря нет отдела (department_id = NULL).</div></div>`;

  let sqlPromise = null;
  SAQ.sqlLib = function () {
    if (SAQ._SQL) return Promise.resolve(SAQ._SQL);
    if (sqlPromise) return sqlPromise;
    sqlPromise = new Promise((res, rej) => {
      if (typeof window.initSqlJs !== 'function' || !window.SAQ_WASM_B64) { rej(new Error('SQL-движок не найден в сборке.')); return; }
      const bin = atob(window.SAQ_WASM_B64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      window.initSqlJs({ wasmBinary: bytes.buffer }).then(L => { SAQ._SQL = L; res(L); }, e => { sqlPromise = null; rej(e); });
    });
    return sqlPromise;
  };

  function runSql(L, q) {
    const db = new L.Database();
    try {
      db.run(SAQ.sqlSeed);
      const r = db.exec(q);
      return r.length ? r[r.length - 1] : { columns: [], values: [] };
    } finally { db.close(); }
  }
  SAQ.runSql = runSql;

  const norm = v => (v === null ? 'NULL' : typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : String(v));
  function tableHtml(r) {
    if (!r.columns.length) return '<div class="mut">Запрос выполнен, строк нет.</div>';
    const rows = r.values.slice(0, 12);
    return '<div class="tbl"><table><tr>' + r.columns.map(c => '<th>' + c + '</th>').join('') + '</tr>' +
      rows.map(v => '<tr>' + v.map(x => '<td>' + (x === null ? '<i>NULL</i>' : String(x)) + '</td>').join('') + '</tr>').join('') +
      '</table>' + (r.values.length > 12 ? '<div class="mut">… ещё ' + (r.values.length - 12) + ' строк</div>' : '') + '</div>';
  }

  const mock = {};
  mock.products = [
    { id: 1, title: 'Книга', price: 500, stock: 40 },
    { id: 2, title: 'Ручка', price: 50, stock: 200 },
    { id: 3, title: 'Блокнот', price: 150, stock: 0 },
    { id: 4, title: 'Рюкзак', price: 2500, stock: 12 },
    { id: 5, title: 'Лампа', price: 1200, stock: 7 }
  ];
  mock.fresh = function () {
    return {
      next: 3,
      hits: 0,
      idem: {},
      orders: [
        { id: 1, client_id: 1, status: 'новый', total: 1500.5, items: [{ product_id: 1, quantity: 2 }] },
        { id: 2, client_id: 2, status: 'оплачен', total: 800, items: [{ product_id: 2, quantity: 4 }] }
      ]
    };
  };
  mock.handle = function (st, req) {
    const u = new URL(req.url, 'http://api.local');
    const path = u.pathname.replace(/\/+$/, '') || '/';
    const m = String(req.method).toUpperCase();
    let body = null, bad = false;
    if (req.body && String(req.body).trim()) {
      try { body = JSON.parse(req.body); } catch (e) { bad = true; }
    }
    const hd = {};
    String(req.headers || '').split('\n').forEach(l => {
      const k = l.indexOf(':');
      if (k > 0) hd[l.slice(0, k).trim().toLowerCase()] = l.slice(k + 1).trim();
    });
    const R = (status, b, headers) => ({ status, body: b, headers: headers || {} });
    if (path === '/login') {
      if (m !== 'POST') return R(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
      if (hd['content-type'] && !/json/i.test(hd['content-type'])) return R(415, { error: 'нужен Content-Type: application/json' });
      if (bad || !body || !body.login || !body.password) return R(400, { error: 'login и password обязательны' });
      if (body.password !== 'demo') return R(401, { error: 'неверный логин или пароль' });
      return R(200, { token: body.login === 'guest' ? 'readonly-token' : 'demo-token', expires_in: 3600 });
    }
    if (path === '/ping') return m === 'GET' ? R(200, { status: 'ok' }) : R(405, { error: 'method_not_allowed' }, { Allow: 'GET' });
    if (path === '/report') {
      if (m !== 'GET') return R(405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      st.hits++;
      if (st.hits > 2) return R(429, { error: 'слишком много запросов', retry_after: 30 }, { 'Retry-After': '30' });
      return R(200, { report: 'готов', hits: st.hits });
    }
    if (path === '/products') {
      if (m !== 'GET') return R(405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      const limit = Math.max(1, Math.min(100, Number(u.searchParams.get('limit')) || 10));
      const offset = Math.max(0, Number(u.searchParams.get('offset')) || 0);
      return R(200, { items: mock.products.slice(offset, offset + limit), total: mock.products.length, limit, offset });
    }
    const pm = path.match(/^\/products\/(\d+)$/);
    if (pm) {
      if (m !== 'GET') return R(405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      const pr = mock.products.find(x => x.id === Number(pm[1]));
      return pr ? R(200, pr, { ETag: '"p' + pr.id + '-v1"', 'Cache-Control': 'max-age=60' }) : R(404, { error: 'товар не найден' });
    }
    if (!/^\/orders(\/\d+(\/cancel)?)?$/.test(path)) return R(404, { error: 'ресурс не найден' });
    const au = hd.authorization;
    if (au !== 'Bearer demo-token' && au !== 'Bearer readonly-token') return R(401, { error: 'нужен заголовок Authorization: Bearer <token>' }, { 'WWW-Authenticate': 'Bearer' });
    const ro = au === 'Bearer readonly-token';
    if (ro && m !== 'GET') return R(403, { error: 'у токена только право чтения' });
    if (hd['content-type'] && body !== null && !/json/i.test(hd['content-type'])) return R(415, { error: 'нужен Content-Type: application/json' });
    const cm = path.match(/^\/orders\/(\d+)\/cancel$/);
    if (cm) {
      if (m !== 'POST') return R(405, { error: 'method_not_allowed' }, { Allow: 'POST' });
      const o = st.orders.find(x => x.id === Number(cm[1]));
      if (!o) return R(404, { error: 'заказ не найден' });
      if (o.status === 'отменён') return R(409, { error: 'заказ уже отменён' });
      if (o.status === 'доставлен') return R(409, { error: 'доставленный заказ отменить нельзя' });
      o.status = 'отменён';
      return R(200, o);
    }
    const id = (path.match(/^\/orders\/(\d+)$/) || [])[1];
    if (!id) {
      if (m === 'GET') {
        let list = st.orders.slice();
        const s = u.searchParams.get('status');
        if (s) list = list.filter(o => o.status === s);
        const lim = Number(u.searchParams.get('limit'));
        if (lim > 0) list = list.slice(0, lim);
        return R(200, list);
      }
      if (m === 'POST') {
        const key = hd['idempotency-key'];
        if (key && st.idem[key]) return R(200, st.idem[key], { 'Idempotent-Replay': 'true' });
        if (bad) return R(400, { error: 'тело запроса — не валидный JSON' });
        if (!body || !body.client_id || !Array.isArray(body.items) || !body.items.length) return R(400, { error: 'нужны client_id и непустой items' });
        for (const it of body.items) {
          if (!it.product_id || !(it.quantity > 0)) return R(400, { error: 'у позиции нужны product_id и quantity > 0' });
          if (it.product_id > 50) return R(404, { error: 'товар не найден' });
          if (it.product_id === 3) return R(409, { error: 'товара нет на складе' });
        }
        const o = { id: st.next++, client_id: body.client_id, status: 'новый', total: 100 * body.items.length, items: body.items };
        st.orders.push(o);
        if (key) st.idem[key] = o;
        return R(201, o, { Location: '/orders/' + o.id });
      }
      return R(405, { error: 'method_not_allowed' }, { Allow: 'GET, POST' });
    }
    const o = st.orders.find(x => x.id === Number(id));
    if (!o) return R(404, { error: 'заказ не найден' });
    if (m === 'GET') return R(200, o, { ETag: '"o' + o.id + '-' + o.status + '"' });
    if (m === 'PATCH') {
      if (bad || !body || !body.status) return R(400, { error: 'нужно поле status' });
      if (!['новый', 'оплачен', 'доставлен', 'отменён'].includes(body.status)) return R(400, { error: 'недопустимый статус' });
      if (o.status === 'отменён') return R(409, { error: 'нельзя менять отменённый заказ' });
      o.status = body.status;
      return R(200, o);
    }
    if (m === 'PUT') {
      if (bad || !body || !body.client_id || !Array.isArray(body.items) || !body.status) return R(400, { error: 'PUT заменяет ресурс целиком: нужны client_id, items, status' });
      Object.assign(o, { client_id: body.client_id, items: body.items, status: body.status });
      return R(200, o);
    }
    if (m === 'DELETE') {
      st.orders.splice(st.orders.indexOf(o), 1);
      return R(204, null);
    }
    return R(405, { error: 'method_not_allowed' }, { Allow: 'GET, PUT, PATCH, DELETE' });
  };
  const STATUS_TEXT = { 200: 'OK', 201: 'Created', 204: 'No Content', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict', 415: 'Unsupported Media Type', 429: 'Too Many Requests' };
  SAQ.apiDocHtml = `<summary>Справочник тестового API</summary>
<table><tr><th>Запрос</th><th>Что делает</th></tr>
<tr><td>POST /login {login, password}</td><td>пароль <code>demo</code> → токен. Логин <code>guest</code> даёт токен только на чтение</td></tr>
<tr><td>GET /ping</td><td>проверка живости</td></tr>
<tr><td>GET /products?limit=&amp;offset=</td><td>список товаров (без авторизации), пагинация</td></tr>
<tr><td>GET /products/{id}</td><td>товар; заголовки ETag, Cache-Control</td></tr>
<tr><td>GET /report</td><td>с третьего вызова — 429 и Retry-After</td></tr>
<tr><td>GET/POST /orders</td><td>нужен <code>Authorization: Bearer &lt;token&gt;</code>. POST: client_id и items[]; поддерживает Idempotency-Key</td></tr>
<tr><td>GET/PUT/PATCH/DELETE /orders/{id}</td><td>заказ; фильтры списка: ?status=, ?limit=</td></tr>
<tr><td>POST /orders/{id}/cancel</td><td>отмена заказа</td></tr></table>
<div class="mut">Заказы 1 и 2 существуют. Новый заказ получит id 3. Товара №3 нет на складе, товаров с id &gt; 50 не существует. Заголовок Content-Type, если указан, должен быть application/json.</div>`;
  SAQ.mock = mock;

  function goalHit(goal, log) {
    return log.some(x => String(x.method).toUpperCase() === goal.m && new RegExp(goal.p).test(new URL(x.url, 'http://api.local').pathname + new URL(x.url, 'http://api.local').search) && x.res.status === goal.s);
  }
  function replay(reqs) {
    const st = mock.fresh();
    return reqs.map(r => Object.assign({}, r, { res: mock.handle(st, r) }));
  }

  const baseCheck = SAQ.check, baseSol = SAQ.solution, baseReady = SAQ.ready;
  SAQ.check = function (e, a) {
    if (e.type === 'sql') {
      const q = String(a || '').trim();
      if (!/^(select|with)\b/i.test(q)) return Promise.resolve({ ok: false, msg: 'Разрешены только запросы SELECT.' });
      return SAQ.sqlLib().then(L => {
        let got;
        try { got = runSql(L, q); } catch (err) { return { ok: false, msg: 'Ошибка SQL: ' + err.message }; }
        const exp = runSql(L, e.expected);
        const fmt = r => r.values.map(v => v.map(norm).join('\u0001'));
        let g = fmt(got), x = fmt(exp);
        if (!e.ordered) { g = g.slice().sort(); x = x.slice().sort(); }
        const sameCols = got.columns.length === exp.columns.length;
        const ok = sameCols && g.length === x.length && g.every((v, i) => v === x[i]);
        let msg = 'Результат совпал с эталоном.';
        if (!ok) {
          if (!sameCols) msg = 'Число столбцов не то: нужно ' + exp.columns.length + ', у вас ' + got.columns.length + '.';
          else if (g.length !== x.length) msg = 'Число строк не то: нужно ' + x.length + ', у вас ' + g.length + '.';
          else msg = 'Строки отличаются от эталона' + (e.ordered ? ' (порядок важен).' : '.');
        }
        return { ok, msg, html: tableHtml(got) };
      });
    }
    if (e.type === 'api') {
      const log = replay(a || []);
      const parts = e.goals.map(g => ({ ok: goalHit(g, log), msg: g.t }));
      return { ok: parts.every(p => p.ok), parts };
    }
    return baseCheck(e, a);
  };
  SAQ.solution = e => (e.type === 'sql' ? e.sample : e.type === 'api' ? e.sample : baseSol(e));
  SAQ.ready = (e, a) => (e.type === 'sql' ? String(a || '').trim().length > 0 : e.type === 'api' ? Array.isArray(a) && a.length > 0 : baseReady(e, a));

  const mounts = SAQ.mount;
  SAQ.mount = function (box, e, key, set) {
    if (e.type === 'sql') {
      const ta = h('textarea', { class: 'wr code', rows: '6', spellcheck: 'false', placeholder: 'SELECT …' });
      const out = h('div', { class: 'sqlout' });
      const run = h('button', { class: 'btn ghost', type: 'button' }, '▶ Выполнить (без проверки)');
      ta.addEventListener('input', () => set(ta.value));
      run.addEventListener('click', () => {
        const q = ta.value.trim();
        if (!/^(select|with)\b/i.test(q)) { out.innerHTML = '<div class="bad">Разрешены только запросы SELECT.</div>'; return; }
        out.textContent = 'Выполняю…';
        SAQ.sqlLib().then(L => {
          try { out.innerHTML = tableHtml(runSql(L, q)); } catch (err) { out.innerHTML = '<div class="bad">Ошибка SQL: ' + String(err.message).replace(/</g, '&lt;') + '</div>'; }
        }, err => { out.textContent = err.message; });
      });
      box.append(h('div', { class: 'schemabox', html: SAQ.sqlSchemaHtml }), ta, h('div', { class: 'row' }, run), out);
      let sample = null;
      return {
        lock() { ta.disabled = true; },
        show(sol) {
          if (sample) return;
          sample = h('div', { class: 'sample' }, h('b', null, 'Эталонный запрос'), h('pre', null, h('code', null, sol)));
          box.append(sample);
        }
      };
    }
    if (e.type === 'api') {
      const log = [];
      const method = h('select', { class: 'sel-in' }, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => h('option', { value: m }, m)));
      const url = h('input', { class: 'in', type: 'text', value: '/orders', spellcheck: 'false' });
      const hd = h('textarea', { class: 'wr code', rows: '3', spellcheck: 'false' });
      hd.value = 'Content-Type: application/json';
      const body = h('textarea', { class: 'wr code', rows: '5', spellcheck: 'false', placeholder: '{ "client_id": 1, … }' });
      const resBox = h('div', { class: 'apires' }, h('span', { class: 'mut' }, 'Здесь появится ответ сервера'));
      const logBox = h('div', { class: 'apilog' });
      const st = mock.fresh();
      let locked = false;
      const send = h('button', { class: 'btn', type: 'button' }, 'Send');
      send.addEventListener('click', () => {
        if (locked) return;
        const req = { method: method.value, url: url.value.trim(), headers: hd.value, body: body.value };
        log.push(req);
        const r = mock.handle(st, req);
        const hdrs = Object.keys(r.headers || {}).map(k => k + ': ' + r.headers[k]).join('\n');
        resBox.innerHTML = '<div class="st s' + String(r.status)[0] + '">' + r.status + ' ' + (STATUS_TEXT[r.status] || '') + '</div>' + (hdrs ? '<div class="mut">Заголовки ответа</div><pre><code>' + hdrs.replace(/</g, '&lt;') + '</code></pre>' : '') + '<div class="mut">Тело ответа</div><pre><code>' + (r.body == null ? '(тело пустое)' : JSON.stringify(r.body, null, 2).replace(/</g, '&lt;')) + '</code></pre>';
        logBox.append(h('div', { class: 'lg2' }, req.method + ' ' + req.url + ' → ' + r.status));
        set(log.slice());
      });
      box.append(h('div', { class: 'apiform' },
        h('div', { class: 'row' }, method, url, send),
        h('label', { class: 'mut' }, 'Заголовки'), hd,
        h('label', { class: 'mut' }, 'Тело (JSON)'), body),
        h('details', { class: 'apidoc', html: SAQ.apiDocHtml }),
        resBox, logBox);
      let sample = null;
      return {
        lock() { locked = true; send.disabled = true; },
        show(sol) {
          if (sample) return;
          const txt = sol.map(r => r.method + ' ' + r.url + (r.headers ? '\n' + r.headers : '') + (r.body ? '\n' + r.body : '')).join('\n\n');
          sample = h('div', { class: 'sample' }, h('b', null, 'Пример решения (последовательность запросов)'), h('pre', null, h('code', null, txt)));
          box.append(sample);
        }
      };
    }
    return mounts(box, e, key, set);
  };
})();
