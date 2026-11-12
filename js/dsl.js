(function () {
  const Q = {};
  const DEF = {
    choice: ['Исключите варианты, которые прямо противоречат уроку.', 'Вспомните определение из соответствующего раздела урока.', 'Проверьте каждый вариант отдельно: всегда ли он верен?'],
    multi: ['Верных вариантов больше одного: оценивайте каждый отдельно.', 'Вспомните раздел урока и перечень из него.', 'Если сомневаетесь, спросите себя, подтвердил бы это практик.'],
    tf: ['Читайте каждое утверждение отдельно.', 'Слова «всегда», «никогда», «только» часто выдают неверное утверждение.', 'Сверьтесь с таблицей или примером из урока.'],
    classify: ['Сначала определите признак, по которому делятся группы.', 'Разберите самые очевидные элементы, остальные станут проще.', 'Вернитесь к таблице сравнения в уроке.'],
    order: ['Найдите первый и последний шаги: с них проще начать.', 'Спросите себя, что должно быть готово до каждого шага.', 'Вспомните порядок из урока.'],
    match: ['Начните с пар, в которых вы уверены.', 'Использованные ответы мысленно вычёркивайте.', 'Вспомните таблицу терминов из урока.'],
    cloze: ['Прочитайте предложение целиком и подумайте о смысле.', 'Исключите варианты, которые не подходят грамматически и по смыслу.', 'Найдите это определение в уроке.'],
    hunt: ['Ищите слова, которые нельзя проверить или которые противоречат уроку.', 'Отмечайте каждое слово ошибочной фразы, а не только одно.', 'Не отмечайте лишнего: лишние отметки считаются ошибкой.'],
    write: ['Составьте план ответа: 2–3 пункта.', 'Проверьте по списку критериев, которые покажет проверка: каждый должен быть закрыт.', 'Используйте термины из урока и конкретный пример.'],
    sql: ['Определите, какие таблицы нужны, и посмотрите схему над полем ввода.', 'Определите порядок: FROM, затем фильтры, затем группировка и сортировка.', 'Проверьте число столбцов и строк в результате: именно они сравниваются с эталоном.'],
    dgfind: ['Пройдите по диаграмме слева направо и проверьте каждый элемент.', 'Проверьте стрелки: направление, подписи, тип.', 'Сверьтесь с правилами нотации из урока: форма и тип элемента.'],
    dgfill: ['Начните с блоков, смысл которых понятен из соседних элементов.', 'Читайте диаграмму как историю: что происходит до и после пропуска.', 'Сверьтесь с таблицей нотации в уроке.'],
    codehunt: ['Читайте построчно и сверяйте с правилами формата.', 'Проверьте отступы, кавычки, обязательные поля и типы.', 'Ошибка может быть в смысле (неверный код ответа или метод), а не только в синтаксисе.'],
    api: ['Выпишите, какие запросы нужны по списку целей.', 'Не забудьте заголовок Authorization для защищённых методов.', 'Смотрите на код ответа в панели результата.']
  };
  const base = (type, q, ex, hints) => ({ type, q, explain: ex || '', hints: hints && hints.length ? hints : DEF[type] });
  Q.c = (q, options, answer, ex, hints) => Object.assign(base('choice', q, ex, hints), { options, answer });
  Q.m = (q, options, answer, ex, hints) => Object.assign(base('multi', q, ex, hints), { options, answer });
  Q.tf = (q, st, ex, hints) => Object.assign(base('tf', q, ex, hints), { statements: st.map(s => ({ t: s[0], v: s[1] })) });
  Q.cl = (q, buckets, items, ex, hints) => Object.assign(base('classify', q, ex, hints), { buckets, items: items.map(s => ({ t: s[0], b: s[1] })) });
  Q.o = (q, items, ex, hints) => Object.assign(base('order', q, ex, hints), { items });
  Q.mt = (q, pairs, ex, hints) => Object.assign(base('match', q, ex, hints), { pairs });
  Q.z = (q, text, blanks, ex, hints) => Object.assign(base('cloze', q, ex, hints), { text, blanks: blanks.map(b => { const k = b[0].indexOf(b[1]); if (k < 0) throw new Error('cloze answer not in options: ' + b[1]); return { options: b[0], answer: k }; }) });
  Q.hu = (q, tokens, bad, ex, hints) => Object.assign(base('hunt', q, ex, hints), { tokens, bad });
  Q.w = (q, rules, sample, ex, hints, minLen) => Object.assign(base('write', q, ex, hints), { rules: rules.map(r => ({ re: r[0], msg: r[1] })), sample, minLen: minLen || 0 });
  Q.sql = (q, expected, sample, ex, hints, ordered) => Object.assign(base('sql', q, ex, hints), { expected, sample: sample || expected, ordered: !!ordered });
  Q.api = (q, goals, sample, ex, hints) => Object.assign(base('api', q, ex, hints), { goals: goals.map(g => ({ m: g[0], p: g[1], s: g[2], t: g[3] })), sample });
  Q.dgf = (q, dg, bad, ex, hints) => Object.assign(base('dgfind', q, ex, hints), { dg, bad });
  Q.dgl = (q, dg, blanks, ex, hints) => Object.assign(base('dgfill', q, ex, hints), { dg, blanks: blanks.map(b => { const k = b[0].indexOf(b[1]); if (k < 0) throw new Error('dgfill answer not in options: ' + b[1]); return { options: b[0], answer: k, label: b[2] }; }) });
  Q.ch = (q, lines, bad, ex, hints) => Object.assign(base('codehunt', q, ex, hints), { lines, bad });
  Q.dg = (task, dg) => Object.assign(task, { dg });
  SAQ.Q = Q;
  SAQ.chapter = function (id, emoji, title, summary, goals, lesson, practice, test) {
    SAQ.register({ id, emoji, title, summary, goals, lesson, practice, test });
  };
})();
(function () {
  SAQ.extend = function (id, x) {
    const ch = SAQ.chapters.find(c => c.id === id);
    if (!ch) throw new Error('extend: no chapter ' + id);
    if (x.goals) ch.goals.push(...x.goals);
    if (x.lesson) {
      const groups = {};
      x.lesson.forEach(l => {
        const a = l.after == null ? ch.lesson.length - 1 : l.after;
        (groups[a] = groups[a] || []).push(l);
      });
      Object.keys(groups).map(Number).sort((a, b) => b - a).forEach(a => ch.lesson.splice(a + 1, 0, ...groups[a]));
    }
    if (x.practice) ch.practice.push(...x.practice);
    if (x.test) ch.test.push(...x.test);
  };
})();
