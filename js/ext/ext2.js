(function () {
  const Q = SAQ.Q;
  const D = n => JSON.parse(JSON.stringify(SAQ.diagrams[n].spec));
  const dg = n => '<div class="dg" data-dg="' + n + '"></div>';
  const H = 'Authorization: Bearer demo-token';
  const J = H + '\nContent-Type: application/json';
  const ORD = '{"client_id":1,"items":[{"product_id":1,"quantity":2}]}';

  /* ---------- ГЛАВА 14: REST ---------- */
  SAQ.extend(14, {
    goals: ['проектировать ресурсы, URL и методы API по описанию задачи', 'различать 401/403/409/415/422/429 и объяснять, когда какой возвращать', 'применять идемпотентность, пагинацию, ETag и формат ошибок', 'сравнивать REST, GraphQL, gRPC и webhooks'],
    lesson: [
      { after: 3, h: 'Проектируем API: ресурсы, URL, методы', html: `
<p>Хороший REST API проектируют от <b>ресурсов</b> (существительных предметной области), а не от действий.</p>
<table><tr><th>Задача</th><th>Плохо</th><th>Хорошо</th></tr>
<tr><td>Создать заказ</td><td>POST /createOrder</td><td>POST /orders</td></tr>
<tr><td>Получить заказ</td><td>GET /getOrder?id=42</td><td>GET /orders/42</td></tr>
<tr><td>Заказы клиента</td><td>GET /getOrdersByClient</td><td>GET /clients/7/orders или GET /orders?client_id=7</td></tr>
<tr><td>Удалить</td><td>POST /orders/42/delete</td><td>DELETE /orders/42</td></tr>
<tr><td>Отменить заказ</td><td>PUT /orders/42/setCancelled</td><td>POST /orders/42/cancel</td></tr></table>
<p>Если действие не укладывается в CRUD (отмена, оплата, отправка), его оформляют как <b>подресурс-действие</b> с POST: <code>POST /orders/42/cancel</code>.</p>
<h3>Правила</h3>
<ul><li>Множественное число: <code>/orders</code>, не <code>/order</code>.</li><li>Вложенность не глубже двух уровней.</li><li>Фильтры, сортировка и пагинация — в query: <code>?status=paid&amp;sort=-created_at&amp;limit=20</code>.</li><li>Идентификаторы в пути, необязательные параметры в query.</li><li>Версия в пути: <code>/v1/orders</code>.</li></ul>
<div class="key">Алгоритм проектирования: ресурсы → связи → URL → методы → тела и ответы → ошибки → безопасность → версия.</div>`,
        check: Q.c('Как лучше оформить отмену заказа?', ['POST /orders/42/cancel', 'GET /cancelOrder?id=42', 'PUT /cancel', 'DELETE /orders'], 0, 'Действие вне CRUD — POST на подресурс.') },
      { after: 4, h: 'Идемпотентность, пагинация и ETag', html: `
<h3>Идемпотентность</h3>
<p>Метод идемпотентен, если повтор даёт тот же результат. GET, PUT, DELETE таковы. POST — нет: два запроса создадут два заказа. При сетевом сбое клиент не знает, дошёл ли запрос, и повторяет его. Решение — заголовок <code>Idempotency-Key</code>: сервер запоминает ключ и на повтор возвращает прежний результат (в нашем тренажёре — 200 и заголовок <code>Idempotent-Replay</code>).</p>
<div class="ex">Первый POST /orders с ключом 7f3a → 201 Created. Повтор с тем же ключом → 200 с тем же заказом, второй заказ не создан.</div>
<h3>Пагинация</h3>
<table><tr><th>Способ</th><th>Пример</th><th>Плюсы / минусы</th></tr><tr><td>offset/limit</td><td>?limit=20&amp;offset=40</td><td>просто, но медленно на больших смещениях и «плывёт» при вставках</td></tr><tr><td>cursor</td><td>?after=eyJpZCI6NDJ9</td><td>стабильно и быстро, но нельзя перейти на страницу N</td></tr></table>
<p>В ответ добавляйте <code>total</code> или ссылки на следующую страницу.</p>
<h3>Кэширование и ETag</h3>
<p>Сервер отдаёт <code>ETag: "v7"</code>. Клиент повторяет запрос с <code>If-None-Match: "v7"</code>. Если ресурс не менялся — <code>304 Not Modified</code> без тела. <code>Cache-Control: max-age=60</code> разрешает хранить ответ минуту без запросов.</p>
<h3>Ограничение частоты</h3>
<p>При превышении лимита — <code>429 Too Many Requests</code> и <code>Retry-After: 30</code> (секунд до повтора). Клиент ждёт и повторяет.</p>`,
        check: Q.c('Какой заголовок защищает POST от дублей при повторе?', ['Idempotency-Key', 'ETag', 'Accept', 'Retry-After'], 0, '') },
      { after: 4, h: 'Ошибки: какой код и какой формат', html: `
<table><tr><th>Ситуация</th><th>Код</th></tr>
<tr><td>Битый JSON, нет обязательного поля</td><td>400</td></tr>
<tr><td>Синтаксис верный, но нарушено бизнес-правило (например, дата в прошлом)</td><td>422</td></tr>
<tr><td>Нет токена или он просрочен</td><td>401</td></tr>
<tr><td>Токен есть, прав нет (токен только на чтение)</td><td>403</td></tr>
<tr><td>Ресурса не существует</td><td>404</td></tr>
<tr><td>Метод не поддерживается на ресурсе</td><td>405 + Allow</td></tr>
<tr><td>Неверный Content-Type</td><td>415</td></tr>
<tr><td>Конфликт состояния (нет на складе, отмена доставленного)</td><td>409</td></tr>
<tr><td>Слишком много запросов</td><td>429 + Retry-After</td></tr></table>
<h3>Единый формат ошибки (RFC 7807)</h3>
<pre><code>{
  "type": "https://api.example.ru/errors/out-of-stock",
  "title": "Товара нет на складе",
  "status": 409,
  "detail": "Товар 3 закончился",
  "instance": "/orders"
}</code></pre>
<p>Ошибка должна объяснять, что случилось и что делать, и не раскрывать внутренности (стек, SQL).</p>
<div class="warn">401 и 403 путают чаще всего. 401: «кто вы?» — не представились. 403: «вас знаем, но нельзя».</div>
<div class="interview">Частый вопрос: «Когда 400, а когда 422?» 400 — запрос не разобрать или структура неверна; 422 — структура верна, но данные не проходят бизнес-проверку.</div>`,
        check: Q.c('Токен есть, но он только на чтение, а клиент делает POST. Какой код?', ['403', '401', '404', '415'], 0, 'Аутентифицирован, но прав нет.') },
      { after: 4, h: 'Зрелость REST, GraphQL, gRPC и webhooks', html: `
<h3>Модель зрелости Ричардсона</h3>
<ol start="0"><li><b>Уровень 0:</b> один URL, всё через POST (RPC-стиль).</li><li><b>Уровень 1:</b> отдельные ресурсы.</li><li><b>Уровень 2:</b> правильные HTTP-методы и коды.</li><li><b>Уровень 3:</b> HATEOAS: ссылки на действия в ответе.</li></ol>
<p>Практический ориентир для коммерческих API — уровень 2.</p>
<table><tr><th></th><th>REST</th><th>GraphQL</th><th>gRPC</th></tr><tr><td>Формат</td><td>JSON по HTTP</td><td>запрос на языке GraphQL</td><td>Protobuf по HTTP/2</td></tr><tr><td>Эндпоинтов</td><td>много</td><td>один</td><td>методы сервиса</td></tr><tr><td>Сильная сторона</td><td>простота, кэширование</td><td>клиент выбирает поля</td><td>скорость, строгий контракт</td></tr><tr><td>Где</td><td>публичные API</td><td>мобильные и сложные фронты</td><td>межсервисный обмен</td></tr></table>
<h3>Webhook</h3>
${dg('seq-webhook')}
<ul><li>Подписывайте запросы (HMAC) и проверяйте подпись.</li><li>Отвечайте 2xx быстро, обработку выносите в очередь.</li><li>Делайте обработчик идемпотентным: дубли неизбежны.</li></ul>
${dg('seq-oauth')}`,
        check: Q.c('Что характерно для уровня 2 по Ричардсону?', ['Правильные методы и коды HTTP', 'Один URL для всего', 'Только SOAP', 'Ссылки на действия'], 0, '') }
    ],
    practice: [
      Q.api('Покажите разницу 401 и 403. Получите токен только на чтение (POST /login с login guest, password demo → 200), затем попытайтесь создать заказ этим токеном и получите 403.',
        [['POST', '^/login$', 200, 'POST /login → 200'], ['POST', '^/orders$', 403, 'POST /orders с readonly-токеном → 403']],
        [{ method: 'POST', url: '/login', headers: 'Content-Type: application/json', body: '{"login":"guest","password":"demo"}' }, { method: 'POST', url: '/orders', headers: 'Authorization: Bearer readonly-token\nContent-Type: application/json', body: ORD }],
        'Токен guest — «readonly-token»: GET разрешён, остальное 403.', ['Логин guest, пароль demo.', 'Токен из ответа: readonly-token.']),
      Q.api('Отправьте POST /orders с неверным Content-Type (text/plain) и получите 415.',
        [['POST', '^/orders$', 415, 'POST /orders (Content-Type: text/plain) → 415']], [{ method: 'POST', url: '/orders', headers: H + '\nContent-Type: text/plain', body: ORD }], '415 — сервер не принимает такой тип содержимого.', ['Нужен токен и заголовок Content-Type: text/plain.']),
      Q.api('Проверьте идемпотентность: отправьте два одинаковых POST /orders с одним Idempotency-Key. Первый должен дать 201, второй — 200.',
        [['POST', '^/orders$', 201, 'Первый POST → 201'], ['POST', '^/orders$', 200, 'Повтор с тем же ключом → 200']],
        [{ method: 'POST', url: '/orders', headers: J + '\nIdempotency-Key: abc-1', body: ORD }, { method: 'POST', url: '/orders', headers: J + '\nIdempotency-Key: abc-1', body: ORD }],
        'Повтор возвращает прежний результат и не создаёт второй заказ.', ['Ключ должен совпадать в обоих запросах.']),
      Q.api('Отмените заказ 2 (200), а затем повторите отмену и получите 409.',
        [['POST', '^/orders/2/cancel$', 200, 'Первая отмена → 200'], ['POST', '^/orders/2/cancel$', 409, 'Повторная отмена → 409']],
        [{ method: 'POST', url: '/orders/2/cancel', headers: H, body: '' }, { method: 'POST', url: '/orders/2/cancel', headers: H, body: '' }], 'Конфликт состояния: заказ уже отменён.', ['Один и тот же запрос дважды.']),
      Q.api('Воспроизведите ограничение частоты: вызывайте GET /report, пока не получите 429.',
        [['GET', '^/report$', 429, 'GET /report → 429']], [{ method: 'GET', url: '/report', headers: '', body: '' }, { method: 'GET', url: '/report', headers: '', body: '' }, { method: 'GET', url: '/report', headers: '', body: '' }],
        'С третьего вызова сервер возвращает 429 и Retry-After.', ['Нужно три вызова подряд.']),
      Q.api('Получите вторую страницу списка товаров по 2 штуки: GET /products?limit=2&offset=2 → 200 (токен не нужен).',
        [['GET', '^/products\\?limit=2&offset=2$', 200, 'GET /products?limit=2&offset=2 → 200']], [{ method: 'GET', url: '/products?limit=2&offset=2', headers: '', body: '' }], 'offset=2 пропускает первые две записи.', ['Параметры в query через &.']),
      Q.api('Запросите товар 1 (200), а затем несуществующий товар 999 (404).',
        [['GET', '^/products/1$', 200, 'GET /products/1 → 200'], ['GET', '^/products/999$', 404, 'GET /products/999 → 404']], [{ method: 'GET', url: '/products/1', headers: '', body: '' }, { method: 'GET', url: '/products/999', headers: '', body: '' }], 'Публичный ресурс не требует токена.', []),
      Q.api('Попробуйте удалить товар: DELETE /products/1 → 405 (метод не поддерживается).',
        [['DELETE', '^/products/1$', 405, 'DELETE /products/1 → 405']], [{ method: 'DELETE', url: '/products/1', headers: '', body: '' }], '405 сопровождается заголовком Allow со списком допустимых методов.', []),
      Q.api('Нарушьте правило PUT: заменить заказ 1 неполным телом {"status":"оплачен"} и получить 400.',
        [['PUT', '^/orders/1$', 400, 'PUT /orders/1 с неполным телом → 400']], [{ method: 'PUT', url: '/orders/1', headers: J, body: '{"status":"оплачен"}' }], 'PUT заменяет ресурс целиком, поэтому нужны все поля.', ['Тело без client_id и items.']),
      Q.api('Закажите несуществующий товар (product_id 99) и получите 404.',
        [['POST', '^/orders$', 404, 'POST /orders (товара нет) → 404']], [{ method: 'POST', url: '/orders', headers: J, body: '{"client_id":1,"items":[{"product_id":99,"quantity":1}]}' }], 'Ссылка на несуществующий ресурс внутри тела.', ['product_id больше 50 не существует.']),
      Q.ch('Найдите ошибки в REST-проектировании: нарушено правило «ресурсы — существительные, действие — метод».', ['GET /orders', 'POST /createOrder', 'GET /orders/42', 'DELETE /orders/42/delete', 'PUT /orders/42', 'GET /getOrdersByClient?id=7'], [1, 3, 5], 'Глаголы в URL (create, delete, get) дублируют метод HTTP.'),
      Q.ch('Найдите синтаксические ошибки в JSON ответа.', ['{', "  'error': \"not_found\",", '  "status": 404,', '  "details": [1, 2,],', '  "retry": undefined', '}'], [1, 3, 4], 'Ключи только в двойных кавычках, лишняя запятая недопустима, undefined в JSON нет.'),
      Q.ch('Найдите ошибки в описании ответов API.', ['POST /orders → 200 OK, тело — созданный заказ (без Location)', 'DELETE /orders/42 → 204 No Content', 'GET /orders/999 → 200 с пустым телом, если заказа нет', 'GET /orders без токена → 401 Unauthorized', 'Токен только на чтение, POST → 401'], [0, 2, 4], 'Создание — 201 и Location; отсутствующий ресурс — 404; нет прав — 403.'),
      Q.cl('Безопасный, идемпотентный или ни то ни другое?', ['Безопасный и идемпотентный', 'Идемпотентный, но не безопасный', 'Ни то ни другое'], [['GET /orders/1', 0], ['PUT /orders/1', 1], ['DELETE /orders/1', 1], ['POST /orders', 2], ['HEAD /orders/1', 0]], 'GET и HEAD безопасны. PUT и DELETE меняют данные, но повтор не меняет результат. POST создаёт новый ресурс каждый раз.'),
      Q.mt('Сопоставьте ситуацию и код.', [['Создан заказ', '201'], ['Токен отсутствует', '401'], ['Токен только на чтение, а запрос POST', '403'], ['Товара нет на складе', '409'], ['Слишком частые запросы', '429'], ['Неверный Content-Type', '415']], 'Коды из таблицы урока.'),
      Q.o('Расположите шаги входа и вызова защищённого API в порядке выполнения.', ['POST /login с логином и паролем', 'Получить токен в ответе', 'Добавить заголовок Authorization: Bearer ТОКЕН', 'Вызвать GET /orders', 'Получить 200 и список заказов'], 'Сначала токен, потом вызов с заголовком.'),
      Q.w('Спроектируйте REST API для библиотеки: перечислите 5 эндпоинтов (метод и путь) для книг и выдач (получить список книг, книгу, создать книгу, выдать книгу читателю, вернуть книгу).',
        [['GET\\s+/books\\b', 'Список книг: GET /books'], ['GET\\s+/books/\\{?\\w+\\}?', 'Книга: GET /books/{id}'], ['POST\\s+/books\\b', 'Создание: POST /books'], ['loans|borrow|checkout|issue|rentals', 'Выдачи как ресурс (loans)'], ['return|PATCH|PUT|DELETE', 'Возврат книги']],
        'GET /books\nGET /books/{id}\nPOST /books\nPOST /loans {book_id, reader_id}\nPOST /loans/{id}/return', 'Ресурсы: books, loans.', ['Ресурс выдачи — loans.', 'Возврат — действие на выдаче.'], 30),
      Q.w('Объясните разницу между 401 и 403 и приведите пример из вашего API (2–4 предложения).', [['401', 'Упомяните 401'], ['403', 'Упомяните 403'], ['токен|аутентиф|авториз', 'Упомяните токен или аутентификацию'], ['прав', 'Упомяните права']],
        '401 — клиент не представился или токен неверный. 403 — токен верный, но прав нет. Пример: токен только на чтение при POST /orders даёт 403, без токена — 401.', '', [], 60)
    ],
    test: [
      Q.c('Чем отличается 422 от 400?', ['422 — синтаксис верен, но нарушено бизнес-правило', '422 означает нет прав', '400 — только для GET', 'Разницы нет'], 0, ''),
      Q.c('Что означает 304 Not Modified?', ['Кэш клиента актуален', 'Ресурс удалён', 'Ошибка сервера', 'Нужен токен'], 0, ''),
      Q.c('Как клиент должен вести себя после 429 с Retry-After: 30?', ['Подождать 30 секунд и повторить', 'Сразу повторить', 'Прекратить работу навсегда', 'Сменить метод'], 0, ''),
      Q.tf('Оцените утверждения об идемпотентности и форматах.', [['Идемпотентность POST можно обеспечить заголовком Idempotency-Key', true], ['Ответ 201 должен содержать Location', true], ['DELETE — безопасный метод', false], ['Ключи JSON допускается писать в одинарных кавычках', false]], '')
    ]
  });

  /* ---------- ГЛАВА 15: брокеры ---------- */
  SAQ.extend(15, {
    goals: ['читать топологию Kafka: продюсеры, партиции, группы потребителей'],
    lesson: [{ after: 2, h: 'Читаем топологию Kafka', html: `
<p>Топик делится на <b>партиции</b>. Продюсер выбирает партицию по ключу сообщения: одинаковый ключ — одна партиция, поэтому порядок событий по одному заказу сохраняется. Внутри группы потребителей каждую партицию читает один потребитель; если потребителей больше, чем партиций, лишние простаивают.</p>
${dg('kafka-topology')}
<ul><li>Три партиции и два потребителя в группе: Consumer A читает 0 и 1, Consumer B — 2.</li><li>Порядок гарантирован только внутри партиции.</li><li>Добавить параллелизм = добавить партиции и потребителей.</li></ul>
<div class="interview">Вопрос: «Сколько потребителей группы будут полезны при 3 партициях?» Не больше трёх, остальные простаивают.</div>`,
      check: Q.c('Где Kafka гарантирует порядок?', ['Внутри одной партиции', 'Во всём топике', 'Между топиками', 'Нигде'], 0, '') }],
    practice: [
      Q.dg(Q.c('Сколько партиций читает Consumer A?', ['Две', 'Одну', 'Три', 'Ни одной'], 0, 'Партиции 0 и 1.'), D('kafka-topology')),
      Q.dgf('Нарушено правило группы: одну партицию читают два потребителя группы. Найдите лишнюю связь.', (() => { const s = D('kafka-topology'); s.flows.push({ a: 'p2', b: 'c1', id: 'p2>c1', via: 'under', lift: 24 }); return s; })(), ['p2>c1'], 'Партиция читается одним потребителем группы.'),
      Q.cl('Очередь или топик с подпиской?', ['Очередь (один получатель)', 'Публикация-подписка (все подписчики)'], [['Задание на отправку письма', 0], ['Событие OrderCreated для склада, биллинга и аналитики', 1], ['Рассылка курса валют', 1], ['Задача на обработку изображения', 0]], '')
    ],
    test: []
  });

  /* ---------- ГЛАВА 16: OpenAPI ---------- */
  SAQ.extend(16, {
    goals: ['находить ошибки в YAML-спецификации'],
    lesson: [{ after: 2, h: 'Читаем спецификацию целиком', html: `
<pre><code>openapi: 3.0.3
info: {title: Orders API, version: 1.0.0}
paths:
  /orders/{id}:
    get:
      summary: Получить заказ
      parameters:
        - name: id
          in: path
          required: true
          schema: {type: integer}
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema: {$ref: "#/components/schemas/Order"}
        "404": {description: Не найден}
components:
  schemas:
    Order:
      type: object
      required: [id, status]
      properties:
        id: {type: integer}
        status: {type: string, enum: [new, paid]}</code></pre>
<p>Читайте сверху вниз: версия, описание, пути, операции, параметры, ответы, схемы. Любой <code>$ref</code> должен указывать на существующую схему. Path-параметр всегда <code>required: true</code>.</p>
<div class="warn">В YAML отступ — это структура. Лишний пробел превращает поле в «чужое». Описание ответа (<code>description</code>) обязательно.</div>`,
      check: Q.c('Какой атрибут обязателен у path-параметра?', ['required: true', 'default', 'nullable', 'example'], 0, '') }],
    practice: [
      Q.ch('Найдите ошибки в спецификации.', ['openapi: 3.0.3', 'info: {title: Orders API, version: 1.0.0}', 'paths:', '  /orders/{id}:', '    get:', '      parameters:', '        - {name: id, in: path, required: false, schema: {type: integer}}', '      responses:', '        "200":', '          content:', '            application/json:', '              schema: {$ref: "#/components/schemas/Orderr"}'], [6, 9, 11], 'Path-параметр обязателен, у ответа нет description, ссылка на несуществующую схему Orderr.'),
      Q.ch('Найдите ошибки в схеме Order.', ['Order:', '  type: object', '  required: [id, status, comment]', '  properties:', '    id: {type: integer}', '    status: {type: string, enum: [new, paid]}', '    total: {type: string, format: decimal}'], [2, 6], 'comment указан как обязательный, но не описан; money лучше number, а не string с неизвестным format.'),
      Q.z('Заполните пропуски.', 'Повторно используемые описания лежат в {{0}}, а ссылаются на них через {{1}}.', [[['components', 'paths', 'info'], 'components'], [['$ref', 'enum', 'type'], '$ref']], '')
    ],
    test: []
  });

  /* ---------- ГЛАВА 17: Postman ---------- */
  SAQ.extend(17, {
    goals: ['писать тесты и скрипты для проверки идемпотентности, ошибок и лимитов'],
    lesson: [{ after: 3, h: 'Скрипты, Runner и curl', html: `
<p>Коллекция превращается в автотест, когда у каждого запроса есть проверки, а переменные передают данные между запросами.</p>
<pre><code>// Tests
pm.test("статус 201", () =&gt; pm.response.to.have.status(201));
pm.test("есть Location", () =&gt; pm.response.to.have.header("Location"));
const body = pm.response.json();
pm.expect(body).to.have.property("id");
pm.collectionVariables.set("orderId", body.id);</code></pre>
<p>Следующий запрос использует <code>{{orderId}}</code> в URL: <code>GET /orders/{{orderId}}</code>. Pre-request script подготавливает данные: <code>pm.variables.set("key", crypto.randomUUID())</code> даёт уникальный Idempotency-Key.</p>
<h3>Собираем сценарий и запускаем Runner</h3>
<ol><li>Логин и сохранение токена в окружение.</li><li>Создание заказа и сохранение id.</li><li>Получение заказа и проверка полей.</li><li>Негативные проверки: без токена 401, чужой токен 403, несуществующий id 404.</li><li>Collection Runner запускает всё и показывает отчёт. В CI это делает Newman.</li></ol>
<h3>Эквивалент в curl</h3>
<pre><code>curl -i -X POST https://api.example.ru/orders \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 7f3a" \\
  -d '{"client_id":1,"items":[{"product_id":1,"quantity":2}]}'</code></pre>
<p>Флаг <code>-i</code> показывает заголовки ответа, <code>-X</code> задаёт метод, <code>-H</code> заголовок, <code>-d</code> тело.</p>`,
      check: Q.c('Как передать id созданного заказа следующему запросу?', ['Сохранить в переменную и использовать {{orderId}}', 'Вписать вручную', 'Не получится', 'Через cookie'], 0, '') }],
    practice: [
      Q.api('Сценарий регрессии: проверьте три негатива подряд — GET /orders без токена (401), GET /orders/999 (404), GET /orders/1 (200).',
        [['GET', '^/orders$', 401, 'без токена → 401'], ['GET', '^/orders/999$', 404, '999 → 404'], ['GET', '^/orders/1$', 200, '1 → 200']],
        [{ method: 'GET', url: '/orders', headers: '', body: '' }, { method: 'GET', url: '/orders/999', headers: H, body: '' }, { method: 'GET', url: '/orders/1', headers: H, body: '' }], 'Хороший набор тестов включает позитив и негатив.', []),
      Q.api('Проверка защиты: токен только на чтение должен читать заказы (GET /orders → 200), но не удалять (DELETE /orders/1 → 403).',
        [['GET', '^/orders$', 200, 'GET с readonly → 200'], ['DELETE', '^/orders/1$', 403, 'DELETE с readonly → 403']],
        [{ method: 'GET', url: '/orders', headers: 'Authorization: Bearer readonly-token', body: '' }, { method: 'DELETE', url: '/orders/1', headers: 'Authorization: Bearer readonly-token', body: '' }], 'Разграничение прав проверяют разными токенами.', []),
      Q.api('Создайте заказ с Location (201), затем получите его по номеру: новый заказ получает id 3, GET /orders/3 → 200.',
        [['POST', '^/orders$', 201, 'POST /orders → 201'], ['GET', '^/orders/3$', 200, 'GET /orders/3 → 200']],
        [{ method: 'POST', url: '/orders', headers: J, body: ORD }, { method: 'GET', url: '/orders/3', headers: H, body: '' }], 'Id берут из ответа или заголовка Location.', []),
      Q.ch('Найдите ошибки в тестовом скрипте Postman.', ['pm.test("статус 201", () => pm.response.to.have.status(201));', 'const body = pm.response.json;', 'pm.expect(body).to.have.property("id");', 'pm.environment.set(orderId, body.id);'], [1, 3], 'json — это метод, нужны скобки; имя переменной — строка в кавычках.'),
      Q.ch('Найдите ошибки в curl-запросе.', ['curl -X POST https://api.example.ru/orders', '  -H "Authorization: Bearer $TOKEN"', '  -H "Content-Type: text/plain"', '  -d {"client_id":1}'], [2, 3], 'Для JSON нужен Content-Type: application/json, а тело нужно взять в кавычки.'),
      Q.cl('Какую проверку написать?', ['Статус', 'Заголовок', 'Тело'], [['to.have.status(404)', 0], ['to.have.header("Location")', 1], ['json().total === 1500.5', 2], ['to.have.header("Retry-After")', 1], ['to.have.status(429)', 0]], '')
    ],
    test: []
  });
})();
