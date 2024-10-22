/*****************************************************
 * 
 * Тест 1
 * CRUD операции
 * 
 *****************************************************/
db.operation.drop();

// Документ операции
var doc1 = {
    "n": 1,
    "cr": new Date(),
    "v": 1,
    "trs": [
        {"ac": 1, "am": -1000},
        {"ac": 2, "am": 1000},
    ]
};

// CRUD
db.operation.insertOne(doc1);

db.operation.find();
db.operation.findOne({n: 1});

db.operation.updateOne({n: 1}, {$inc: {v: 1}});
db.operation.findOne({n: 1});

db.operation.deleteOne({n: 1});
db.operation.findOne({n: 1});

// Индексы
db.operation.createIndex({"n": 1}, {unique: true});
db.operation.createIndex({"trs.ac": 1, "cr": 1});

// Генератор тестовых данных
generateOperation(100);
db.operation.find().count();

// Выборка по счету 1
db.operation.find({"trs.ac": 1});
db.operation.find({"trs.ac": 1}).count();

// Балансы в разрезе счетов
db.operation.aggregate(
    [
        {$unwind: "$trs"},
        {$group: {_id: "$trs.ac", balance: {$sum: "$trs.am"}}},
        {$sort: {_id: 1}}
    ]
);

// Суммарный баланс по всем счетам = 0
db.operation.aggregate(
    [
        {$unwind: "$trs"},
        {$group: {_id: 0, balance: {$sum: "$trs.am"}}}
    ]
);

// Баланс по счету 1
db.operation.aggregate(
    [
        {$match: {"trs.ac": 1}},
        {$unwind: "$trs"},
        {$match: {"trs.ac": 1}},
        {$group: {_id: 1, balance: {$sum: "$trs.am"}}}
    ]
);


/******************************************
 * 
 * Тест 2
 * Уровень изоляции snapshot
 * 
 ******************************************/

// db.operation.insertOne(doc1);
db.operation.findOne({n: 1});

db.operation.updateOne({n: 1}, {$inc: {v: 1111}});
db.operation.findOne({n: 1});

// Пример snapshot - данные на 2 минуты назад
// minSnapshotHistoryWindowInSeconds = по умолчанию 300 секунд
// snapshot проверяется только в runCommand, где учитывается atClusterTime.
// Сериализуемая транзакция
db.runCommand( {
    find: "operation",
    projection: {},
    filter: { "n": 1 },
    readConcern: {
        level: "snapshot",
        atClusterTime: Timestamp(Math.round(new Date().getTime()/1000 - 2*60), 1)
    },
} ).cursor.firstBatch[0]

db.runCommand( {
    find: "operation",
    projection: {},
    filter: { "n": 1 },
    readConcern: {
        level: "snapshot",
        atClusterTime: Timestamp(Math.round(new Date().getTime()/1000 - 10), 1)
    },
} ).cursor.firstBatch[0]


/******************************************
 * 
 * Тест 3
 * Скорость сохранения данных в зависимости от размера и writeConcern
 * WriteSpeedTestSuit( blockSize, count )
 * Выполняет insert и update строки размером blockSize count раз с разными writeConcern параметрами.
 * 
 * - {w: 0, j: false} - клиент не ожидает ответа от сервера
 * - {w: 1, j: false} - клиент ожидает ответа от сервера, но без ожидания записи в журнал
 * - {w: 0, j: true}, {w: 1, j: true} - ожидает ответ от сервера после записи в журнал
 * - {j: true} медленнее, чем {j: false}, потому что ожидание записи в журнал
 * - {w: 3} медленнее, чем {w: 2}, потому что запущено нескольких инстансов на одной машине
 * 
 * insert и update примерно одинаковые по времени
 * c ростом w растет время записи
 * с ростом размера документа растет время
 * {"w":"majority","j":false}  самая долгая опция!
 * {"w":"majority","j":true} быстрее, чем {"w":2,"j":true}
 * 
 ******************************************/
// 1 Кбайт
WriteSpeedTestSuit( 1024, 10 );
// 1 Мбайт
WriteSpeedTestSuit( 1024*1024, 10 );

// 15 Мбайт
//WriteSpeedTestSuit( 1024*1024*15, 10 );

// 16 Мбайт - ошибка, объект должен быть не более 16 Мбайт,
// причем {w: 0, j: false} не выдает ошибку, так как данные отправляются без подтверждения
WriteSpeedTestSuit( 1024*1024*16, 10 );


/******************************************
 * 
 * Тест 4
 * Тесты на согласованность данных
 * ConsistencyTestGenerator(writeConcern, readConcern, blockSize, count)
 * ConsistencyTestObserver(readConcern, timeMin)
 * В рамках транзакции обновляются данные документа count раз с увеличением номера версии.
 * Читаются локальные данные с каждого узла и данные из replica set с параметром readConcern.
 * 
 ******************************************/
// Ошибки согласованности данных при чтении с реплик базы данных
// по мере роста W и использования {j: true} растет длительность записи данных (duration), 
// но и уменьшается число не обновленных узлов
ConsistencyTestGenerator({ w: 1, j: false}, "majority", 1024*1024*1, 10)
ConsistencyTestGenerator({ w: 1, j: true}, "majority", 1024*1024*1, 10)
ConsistencyTestGenerator({ w: 2, j: false}, "majority", 1024*1024*1, 10)
ConsistencyTestGenerator({ w: 2, j: true}, "majority", 1024*1024*1, 10)

// Иногда можно получить несогласованность данных даже при таких параметрах (даже replset вернет старые данные!!!):
ConsistencyTestGenerator({ w: "majority", j: false}, "majority", 1024*1024*1, 10)
ConsistencyTestGenerator({ w: 3, j: false}, "majority", 1024*1024*1, 10)

// Полная согласованность данных на всех узлах без ошибок
ConsistencyTestGenerator({ w: 3, j: true}, "majority", 1024*1024*1, 10)

// "linearizable" - чтение ожидает завершения репликации на majority число узлов, растет длительность чтения данных
ConsistencyTestGenerator({ w: 1, j: false}, "majority", 1024*1024*1, 10); // для сравнения, читаем старые данные
// читаем новые данные get_time большое, duration небольшое
ConsistencyTestGenerator({ w: 1, j: false}, "linearizable", 1024*1024*1, 10); 
// читаем новые данные get_time не большое, а duration большое
ConsistencyTestGenerator({ w: 3, j: true}, "linearizable", 1024*1024*1, 10); 

// Размер транзакции не более 16 Мбайт
ConsistencyTestGenerator({ w: 1, j: false}, "majority", 1024*1024*2, 10)


// Другой клиент наблюдает несогласованность данных на разных узлах, которая не зависит от readConcern
// Окно несогласованности (inconsistency window) зависит от размера изменяемых данных.

// Отсутствует согласованность, данные можем потерять 
// Окно не согласованности 319 мс, время чтения 22 мс
ConsistencyTestObserver("local");
ConsistencyTestGenerator({ w: 1, j: false}, "majority", 1024*1024*1, 10)

// Слабая согласованность (Weak consistency) - "согласованность в конечном счете" "eventually consistent", может выдавать не новые данные, которые распространяются в системе
// Окно не согласованности 282 мс, время чтения 22 мс
ConsistencyTestObserver("majority");
ConsistencyTestGenerator({ w: 1, j: false}, "majority", 1024*1024*1, 10)

// Сильная согласованность (Strong consistency) - система выдает новые данные, которые ожидает распространения на majority узлы
// Окно не согласованности 318 мс, время чтения 290 мс
ConsistencyTestObserver("linearizable");
ConsistencyTestGenerator({ w: 1, j: false}, "majority", 1024*1024*1, 10)


/*****************************************************
 * 
 * Тест 5
 * Наблюдение за replica set
 * 
 *****************************************************/

// Шаг 1. На клиенте 1 подготовить параметры тестирования 
db.consistency_test.drop()
db.consistency_test.updateOne( {"n": 1}, {"$set": {"n": 1, "v": 1}}, {upsert: true});

// Шаг 2. На клиенте 2 запустить наблюдение
ConsistencyTestObserver("majority");

// Шаг 3. Все узлы работают и данные обновляются при любом writeConcern без ошибок
// - на клиенте 1 проверяем обновление данных
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: 1, j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: "majority", j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: 3, j: true, wtimeout: 3000}});


/**************************************************
 * 
 * Тест 6
 * Выход узлов из строя и восстановление работы
 * 
 **************************************************/
// Шаг 1. Потушить узел 2 (Secondary)
// - Данные обновляются
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: "majority", j: true, wtimeout: 3000}});
// - Ошибка обновления, но данные сохранятся в системе:
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: 3, j: true, wtimeout: 3000}});

// Нет ошибок чтения, так как доступно majority число реплик данных (даже для linearizable):
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "local", readPreference: "primaryPreferred", maxTimeMS: 3000});
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "majority", readPreference: "primaryPreferred", maxTimeMS: 3000});
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "linearizable", readPreference: "primary", maxTimeMS: 3000});

// Шаг 2. Запустить узел 2 
// - данные с узла 1 реплицируются на 2 и значение одинаковое


// Шаг 3. Потушить узел 1 (Primary)
// - Данные обновятся после выбора нового Primary в течении 10 секунд, это будет узел 2 с весом 5
// serverSelectionTimeoutMS=20000 для ожидания выбора primary узла, если он исчез
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "majority", readPreference: "primaryPreferred", maxTimeMS: 3000});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: 1, j: true, wtimeout: 20000}});
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "majority", readPreference: "primaryPreferred", maxTimeMS: 3000});

// Шаг 4. Запустить узел 1
// - данные с узла 2 реплицируются на 1
// - через некоторое время узел 1 станет primary, так как его вес 10


// Шаг 5. Потушить узел 2 и 3
// - Данные обновляются на узле 1 и без ошибок только при writeConcern = 1 в течении короткого промежутка времени, 
// пока система не поняла потерю узлов и не исчез primary
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: 1, j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: "majority", j: true, wtimeout: 3000}});

// Шаг 6. Запустить узлы 2 и 3
// - данные с узла 1 реплицируются на 2 и 3 и значение одинаковое


// Шаг 7. Потушить узел 2 и 3
// - Обновить данные и быстро прочитать
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: 1, j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: { w: 1, j: true, wtimeout: 3000}});

// Ошибка чтения для linearizable, так как недоступно majority число реплик данных:
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "local", readPreference: "primaryPreferred", maxTimeMS: 3000});
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "majority", readPreference: "primaryPreferred", maxTimeMS: 3000});
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "linearizable", readPreference: "primary", maxTimeMS: 3000});

// Шаг 8. Запустить узел 2
// - данные с узла 1 реплицируются на 2, становится majority и можно чисать
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "linearizable", readPreference: "primary", maxTimeMS: 3000});


/**************************************************
 * 
 * Тест 7
 * Выход узлов из строя и потеря данных
 * 
 **************************************************/
// Шаг 1. Потушить узел 2 и 3 
// - обновить данные на узле 1 на +5
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 5}}, {writeConcern: {w: 1, j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 5}}, {writeConcern: {w: "majority", j: true, wtimeout: 3000}});

// Шаг 2. Потушить узел 1 и потом запустить 2 и 3
// - обновить данные на узлах 2 и 3
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: 1, j: true, wtimeout: 3000}});

// Шаг 3. Запустить узел 1
// - данные на узле 1 заменятся данными с узлов 2 и 3


/***************************************************
 * 
 * Тест 8
 * Защита от потери данных
 * Без наблюдения
 * 
 ***************************************************/
// Шаг 1. Все узлы работают и данные обновляются при любом writeConcern
// - на клиенте 1 проверяем обновление данных
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: 1, j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: "majority", j: true, wtimeout: 3000}});
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: 3, j: true, wtimeout: 3000}});
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "local", readPreference: "primaryPreferred", maxTimeMS: 3000});

// Шаг 2. Потушить узел 2 и 3 
// - на клиенте 1 обновить данные с "majority" - произойдет ошибка подтверждения, 
// в итоге мы можем узнать, что система перешла в неопределенное состояние
db.consistency_test.updateOne( {"n": 1}, {$inc: {"v": 1}}, {writeConcern: {w: "majority", j: true, wtimeout: 3000}});

// Шаг 3. Проверить чтение при потушенных узлах 2 и 3
// - На другом клиенте 2 получить данные
// - Выдаются новые данные, которые выдаются с локального узла
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "local", readPreference: "primaryPreferred", maxTimeMS: 3000});
// - Выдаются старые данные, которые еще не реплицировались, слабая согласованность
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "majority", readPreference: "primaryPreferred", maxTimeMS: 3000});
// - Запрос зависает, так как не может выдать гарантированно новые данные, строгая согласованность
db.consistency_test.findOne({"n": 1}, {_id: 0, "n": 1, "v": 1}, {readConcern: "linearizable", readPreference: "primary", maxTimeMS: 3000});
