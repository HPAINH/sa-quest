(function () {
  const Q = SAQ.Q;
  SAQ.chapter(16, '📑', 'Swagger / OpenAPI',
    'Спецификация OpenAPI 3: структура, paths, parameters, requestBody, responses, components/schemas, security; Swagger Editor и UI.',
    ['объяснить разницу между OpenAPI и Swagger', 'читать и писать спецификацию в YAML', 'описывать параметры, тела, ответы и ошибки через $ref и components', 'описывать аутентификацию и находить типичные ошибки спецификации'],
    [
      { h: 'OpenAPI и Swagger', html: `
<p><b>OpenAPI Specification (OAS)</b> — стандарт описания REST API в YAML/JSON. <b>Swagger</b> — набор инструментов вокруг него: Swagger Editor (пишем), Swagger UI (читаем и пробуем запросы), Swagger Codegen (генерируем код). Версия 2.0 называлась Swagger, с 3.0 — OpenAPI.</p>
<h3>Зачем</h3>
<ul><li>единый контракт между фронтом, бэком, тестировщиками и внешними партнёрами;</li><li>автогенерация документации и клиентов;</li><li>мок-серверы для параллельной разработки;</li><li>импорт в Postman.</li></ul>
<div class="key">Подход <b>design-first</b>: сначала спецификация, потом реализация. Альтернатива <b>code-first</b>: документация генерируется из кода.</div>`,
        check: Q.c('OpenAPI — это…', ['Стандарт описания REST API', 'Язык программирования', 'БД', 'Протокол'], 0, '') },
      { h: 'Структура документа', html: `
<pre><code>openapi: 3.0.3
info:
  title: Orders API
  version: 1.0.0
servers:
  - url: https://api.shop.ru/v1
paths:
  /orders:
    get: ...
    post: ...
  /orders/{id}:
    get: ...
components:
  schemas: ...
  securitySchemes: ...
security:
  - bearerAuth: []</code></pre>
<ul><li><b>info</b> — название, версия, описание;</li><li><b>servers</b> — базовые URL;</li><li><b>paths</b> — маршруты и операции;</li><li><b>components</b> — переиспользуемые схемы, параметры, ответы;</li><li><b>security</b> — способ аутентификации.</li></ul>`,
        check: Q.c('Где хранят переиспользуемые схемы?', ['components/schemas', 'info', 'servers', 'tags'], 0, '') },
      { h: 'Операция: параметры, тело, ответы', html: `
<pre><code>/orders/{id}:
  get:
    summary: Получить заказ
    operationId: getOrder
    tags: [orders]
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: integer, format: int64 }
    responses:
      '200':
        description: Заказ
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Order' }
      '404':
        description: Не найден
        content:
          application/json:
            schema: { $ref: '#/components/schemas/Error' }</code></pre>
<ul><li><b>in</b>: path, query, header, cookie;</li><li><b>requestBody</b> для POST/PUT/PATCH с content и schema;</li><li><b>required</b> у параметра path всегда true;</li><li>описывайте не только 200, но и 400/401/404/409/500.</li></ul>`,
        check: Q.mt('Сопоставьте «in» и пример.', [['path', '/orders/{id}'], ['query', '?status=paid'], ['header', 'Authorization'], ['cookie', 'session_id']], '') },
      { h: 'Схемы данных и components', html: `
<pre><code>components:
  schemas:
    Order:
      type: object
      required: [id, client_id, status]
      properties:
        id:         { type: integer, format: int64, readOnly: true }
        client_id:  { type: integer }
        status:     { type: string, enum: [new, paid, delivered, canceled] }
        total:      { type: number, format: double, minimum: 0 }
        created_at: { type: string, format: date-time }
        items:
          type: array
          items: { $ref: '#/components/schemas/OrderItem' }
    Error:
      type: object
      required: [code, message]
      properties:
        code:    { type: string }
        message: { type: string }</code></pre>
<ul><li>Типы: string, number, integer, boolean, array, object;</li><li>format: int32, int64, date, date-time, email, uuid;</li><li>ограничения: minLength, maxLength, pattern, minimum, maximum, enum, nullable;</li><li><code>oneOf / anyOf / allOf</code> — композиция;</li><li><code>readOnly</code> — только в ответах, <code>writeOnly</code> — только в запросах.</li></ul>
<div class="warn">Ошибка: необъявленные <code>required</code> — разработчик не знает, какие поля обязательны.</div>`,
        check: Q.c('Как отметить поле как возвращаемое только сервером?', ['readOnly: true', 'required: false', 'writeOnly: true', 'nullable: true'], 0, '') },
      { h: 'Безопасность и типичные ошибки', html: `
<pre><code>components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []</code></pre>
<h3>Типичные ошибки</h3>
<ul><li>отступы YAML (только пробелы, не табы);</li><li>$ref на несуществующую схему;</li><li>не описаны ошибочные ответы;</li><li>нет примеров (<code>example</code>), нет описаний (<code>description</code>);</li><li>разные операции с одинаковым <code>operationId</code>;</li><li>расхождение спецификации и реальной реализации.</li></ul>
<div class="interview">Вопрос: «Как вы описываете API для команды?» — OpenAPI в YAML, примеры запросов/ответов, коды ошибок, схемы в components, ревью с разработчиками и тестировщиками, импорт в Postman.</div>`,
        check: Q.c('Какая ошибка YAML встречается чаще всего?', ['Неправильные отступы', 'Слишком много комментариев', 'Длинные строки', 'Кириллица'], 0, '') }
    ],
    [
      Q.mt('Сопоставьте раздел и назначение.', [['info', 'Название и версия API'], ['servers', 'Базовые URL'], ['paths', 'Маршруты и операции'], ['components', 'Переиспользуемые схемы']], ''),
      Q.hu('Найдите ошибки в YAML-фрагменте (кликайте по ошибочным токенам).', ['parameters:', 'name:', 'id', 'in:', 'path', 'required:', 'false', 'schema:', 'type: integer'], [6], 'Параметр path всегда required: true.', ['Что должно быть у path-параметра?']),
      Q.z('Дополните.', 'Для ответа 404 используют {{0}} {{1}} со схемой Error.', [[['responses', 'servers', 'info'], 'responses'], [['content', 'tags', 'title'], 'content']], ''),
      Q.m('Что полезно описывать в операции?', ['Параметры', 'requestBody', 'Коды ошибок', 'Любимый цвет'], [0, 1, 2], ''),
      Q.w('Опишите словами схему Product: поля, типы, обязательность, ограничения.', [['id', 'Поле id'], ['title|name|назван', 'Поле названия'], ['price|цен', 'Поле цены'], ['обязател|required', 'Укажите обязательность'], ['≥|>=|minimum|не\\s+отриц|неотриц|больше', 'Ограничение на цену']], 'Product: id (integer, readOnly), title (string, 1–200, обязательное), price (number, ≥ 0, обязательное), stock (integer, ≥ 0), created_at (date-time, readOnly). required: [title, price].', ['Типы + ограничения + required.'], 80),
      Q.o('Расположите разделы документа OpenAPI.', ['openapi', 'info', 'servers', 'paths', 'components'], ''),
      Q.tf('Верно?', [['Design-first — сначала спецификация, потом код', true], ['operationId может повторяться', false]], '')
    ],
    [
      Q.c('Swagger UI нужен для…', ['Просмотра и пробы API', 'Хранения БД', 'Написания кода', 'Шифрования'], 0, ''),
      Q.c('Тип параметра, указанного в URL как /orders/{id}:', ['path', 'query', 'header', 'body'], 0, ''),
      Q.tf('Верно?', [['$ref ссылается на схему в components', true], ['В YAML можно использовать табы', false]], ''),
      Q.m('Форматы (format):', ['date-time', 'int64', 'uuid', 'banana'], [0, 1, 2], ''),
      Q.c('securitySchemes описывает…', ['Способ аутентификации', 'Таблицы', 'Стили', 'Тесты'], 0, ''),
      Q.c('allOf используется для…', ['Композиции схем', 'Циклов', 'Тестов', 'Версий'], 0, ''),
      Q.c('Зачем описывать ошибки?', ['Чтобы клиенты корректно их обрабатывали', 'Для объёма', 'Не нужно', 'Для SEO'], 0, ''),
      Q.c('Генерация клиента из OpenAPI возможна в…', ['Swagger/OpenAPI Generator', 'Excel', 'Word', 'Paint'], 0, '')
    ]
  );
})();
