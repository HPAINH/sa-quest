(function () {
  const A = SAQ.addDg;
  A('bpmn-order', {
    title: 'BPMN: обработка заказа', note: 'Один пул «Интернет-магазин» и две дорожки. Потоки идут слева направо: выходят из правой стороны, входят в левую. У исключающего шлюза подписаны обе ветки, каждый конец назван итоговым состоянием.',
    spec: { type: 'bpmn', pool: 'Интернет-магазин', lanes: [{ t: 'Менеджер', from: 0, to: 1 }, { t: 'Система', from: 2, to: 2 }],
      nodes: [
        { id: 's', k: 'start', t: 'Заказ поступил', x: 0, y: 1 }, { id: 't2', k: 'user', t: 'Проверить заказ', x: 1, y: 1 }, { id: 'g1', k: 'gw', t: 'Данные верны?', x: 2, y: 1 },
        { id: 't4', k: 'user', t: 'Связаться с клиентом', x: 3, y: 0 }, { id: 'e1', k: 'end', t: 'Заказ отклонён', x: 4, y: 0 },
        { id: 't5', k: 'service', t: 'Зарезервировать товар', x: 3, y: 2 }, { id: 't6', k: 'service', t: 'Выставить счёт', x: 4, y: 2 }, { id: 'e2', k: 'end', t: 'Заказ принят', x: 5, y: 2 }],
      flows: [{ a: 's', b: 't2' }, { a: 't2', b: 'g1' }, { a: 'g1', b: 't4', t: 'нет' }, { a: 't4', b: 'e1' }, { a: 'g1', b: 't5', t: 'да' }, { a: 't5', b: 't6' }, { a: 't6', b: 'e2' }] }
  });
  A('bpmn-pools', {
    title: 'Взаимодействие двух участников', note: 'Каждый участник — отдельный пул. Внутри пула идут потоки управления, между пулами — только потоки сообщений (пунктир, кружок в начале, открытая стрелка), подписанные именем сообщения.',
    spec: { type: 'bpmn', lanes: [{ t: 'Клиент', from: 0, to: 0 }, { t: 'Магазин', from: 2, to: 2 }],
      nodes: [
        { id: 'a1', k: 'start', t: 'Нужен товар', x: 0, y: 0 }, { id: 'a2', k: 'send', t: 'Отправить заказ', x: 1, y: 0 }, { id: 'a3', k: 'mid', t: 'Получить счёт', ev: 'msg', lt: true, x: 2, y: 0 }, { id: 'a4', k: 'user', t: 'Оплатить счёт', x: 3, y: 0 }, { id: 'a5', k: 'mid', t: 'Получить товар', ev: 'msg', lt: true, x: 4, y: 0 }, { id: 'a6', k: 'end', t: 'Товар получен', x: 5, y: 0 },
        { id: 'b1', k: 'start', ev: 'msg', t: 'Получить заказ', x: 1, y: 2 }, { id: 'b2', k: 'send', t: 'Выслать счёт', x: 2, y: 2 }, { id: 'b3', k: 'receive', t: 'Принять оплату', x: 3, y: 2 }, { id: 'b4', k: 'service', t: 'Отгрузить заказ', x: 4, y: 2 }, { id: 'b5', k: 'end', t: 'Заказ выполнен', x: 5, y: 2 }],
      flows: [{ a: 'a1', b: 'a2' }, { a: 'a2', b: 'a3' }, { a: 'a3', b: 'a4' }, { a: 'a4', b: 'a5' }, { a: 'a5', b: 'a6' }, { a: 'b1', b: 'b2' }, { a: 'b2', b: 'b3' }, { a: 'b3', b: 'b4' }, { a: 'b4', b: 'b5' },
        { a: 'a2', b: 'b1', msg: true, t: 'Заказ' }, { a: 'b2', b: 'a3', msg: true, t: 'Счёт' }, { a: 'a4', b: 'b3', msg: true, t: 'Оплата' }, { a: 'b4', b: 'a5', msg: true, t: 'Товар' }] }
  });
  A('bpmn-parallel', {
    title: 'Параллельные ветки и таймер', note: 'Шлюз «+» запускает ветки одновременно, второй «+» ждёт все. Граничное ожидание описано промежуточным таймером.',
    spec: { type: 'bpmn', nodes: [
      { id: 's', k: 'start', t: 'Заказ оплачен', x: 0, y: 1 }, { id: 'f', k: 'and', x: 1, y: 1 },
      { id: 'p', k: 'service', t: 'Упаковать', x: 2, y: 0 }, { id: 'n', k: 'service', t: 'Уведомить клиента', x: 2, y: 1 }, { id: 'c', k: 'service', t: 'Заказать курьера', x: 2, y: 2 },
      { id: 'j', k: 'and', x: 3, y: 1 }, { id: 'w', k: 'mid', ev: 'timer', t: 'Прошло 24 часа', x: 4, y: 1 }, { id: 'e', k: 'end', t: 'Передано в доставку', x: 5, y: 1 }],
      flows: [{ a: 's', b: 'f' }, { a: 'f', b: 'p' }, { a: 'f', b: 'n' }, { a: 'f', b: 'c' }, { a: 'p', b: 'j' }, { a: 'n', b: 'j' }, { a: 'c', b: 'j' }, { a: 'j', b: 'w' }, { a: 'w', b: 'e' }] }
  });
  A('seq-login', {
    title: 'Sequence: вход пользователя', note: 'Сплошная стрелка — запрос, пунктир — ответ. Фрагмент alt — выбор по условию.',
    spec: { type: 'seq', parts: [{ id: 'u', t: 'Пользователь', actor: true }, { id: 'api', t: 'API' }, { id: 'auth', t: 'Сервис авторизации' }, { id: 'db', t: 'БД' }],
      msgs: [{ a: 'u', b: 'api', t: 'POST /login', k: 'sync' }, { a: 'api', b: 'auth', t: 'проверить(login, password)', k: 'sync' }, { a: 'auth', b: 'db', t: 'найти пользователя', k: 'sync' }, { a: 'db', b: 'auth', t: 'запись', k: 'ret' },
        { a: 'auth', b: 'api', t: 'токен', k: 'ret' }, { a: 'api', b: 'u', t: '200 + токен', k: 'ret' }, { a: 'auth', b: 'api', t: 'отказ', k: 'ret' }, { a: 'api', b: 'u', t: '401', k: 'ret' }],
      frames: [{ k: 'alt', t: 'пароль верный', from: 4, to: 7, else: 6, et: 'иначе', a: 0, b: 3 }] }
  });
  A('seq-order', {
    title: 'Sequence: создание заказа', note: 'Синхронный вызов оплаты и асинхронная публикация события в брокер.',
    spec: { type: 'seq', parts: [{ id: 'c', t: 'Клиент', actor: true }, { id: 'api', t: 'Order API' }, { id: 'pay', t: 'Платёжный сервис' }, { id: 'mq', t: 'Брокер' }],
      msgs: [{ a: 'c', b: 'api', t: 'POST /orders', k: 'sync' }, { a: 'api', b: 'api', t: 'проверить данные', k: 'self' }, { a: 'api', b: 'pay', t: 'списать оплату', k: 'sync' }, { a: 'pay', b: 'api', t: 'оплачено', k: 'ret' },
        { a: 'api', b: 'mq', t: 'OrderCreated', k: 'async' }, { a: 'api', b: 'c', t: '201 Created', k: 'ret' }] }
  });
  A('seq-oauth', {
    title: 'Sequence: OAuth 2.0 Authorization Code', note: 'Пользователь входит у провайдера, клиент меняет код на токен и вызывает API.',
    spec: { type: 'seq', pw: 200, parts: [{ id: 'u', t: 'Пользователь', actor: true }, { id: 'app', t: 'Приложение' }, { id: 'as', t: 'Сервер авторизации' }, { id: 'api', t: 'Resource API' }],
      msgs: [{ a: 'u', b: 'app', t: 'нажал «Войти»', k: 'sync' }, { a: 'app', b: 'as', t: 'redirect /authorize', k: 'sync' }, { a: 'u', b: 'as', t: 'логин и согласие', k: 'sync' }, { a: 'as', b: 'app', t: 'redirect + code', k: 'ret' },
        { a: 'app', b: 'as', t: 'POST /token (code)', k: 'sync' }, { a: 'as', b: 'app', t: 'access_token', k: 'ret' }, { a: 'app', b: 'api', t: 'GET /me, Bearer token', k: 'sync' }, { a: 'api', b: 'app', t: '200 данные', k: 'ret' }] }
  });
  A('seq-webhook', {
    title: 'Sequence: webhook с повтором', note: 'Провайдер сам вызывает наш URL и повторяет отправку, пока не получит 2xx.',
    spec: { type: 'seq', parts: [{ id: 'p', t: 'Платёжный провайдер' }, { id: 'h', t: 'Наш /webhook' }, { id: 's', t: 'Сервис заказов' }],
      msgs: [{ a: 'p', b: 'h', t: 'POST событие', k: 'sync' }, { a: 'h', b: 'p', t: '500', k: 'ret' }, { a: 'p', b: 'h', t: 'повтор POST', k: 'sync' }, { a: 'h', b: 's', t: 'обработать (идемпотентно)', k: 'async' }, { a: 'h', b: 'p', t: '200', k: 'ret' }],
      frames: [{ k: 'loop', t: 'до 2xx', from: 0, to: 4 }] }
  });
  A('state-order', {
    title: 'Диаграмма состояний заказа', note: 'Состояния — овалы, переходы подписаны событиями. Из «Доставлен» отмены нет.',
    spec: { type: 'state', cw: 190, nodes: [
      { id: 'st', k: 'start', x: 0, y: 1 }, { id: 'new', k: 'state', t: 'Новый', x: 1, y: 1 }, { id: 'paid', k: 'state', t: 'Оплачен', x: 2, y: 1 }, { id: 'pack', k: 'state', t: 'Собран', x: 3, y: 1 }, { id: 'del', k: 'state', t: 'Доставлен', x: 4, y: 1 },
      { id: 'cnl', k: 'state', t: 'Отменён', x: 1, y: 2 }, { id: 'fin', k: 'end', x: 5, y: 1 }],
      flows: [{ a: 'st', b: 'new' }, { a: 'new', b: 'paid', t: 'оплата' }, { a: 'paid', b: 'pack', t: 'сборка' }, { a: 'pack', b: 'del', t: 'вручение' }, { a: 'del', b: 'fin' }, { a: 'new', b: 'cnl', t: 'отмена' }, { a: 'paid', b: 'cnl', t: 'отмена' }] }
  });
  A('er-shop', {
    title: 'ER: интернет-магазин', note: 'Связь «клиент — заказ» один-ко-многим; «заказ — товар» разложена через позиции заказа.',
    spec: { type: 'er', ents: [
      { id: 'cl', t: 'clients', x: 0, y: 0, attrs: ['id PK', 'name', 'email'] }, { id: 'or', t: 'orders', x: 1, y: 0, attrs: ['id PK', 'client_id FK', 'status', 'created_at'] },
      { id: 'oi', t: 'order_items', x: 2, y: 0, attrs: ['id PK', 'order_id FK', 'product_id FK', 'quantity'] }, { id: 'pr', t: 'products', x: 2, y: 1, attrs: ['id PK', 'name', 'price'] }],
      rels: [{ a: 'cl', b: 'or', ka: '1', kb: '0..N'}, { a: 'or', b: 'oi', ka: '1', kb: '1..N'}, { a: 'pr', b: 'oi', ka: '1', kb: '0..N'}] }
  });
  A('er-m2n', {
    title: 'ER: связь многие-ко-многим', note: 'Сотрудники и проекты связаны через таблицу назначений: в ней два внешних ключа.',
    spec: { type: 'er', ents: [
      { id: 'em', t: 'employees', x: 0, y: 0, attrs: ['id PK', 'name', 'dept_id FK'] }, { id: 'as', t: 'assignments', x: 1, y: 0, attrs: ['employee_id FK', 'project_id FK', 'role'] }, { id: 'pj', t: 'projects', x: 2, y: 0, attrs: ['id PK', 'title', 'deadline'] }],
      rels: [{ a: 'em', b: 'as', ka: '1', kb: '0..N' }, { a: 'pj', b: 'as', ka: '1', kb: '0..N' }] }
  });
  A('arch-shop', {
    title: 'Архитектура: микросервисы магазина', note: 'Клиент ходит через шлюз; сервисы владеют своими БД, а события идут через брокер.',
    spec: { type: 'arch', cw: 190, nodes: [
      { id: 'web', k: 'box', t: 'Веб-клиент', x: 0, y: 1 }, { id: 'gw', k: 'box', t: 'API Gateway', x: 1, y: 1 }, { id: 'ord', k: 'box', t: 'Order Service', x: 2, y: 0 }, { id: 'pay', k: 'box', t: 'Payment Service', x: 2, y: 2 },
      { id: 'odb', k: 'db', t: 'orders DB', x: 3, y: 0 }, { id: 'mq', k: 'box', t: 'Kafka', x: 3, y: 1 }, { id: 'ntf', k: 'box', t: 'Notification Service', x: 4, y: 1 }],
      flows: [{ a: 'web', b: 'gw', t: 'HTTPS' }, { a: 'gw', b: 'ord', t: 'REST' }, { a: 'gw', b: 'pay', t: 'REST' }, { a: 'ord', b: 'odb' }, { a: 'ord', b: 'mq', t: 'событие' }, { a: 'mq', b: 'ntf', t: 'подписка' }] }
  });
  A('kafka-topology', {
    title: 'Kafka: топик и группа потребителей', note: 'Партиции топика читаются разными потребителями одной группы, порядок гарантирован только внутри партиции.',
    spec: { type: 'arch', cw: 190, nodes: [
      { id: 'prod', k: 'box', t: 'Producer', x: 0, y: 1 }, { id: 'p0', k: 'box', t: 'Партиция 0', x: 1, y: 0 }, { id: 'p1', k: 'box', t: 'Партиция 1', x: 1, y: 1 }, { id: 'p2', k: 'box', t: 'Партиция 2', x: 1, y: 2 },
      { id: 'c1', k: 'box', t: 'Consumer A', x: 2, y: 0.5 }, { id: 'c2', k: 'box', t: 'Consumer B', x: 2, y: 2 }],
      flows: [{ a: 'prod', b: 'p0', t: 'ключ' }, { a: 'prod', b: 'p1' }, { a: 'prod', b: 'p2' }, { a: 'p0', b: 'c1' }, { a: 'p1', b: 'c1'}, { a: 'p2', b: 'c2' }] }
  });
  A('activity-refund', {
    title: 'UML Activity: возврат товара', note: 'Диаграмма активностей: ветвление по решению и параллельное выполнение.',
    spec: { type: 'activity', nodes: [
      { id: 's', k: 'start', t: 'Заявка на возврат', x: 0, y: 1 }, { id: 'a1', k: 'task', t: 'Принять заявку', x: 1, y: 1 }, { id: 'g', k: 'gw', t: 'Товар в гарантии?', x: 2, y: 1 }, { id: 'a2', k: 'task', t: 'Отказать', x: 3, y: 0 }, { id: 'x', k: 'end', t: 'Заявка отклонена', x: 4, y: 0 },
      { id: 'f', k: 'and', x: 3, y: 2 }, { id: 'a3', k: 'task', t: 'Вернуть деньги', x: 4, y: 1 }, { id: 'a4', k: 'task', t: 'Принять товар на склад', x: 4, y: 3 }, { id: 'j', k: 'and', x: 5, y: 2 }, { id: 'e', k: 'end', t: 'Возврат оформлен', x: 6, y: 2 }],
      flows: [{ a: 'a2', b: 'x' }, { a: 's', b: 'a1' }, { a: 'a1', b: 'g' }, { a: 'g', b: 'a2', t: 'нет' }, { a: 'g', b: 'f', t: 'да' }, { a: 'f', b: 'a3' }, { a: 'f', b: 'a4' }, { a: 'a3', b: 'j' }, { a: 'a4', b: 'j' }, { a: 'j', b: 'e' }] }
  });
})();
