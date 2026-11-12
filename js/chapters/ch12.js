(function () {
  const Q = SAQ.Q;
  SAQ.chapter(12, '🧮', 'SQL для аналитика',
    'SELECT, WHERE, JOIN, GROUP BY, HAVING, подзапросы, NULL, ORDER/LIMIT, оконные функции — с живой песочницей.',
    ['писать SELECT с фильтрами, сортировкой и агрегатами', 'соединять таблицы (INNER, LEFT) и понимать результат', 'работать с NULL и условиями HAVING', 'использовать подзапросы и базовые оконные функции'],
    [
      { h: 'SELECT, WHERE, ORDER BY, LIMIT', html: `
<pre><code>SELECT имена_столбцов
FROM таблица
WHERE условие
ORDER BY столбец [ASC|DESC]
LIMIT N;</code></pre>
<p>Порядок <b>выполнения</b> (логический): FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.</p>
<ul><li>Операторы: =, &lt;&gt;, &gt;, &lt;, BETWEEN, IN (…), LIKE 'А%', AND/OR/NOT.</li><li>DISTINCT убирает дубли.</li><li>Алиасы: <code>salary AS s</code>.</li></ul>
<div class="warn">NULL нельзя сравнивать через <code>=</code>: используйте <code>IS NULL</code> / <code>IS NOT NULL</code>.</div>
<div class="tip">В песочнице практики схема: employees, departments, clients, orders, order_items, products.</div>`,
        check: Q.c('Как найти сотрудников без отдела?', ['WHERE department_id IS NULL', 'WHERE department_id = NULL', 'WHERE department_id = 0', 'WHERE NOT department_id'], 0, '') },
      { h: 'Агрегаты, GROUP BY, HAVING', html: `
<p>Агрегатные функции: <code>COUNT, SUM, AVG, MIN, MAX</code>. COUNT(*) считает строки, COUNT(col) — непустые значения.</p>
<pre><code>SELECT status, COUNT(*) AS cnt, SUM(total) AS sum_total
FROM orders
GROUP BY status
HAVING COUNT(*) &gt; 1;</code></pre>
<ul><li>В SELECT можно только агрегаты и столбцы из GROUP BY.</li><li><b>WHERE</b> фильтрует строки до группировки, <b>HAVING</b> — группы после.</li></ul>`,
        check: Q.c('Фильтр по агрегату (COUNT(*) > 1) пишут в…', ['HAVING', 'WHERE', 'ORDER', 'FROM'], 0, '') },
      { h: 'JOIN', html: `
<table><tr><th>Тип</th><th>Результат</th></tr>
<tr><td>INNER JOIN</td><td>только совпавшие строки</td></tr><tr><td>LEFT JOIN</td><td>все из левой + совпавшие из правой (иначе NULL)</td></tr>
<tr><td>RIGHT JOIN</td><td>зеркально LEFT</td></tr><tr><td>FULL JOIN</td><td>все из обеих</td></tr><tr><td>CROSS JOIN</td><td>декартово произведение</td></tr></table>
<pre><code>SELECT c.name, o.total
FROM orders o
JOIN clients c ON c.id = o.client_id;</code></pre>
<div class="ex"><b>Клиенты без заказов:</b> <code>FROM clients c LEFT JOIN orders o ON o.client_id=c.id WHERE o.id IS NULL</code>.</div>
<div class="warn">Условие ON задаёт соответствие, WHERE фильтрует итог. Фильтр по правой таблице в WHERE «превращает» LEFT в INNER.</div>`,
        check: Q.c('Нужны все клиенты, даже без заказов:', ['LEFT JOIN', 'INNER JOIN', 'CROSS JOIN', 'UNION'], 0, '') },
      { h: 'Подзапросы, CASE, UNION', html: `
<ul><li><b>Подзапрос в WHERE:</b> <code>WHERE salary &gt; (SELECT AVG(salary) FROM employees)</code></li><li><b>IN / EXISTS:</b> <code>WHERE id IN (SELECT client_id FROM orders)</code></li><li><b>CASE:</b> <code>CASE WHEN total&gt;1000 THEN 'крупный' ELSE 'обычный' END</code></li><li><b>UNION</b> объединяет результаты (убирает дубли), <b>UNION ALL</b> — без удаления.</li><li><b>COALESCE(x, 0)</b> заменяет NULL.</li><li><b>CTE:</b> <code>WITH t AS (SELECT …) SELECT … FROM t</code></li></ul>`,
        check: Q.c('Что делает COALESCE(x, 0)?', ['Заменяет NULL на 0', 'Складывает', 'Удаляет', 'Сортирует'], 0, '') },
      { h: 'Оконные функции', html: `
<p>Считают значение «по окну» строк, но не схлопывают строки, в отличие от GROUP BY.</p>
<pre><code>SELECT name, department_id, salary,
  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk
FROM employees;</code></pre>
<ul><li>ROW_NUMBER(), RANK(), DENSE_RANK();</li><li>SUM() OVER (...) — накопительные суммы;</li><li>LAG()/LEAD() — предыдущее/следующее значение.</li></ul>
<div class="interview">Классика: «Найти вторую по величине зарплату» или «топ-N товаров в категории» — решается RANK/ROW_NUMBER.</div>`,
        check: Q.c('Отличие оконной функции от GROUP BY:', ['Строки не схлопываются', 'Она медленнее всегда', 'Работает только с числами', 'Нет отличий'], 0, '') }
    ],
    [
      Q.sql('Выведите имена и зарплаты сотрудников с зарплатой больше 100000.', 'SELECT name, salary FROM employees WHERE salary > 100000', null, 'WHERE фильтрует строки.', ['Таблица employees.', 'Условие salary > 100000.', 'SELECT name, salary FROM employees WHERE …']),
      Q.sql('Сколько заказов имеют статус «оплачен»? Выведите одно число.', "SELECT COUNT(*) FROM orders WHERE status='оплачен'", null, 'COUNT(*) + WHERE.', ['Агрегат COUNT.', "Условие status = 'оплачен'."]),
      Q.sql('Выведите имя клиента и сумму каждого его заказа (INNER JOIN).', 'SELECT c.name, o.total FROM orders o JOIN clients c ON c.id=o.client_id', null, 'Связь orders.client_id → clients.id.', ['JOIN ... ON c.id = o.client_id.']),
      Q.sql('Для каждого client_id выведите суммарную сумму заказов.', 'SELECT client_id, SUM(total) FROM orders GROUP BY client_id', null, 'Группировка + SUM.', ['GROUP BY client_id.']),
      Q.sql('Выведите клиентов (id), у которых больше 2 заказов.', 'SELECT client_id FROM orders GROUP BY client_id HAVING COUNT(*) > 2', null, 'HAVING фильтрует группы.', ['GROUP BY client_id.', 'HAVING COUNT(*) > 2.']),
      Q.sql('Выведите имена клиентов, у которых нет ни одного заказа.', 'SELECT c.name FROM clients c LEFT JOIN orders o ON o.client_id=c.id WHERE o.id IS NULL', null, 'LEFT JOIN + IS NULL — классика «антиджойна».', ['LEFT JOIN orders.', 'Фильтр WHERE o.id IS NULL.']),
      Q.sql('Выведите имена сотрудников, у которых не указан отдел.', 'SELECT name FROM employees WHERE department_id IS NULL', null, 'IS NULL.', ['Нельзя использовать = NULL.']),
      Q.sql('Выведите названия отделов и среднюю зарплату в них (только отделы, где работают сотрудники).', 'SELECT d.title, AVG(e.salary) FROM employees e JOIN departments d ON d.id=e.department_id GROUP BY d.title', null, 'JOIN + AVG + GROUP BY.', ['JOIN employees и departments.', 'GROUP BY d.title.']),
      Q.sql('Выведите 3 самых дорогих заказа: id и total, от большего к меньшему.', 'SELECT id, total FROM orders ORDER BY total DESC LIMIT 3', null, 'ORDER BY DESC + LIMIT.', ['ORDER BY total DESC.', 'LIMIT 3.'], true),
      Q.sql('Выведите сотрудников, получающих больше средней зарплаты по компании (имя, зарплата).', 'SELECT name, salary FROM employees WHERE salary > (SELECT AVG(salary) FROM employees)', null, 'Подзапрос возвращает одно число.', ['Подзапрос (SELECT AVG(salary) FROM employees).']),
      Q.sql('Для каждого сотрудника выведите имя, отдел (department_id) и ранг зарплаты внутри отдела (RANK, по убыванию).', 'SELECT name, department_id, RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) FROM employees', null, 'Окно PARTITION BY отдела.', ['RANK() OVER (...)', 'PARTITION BY department_id ORDER BY salary DESC.'])
    ],
    [
      Q.c('Порядок логического выполнения:', ['FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY', 'SELECT → FROM → WHERE', 'WHERE → FROM', 'ORDER → FROM'], 0, ''),
      Q.c('Как проверить на NULL?', ['IS NULL', '= NULL', '== NULL', 'EQUALS NULL'], 0, ''),
      Q.c('LEFT JOIN возвращает…', ['Все строки из левой таблицы', 'Только совпавшие', 'Только из правой', 'Ничего'], 0, ''),
      Q.tf('Верно?', [['WHERE выполняется до GROUP BY', true], ['HAVING можно использовать без агрегатов всегда', false]], ''),
      Q.m('Агрегатные функции:', ['COUNT', 'SUM', 'AVG', 'JOIN'], [0, 1, 2], ''),
      Q.c('UNION ALL отличается от UNION…', ['Не удаляет дубли', 'Удаляет дубли', 'Сортирует', 'Только для чисел'], 0, ''),
      Q.c('Для «топ-N в группе» удобно использовать…', ['Оконные функции', 'DISTINCT', 'UNION', 'LIKE'], 0, ''),
      Q.c('COUNT(col) считает…', ['Непустые значения', 'Все строки', 'Дубликаты', 'Таблицы'], 0, '')
    ]
  );
})();
