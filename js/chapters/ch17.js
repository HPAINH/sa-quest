(function () {
  const Q = SAQ.Q;
  const H = 'Authorization: Bearer demo-token';
  SAQ.chapter(17, '📮', 'Postman',
    'Коллекции, окружения, переменные, тесты на JS, цепочки запросов, раннер, моки. Практика сценариев в мини-Postman.',
    ['создавать запросы, коллекции и окружения', 'использовать переменные и скрипты проверки (pm.test)', 'выстраивать цепочки запросов (логин → токен → заказ)', 'проверять API по спецификации и воспроизводить ошибки'],
    [
      { h: 'Что делает Postman', html: `
<p><b>Postman</b> — инструмент для отправки HTTP-запросов, документирования и автоматизированной проверки API. В РФ аналогами пользуются: Insomnia, Bruno, Hoppscotch, встроенные HTTP-клиенты IDE (HTTP Client в IntelliJ, REST Client в VS Code). Принципы те же.</p>
<h3>Основные сущности</h3>
<ul><li><b>Request</b> — запрос: метод, URL, params, headers, body, auth;</li><li><b>Collection</b> — папка запросов;</li><li><b>Environment</b> — набор переменных (dev, test, prod);</li><li><b>Variables</b> — <code>{{base_url}}</code>, <code>{{token}}</code>;</li><li><b>Scripts</b> — Pre-request (до) и Tests (после);</li><li><b>Runner</b> — прогон коллекции;</li><li><b>Mock server</b> — имитация API по примерам.</li></ul>
<div class="tip">Аналитик использует Postman, чтобы: проверить, что API ведёт себя как в спецификации; воспроизвести баг; подготовить примеры для документации.</div>`,
        check: Q.c('Что такое Environment в Postman?', ['Набор переменных для среды (dev/test/prod)', 'Монитор', 'Тип запроса', 'Код ответа'], 0, '') },
      { h: 'Запрос: параметры, заголовки, тело, авторизация', html: `
<ul><li><b>Params</b> — query: <code>?status=paid&amp;limit=10</code>;</li><li><b>Authorization</b> — Bearer Token, Basic, API Key, OAuth 2.0;</li><li><b>Headers</b> — Content-Type: application/json;</li><li><b>Body</b> — raw JSON, form-data (файлы), x-www-form-urlencoded.</li></ul>
<h3>Читаем ответ</h3>
<ul><li><b>Status</b> — код и время (мс);</li><li><b>Body</b> — Pretty / Raw / Preview;</li><li><b>Headers</b> — Content-Type, Location, Retry-After;</li><li><b>Cookies</b>, <b>Test Results</b>.</li></ul>
<div class="warn">401 после «вроде бы правильного» токена: проверьте префикс <code>Bearer </code>, пробел, срок жизни токена и окружение.</div>`,
        check: Q.c('Как передать JSON в теле запроса?', ['Body → raw → JSON + Content-Type: application/json', 'В URL', 'В заголовке Accept', 'В Cookie'], 0, '') },
      { h: 'Переменные и тесты', html: `
<pre><code>// Tests — выполняются после ответа
pm.test("Статус 201", () =&gt; pm.response.to.have.status(201));

const body = pm.response.json();
pm.test("Есть id", () =&gt; pm.expect(body.id).to.be.a('number'));
pm.test("Статус новый", () =&gt; pm.expect(body.status).to.eql('новый'));

pm.environment.set("order_id", body.id);   // сохранить для следующих запросов</code></pre>
<ul><li>Использование: <code>{{order_id}}</code> в URL следующего запроса.</li><li>Области: global, collection, environment, local.</li><li>Pre-request: подготовка (генерация данных, подпись).</li><li>В тестах проверяют: статус, тело, заголовки, время ответа (<code>pm.response.responseTime &lt; 500</code>), схему.</li></ul>`,
        check: Q.c('Как передать id созданного заказа в следующий запрос?', ['pm.environment.set("order_id", body.id)', 'Запомнить', 'Скопировать вручную каждый раз', 'Невозможно'], 0, '') },
      { h: 'Цепочки запросов и Runner', html: `
<p>Сценарий «заказ от начала до конца»:</p>
<ol><li><code>POST /login</code> → в тестах сохраняем <code>token</code>;</li><li><code>POST /orders</code> с <code>Authorization: Bearer {{token}}</code> → сохраняем <code>order_id</code>;</li><li><code>GET /orders/{{order_id}}</code> → проверяем статус;</li><li><code>PATCH /orders/{{order_id}}</code> → меняем статус;</li><li><code>DELETE /orders/{{order_id}}</code> → 204.</li></ol>
<p><b>Collection Runner</b> запускает все запросы подряд, итерации можно питать данными из CSV/JSON; результаты — в отчёте. <b>Newman</b> — запуск из командной строки/CI.</p>
<div class="interview">Вопрос: «Как проверить, что API работает по спецификации?» — импортировать OpenAPI в Postman, написать проверки статуса и схемы, прогнать негативные сценарии (нет токена, неверные данные, граничные значения).</div>`,
        check: Q.o('Расположите цепочку запросов.', ['POST /login', 'POST /orders', 'GET /orders/{id}', 'PATCH /orders/{id}', 'DELETE /orders/{id}'], '') }
    ],
    [
      Q.api('Авторизуйтесь и затем создайте заказ: POST /login (200), затем POST /orders (201).', [['POST', '^/login$', 200, 'POST /login → 200'], ['POST', '^/orders$', 201, 'POST /orders → 201']], [{ method: 'POST', url: '/login', headers: '', body: '{"login":"a","password":"demo"}' }, { method: 'POST', url: '/orders', headers: H, body: '{"client_id":2,"items":[{"product_id":2,"quantity":1}]}' }], 'Токен demo-token известен из документации.', ['Сначала логин, потом заказ.']),
      Q.api('Проверьте негатив: неверный пароль → 401 на POST /login.', [['POST', '^/login$', 401, 'неверный пароль → 401']], [{ method: 'POST', url: '/login', headers: '', body: '{"login":"a","password":"wrong"}' }], 'Негативные сценарии — часть проверки.', ['Пароль не demo.']),
      Q.api('Проверьте негатив: POST /login без пароля → 400.', [['POST', '^/login$', 400, 'нет пароля → 400']], [{ method: 'POST', url: '/login', headers: '', body: '{"login":"a"}' }], '400 — некорректный запрос.', ['Пропустите password.']),
      Q.api('Проверьте валидацию: POST /orders с пустым items → 400.', [['POST', '^/orders$', 400, 'пустой items → 400']], [{ method: 'POST', url: '/orders', headers: H, body: '{"client_id":1,"items":[]}' }], 'Пустой массив — нарушение правила.', ['items: [].']),
      Q.api('Проверьте несуществующий товар: product_id=99 → 404.', [['POST', '^/orders$', 404, 'несуществующий товар → 404']], [{ method: 'POST', url: '/orders', headers: H, body: '{"client_id":1,"items":[{"product_id":99,"quantity":1}]}' }], 'Тестовый сервер считает товары > 50 несуществующими.', ['Используйте большой product_id.']),
      Q.api('Проверьте PUT: заменить заказ 1 целиком (client_id, items, status) → 200.', [['PUT', '^/orders/1$', 200, 'PUT /orders/1 → 200']], [{ method: 'PUT', url: '/orders/1', headers: H, body: '{"client_id":1,"items":[{"product_id":1,"quantity":1}],"status":"доставлен"}' }], 'PUT требует полное представление.', ['Нужны client_id, items, status.']),
      Q.api('Проверьте PUT без обязательных полей → 400.', [['PUT', '^/orders/1$', 400, 'PUT без полей → 400']], [{ method: 'PUT', url: '/orders/1', headers: H, body: '{"status":"оплачен"}' }], 'Отличие от PATCH: PUT заменяет целиком.', ['Отправьте только status.']),
      Q.api('Проверьте недопустимый статус: PATCH /orders/1 со статусом «взорван» → 400.', [['PATCH', '^/orders/1$', 400, 'недопустимый статус → 400']], [{ method: 'PATCH', url: '/orders/1', headers: H, body: '{"status":"взорван"}' }], 'Допустимы только 4 статуса.', ['Придумайте любой недопустимый статус.'])
    ],
    [
      Q.c('Переменная в Postman записывается как…', ['{{name}}', '$name', '[name]', '<name>'], 0, ''),
      Q.c('Где пишут проверки ответа?', ['Tests', 'Pre-request', 'Settings', 'Mock'], 0, ''),
      Q.tf('Верно?', [['Newman — запуск коллекций из командной строки', true], ['Postman нельзя использовать для негативных тестов', false]], ''),
      Q.m('Что можно проверить в тестах?', ['Статус', 'Тело', 'Время ответа', 'Цвет монитора'], [0, 1, 2], ''),
      Q.c('Для загрузки файла используют…', ['form-data', 'raw JSON', 'GraphQL', 'cookies'], 0, ''),
      Q.c('Environment нужен для…', ['Переключения dev/test/prod', 'Рисования', 'Сжатия', 'Шифрования'], 0, ''),
      Q.c('Runner используется для…', ['Прогона всей коллекции', 'Рисования диаграмм', 'Установки', 'Замены'], 0, ''),
      Q.c('Если пришёл 401 при верном токене, проверьте…', ['Префикс Bearer и срок жизни токена', 'Цвет', 'Размер окна', 'Язык ОС'], 0, '')
    ]
  );
})();
