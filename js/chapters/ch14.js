(function () {
  const Q = SAQ.Q;
  const H = 'Authorization: Bearer demo-token';
  SAQ.chapter(14, '🔌', 'Интеграции и REST API',
    'HTTP, методы, коды ответов, заголовки, JSON, принципы REST, идемпотентность, пагинация, версионирование, ошибки, аутентификация. Практика в мини-Postman.',
    ['объяснить, как устроен HTTP-запрос и ответ', 'выбирать правильный метод и код ответа', 'проектировать REST-ресурсы, фильтры, пагинацию и ошибки', 'отправлять запросы к тестовому API и разбирать ответ'],
    [
      { h: 'Интеграции: зачем и какие бывают', html: `
<p><b>Интеграция</b> — обмен данными между системами. Способы:</p>
<table><tr><th>Способ</th><th>Суть</th><th>Плюс/минус</th></tr>
<tr><td>REST API (HTTP+JSON)</td><td>запрос-ответ</td><td>просто, популярно / нет гарантии доставки событий</td></tr>
<tr><td>SOAP (XML)</td><td>строгий контракт WSDL</td><td>формальность / громоздко</td></tr>
<tr><td>gRPC</td><td>бинарный protobuf</td><td>быстро / сложнее отладка</td></tr>
<tr><td>Брокер сообщений</td><td>асинхронные события</td><td>развязка / сложность</td></tr>
<tr><td>Файлы (SFTP/CSV)</td><td>пакетная выгрузка</td><td>просто / задержка</td></tr>
<tr><td>Общая БД</td><td>чтение чужих таблиц</td><td>быстро / высокая связность — антипаттерн</td></tr></table>
<p><b>Синхронная</b> интеграция: вызывающий ждёт ответа. <b>Асинхронная</b>: отправил и продолжил работу, результат придёт позже.</p>`,
        check: Q.c('Какая интеграция считается антипаттерном из-за высокой связности?', ['Чтение чужой БД напрямую', 'REST API', 'Событие в брокере', 'Webhook'], 0, '') },
      { h: 'HTTP: запрос и ответ', html: `
<pre><code>POST /orders HTTP/1.1
Host: api.shop.ru
Authorization: Bearer eyJ...
Content-Type: application/json

{"client_id": 1, "items": [{"product_id": 2, "quantity": 3}]}</code></pre>
<pre><code>HTTP/1.1 201 Created
Content-Type: application/json
Location: /orders/42

{"id": 42, "status": "новый"}</code></pre>
<h3>Части запроса</h3>
<ul><li><b>URL:</b> схема, хост, путь (<code>/orders/42</code>), query-параметры (<code>?status=paid&amp;limit=10</code>);</li><li><b>Метод;</b></li><li><b>Заголовки:</b> Content-Type, Accept, Authorization, Idempotency-Key;</li><li><b>Тело:</b> JSON для POST/PUT/PATCH.</li></ul>
<h3>JSON</h3>
<p>Объекты <code>{}</code>, массивы <code>[]</code>, строки, числа, true/false, null. Ключи — в двойных кавычках; комментариев нет; запятая после последнего элемента недопустима.</p>`,
        check: Q.c('Где передают токен авторизации?', ['В заголовке Authorization', 'В коде ответа', 'В методе', 'В имени файла'], 0, '') },
      { h: 'Методы и коды ответов', html: `
<table><tr><th>Метод</th><th>Смысл</th><th>Безопасный</th><th>Идемпотентный</th></tr>
<tr><td>GET</td><td>получить</td><td>да</td><td>да</td></tr><tr><td>POST</td><td>создать/действие</td><td>нет</td><td>нет</td></tr>
<tr><td>PUT</td><td>заменить целиком</td><td>нет</td><td>да</td></tr><tr><td>PATCH</td><td>изменить частично</td><td>нет</td><td>зависит</td></tr>
<tr><td>DELETE</td><td>удалить</td><td>нет</td><td>да</td></tr></table>
<h3>Коды</h3>
<table><tr><th>Код</th><th>Значение</th></tr>
<tr><td>200 OK</td><td>успех</td></tr><tr><td>201 Created</td><td>создано</td></tr><tr><td>202 Accepted</td><td>принято в обработку</td></tr><tr><td>204 No Content</td><td>успех без тела</td></tr>
<tr><td>400 Bad Request</td><td>некорректный запрос</td></tr><tr><td>401 Unauthorized</td><td>нет/неверная аутентификация</td></tr><tr><td>403 Forbidden</td><td>нет прав</td></tr><tr><td>404 Not Found</td><td>ресурс не найден</td></tr>
<tr><td>409 Conflict</td><td>конфликт состояния</td></tr><tr><td>422 Unprocessable Entity</td><td>данные не прошли валидацию</td></tr><tr><td>429 Too Many Requests</td><td>превышен лимит</td></tr>
<tr><td>500 Internal Server Error</td><td>ошибка сервера</td></tr><tr><td>502/503/504</td><td>шлюз/недоступно/таймаут</td></tr></table>
<div class="warn">401 — «кто вы?», 403 — «вам нельзя». Не путайте.</div>`,
        check: Q.mt('Сопоставьте код и ситуацию.', [['201', 'Заказ создан'], ['401', 'Нет токена'], ['403', 'Нет прав на действие'], ['404', 'Заказа не существует'], ['409', 'Товара нет на складе']], '') },
      { h: 'Принципы REST и проектирование', html: `
<ul><li><b>Ресурсы</b> — существительные во множественном числе: <code>/orders</code>, <code>/orders/42</code>, <code>/orders/42/items</code>.</li><li>Действие выражается <b>методом</b>, а не глаголом в URL (не <code>/createOrder</code>).</li><li><b>Stateless</b>: сервер не хранит сессию клиента между запросами.</li><li>Единообразный интерфейс, кэшируемость, слоистость.</li></ul>
<h3>Фильтры, сортировка, пагинация</h3>
<pre><code>GET /orders?status=paid&amp;sort=-created_at&amp;limit=20&amp;offset=40</code></pre>
<p>Пагинация: <b>offset/limit</b> (просто, но дрейфует), <b>cursor</b> (устойчивее). В ответе: общее число, ссылки на следующую страницу.</p>
<h3>Ошибки</h3>
<pre><code>{"code": "OUT_OF_STOCK", "message": "Товара нет на складе", "details": [{"product_id": 3}]}</code></pre>
<h3>Версионирование</h3>
<p><code>/v1/orders</code>, заголовок <code>Accept-Version</code>. Ломающие изменения — только в новой версии.</p>
<h3>Идемпотентность POST</h3>
<p>Заголовок <code>Idempotency-Key</code>: повтор с тем же ключом возвращает прежний результат, не создавая второй заказ.</p>`,
        check: Q.c('Какой URL соответствует REST-стилю?', ['POST /orders', 'GET /getAllOrders', 'POST /createOrder', 'GET /doOrder?id=5'], 0, '') },
      { h: 'Аутентификация и безопасность API', html: `
<ul><li><b>Basic</b> — логин:пароль в Base64 (только через HTTPS);</li><li><b>API-ключ</b> — заголовок X-API-Key;</li><li><b>Bearer токен / JWT</b> — получили на /login, передаёте в Authorization;</li><li><b>OAuth 2.0</b> — делегированный доступ; access + refresh токены.</li></ul>
<p>JWT состоит из header.payload.signature (Base64URL); payload читаем всеми, но подпись защищает от подделки. Не кладите в payload секреты.</p>
<p>Аутентификация (кто вы) ≠ авторизация (что вам можно). Всегда HTTPS, валидация входа, лимиты запросов (rate limit), логирование.</p>
<div class="interview">Частый вопрос: «Чем PUT отличается от PATCH?» PUT заменяет ресурс целиком, PATCH меняет часть полей.</div>`,
        check: Q.c('Аутентификация отвечает на вопрос…', ['Кто вы?', 'Что вам можно?', 'Где вы?', 'Когда?'], 0, '') }
    ],
    [
      Q.api('Войдите в систему: отправьте POST /login с телом {"login":"anna","password":"demo"} и получите код 200.', [['POST', '^/login$', 200, 'POST /login → 200']], [{ method: 'POST', url: '/login', headers: 'Content-Type: application/json', body: '{"login":"anna","password":"demo"}' }], 'Успешный вход возвращает token.', ['Метод POST, путь /login.', 'Нужны поля login и password.', 'Пароль — demo.']),
      Q.api('Покажите, что без токена доступ закрыт: выполните GET /orders без заголовка и получите 401.', [['GET', '^/orders$', 401, 'GET /orders без токена → 401']], [{ method: 'GET', url: '/orders', headers: '', body: '' }], '401 — нет аутентификации.', ['Просто не добавляйте заголовок Authorization.']),
      Q.api('Получите список заказов с токеном: GET /orders → 200.', [['GET', '^/orders$', 200, 'GET /orders с токеном → 200']], [{ method: 'GET', url: '/orders', headers: H, body: '' }], 'Заголовок Authorization: Bearer demo-token.', ['Заголовок: Authorization: Bearer demo-token.']),
      Q.api('Найдите заказ, которого нет: GET /orders/999 → 404.', [['GET', '^/orders/999$', 404, 'GET /orders/999 → 404']], [{ method: 'GET', url: '/orders/999', headers: H, body: '' }], '404 — ресурс не найден.', ['Нужен токен, иначе получите 401.']),
      Q.api('Создайте заказ: POST /orders с client_id=1 и одной позицией (product_id=1, quantity=2) → 201.', [['POST', '^/orders$', 201, 'POST /orders → 201']], [{ method: 'POST', url: '/orders', headers: H + '\nContent-Type: application/json', body: '{"client_id":1,"items":[{"product_id":1,"quantity":2}]}' }], '201 — создан.', ['В теле — client_id и массив items.', 'Элемент: {"product_id":1,"quantity":2}.']),
      Q.api('Воспроизведите конфликт: закажите товар product_id=3 (его нет на складе) и получите 409.', [['POST', '^/orders$', 409, 'POST /orders (товара нет) → 409']], [{ method: 'POST', url: '/orders', headers: H, body: '{"client_id":1,"items":[{"product_id":3,"quantity":1}]}' }], '409 — конфликт состояния.', ['product_id именно 3.']),
      Q.api('Измените статус заказа 1 на «оплачен» через PATCH → 200.', [['PATCH', '^/orders/1$', 200, 'PATCH /orders/1 → 200']], [{ method: 'PATCH', url: '/orders/1', headers: H, body: '{"status":"оплачен"}' }], 'PATCH меняет только указанные поля.', ['Тело: {"status":"оплачен"}.']),
      Q.api('Удалите заказ 2: DELETE → 204, а затем убедитесь, что GET /orders/2 даёт 404.', [['DELETE', '^/orders/2$', 204, 'DELETE /orders/2 → 204'], ['GET', '^/orders/2$', 404, 'GET /orders/2 после удаления → 404']], [{ method: 'DELETE', url: '/orders/2', headers: H, body: '' }, { method: 'GET', url: '/orders/2', headers: H, body: '' }], 'Проверять побочные эффекты — привычка аналитика.', ['Две последовательные запросы.']),
      Q.api('Отфильтруйте заказы по статусу: GET /orders?status=оплачен → 200.', [['GET', '^/orders\\?status=', 200, 'GET /orders?status=… → 200']], [{ method: 'GET', url: '/orders?status=оплачен', headers: H, body: '' }], 'Фильтры идут в query-параметрах.', ['После пути добавьте ?status=значение.'])
    ],
    [
      Q.c('Какой метод идемпотентен и заменяет ресурс целиком?', ['PUT', 'POST', 'PATCH', 'GET'], 0, ''),
      Q.c('Какой код — «Ресурс создан»?', ['201', '200', '204', '302'], 0, ''),
      Q.c('403 означает…', ['Нет прав', 'Не найдено', 'Не авторизован', 'Ошибка сервера'], 0, ''),
      Q.tf('Верно?', [['GET должен быть безопасным (без изменения данных)', true], ['В REST действие часто зашивают в URL (/createOrder)', false]], ''),
      Q.m('Что может быть в HTTP-запросе?', ['Метод', 'Заголовки', 'Тело', 'Код ответа'], [0, 1, 2], 'Код ответа — часть ответа.'),
      Q.c('Для защиты от дублей при повторе POST используют…', ['Idempotency-Key', 'Cookie', 'GET', 'CDN'], 0, ''),
      Q.c('JSON-ключи должны быть…', ['В двойных кавычках', 'В одинарных', 'Без кавычек', 'В скобках'], 0, ''),
      Q.cl('Какой статус вернуть?', ['400/422', '401', '404', '409'], [['Отсутствует обязательное поле', 0], ['Нет токена', 1], ['Заказ с таким id не найден', 2], ['Отмена уже доставленного заказа', 3]], '')
    ]
  );
})();
