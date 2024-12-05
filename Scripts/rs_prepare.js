/**********************************************
 * 
 * Подготовка данных
 *  
 **********************************************/ 
var d1 = {
    "cr": new Date().getTime(),
    "n": 1,
    "v": 100,
    "trs": [
        {"ac": 1, "am": 1000},
        {"ac": 2, "am": -1000},
    ]
};
var d2 = {
    "cr": new Date().getTime(),
    "n": 2,
    "v": 200,
    "trs": [
        {"ac": 1, "am": 2000},
        {"ac": 2, "am": -2000},
    ]
};
var d3 = {
    "cr": new Date().getTime(),
    "n": 3,
    "v": 300,
    "trs": [
        {"ac": 1, "am": 3000},
        {"ac": 2, "am": -3000},
    ]
};

//
function createCollection(){
    print("createIndex for <operation>");
    db.operation.createIndex({"n": 1}, {unique: true});
    db.operation.createIndex({"trs.ac": 1, "cr": 1});
}

/**********************************************
 * 
 * Генератор данных
 *  
 **********************************************/ 
function generateOperation( count ){
    print("Generate " + count + " documents:");
    for (var i=1; i <= count; i++) {
        var amount = Math.floor(Math.random() * 1000)+1;
        var account1 = Math.floor(Math.random() * count / 10)+1;
        var account2 = Math.floor(Math.random() * count / 10)+1;
        var doc = {
            "cr": new Date(),
            "n": i,
            "v": 1,
            "trs": [
                {"ac": account1, "am": amount},
                {"ac": account2, "am": -amount},
            ]
        };
        db.operation.updateOne(
            {"n": i},
            {"$set": doc}, 
            {upsert: true}
        );
        if (!(i % 10)){
            print(""+i);
        }
    };
    print("Success");
};

/**********************************************
 * 
 * Проверка скорости записи для разных условий
 *  
 **********************************************/ 
function WriteSpeedTestSuit( blockSize, count ){
    var testCount = (count ? count : 100);
    var testBlockSize = (blockSize ? blockSize : 1024);
    print(`recordSize = ${testBlockSize}, count = ${testCount}`);
    print("");
    print(`${"writeConcern".padEnd(30," ")}     ${"insert".padStart(8," ")}      ${"update".padStart(8," ")}`);
    WriteSpeedTest({ w: 0, j: false}, testBlockSize, testCount);
    WriteSpeedTest({ w: 0, j: true}, testBlockSize, testCount);
    WriteSpeedTest({ w: 1, j: false}, testBlockSize, testCount);
    WriteSpeedTest({ w: 1, j: true}, testBlockSize, testCount);
    WriteSpeedTest({ w: 2, j: false}, testBlockSize, testCount);
    WriteSpeedTest({ w: 2, j: true}, testBlockSize, testCount);
    WriteSpeedTest({ w: 3, j: false}, testBlockSize, testCount);
    WriteSpeedTest({ w: 3, j: true}, testBlockSize, testCount);
    WriteSpeedTest({ w: "majority", j: false}, testBlockSize, testCount);
    WriteSpeedTest({ w: "majority", j: true}, testBlockSize, testCount);
}
function WriteSpeedTest(writeConcern, blockSize, count){
    // Подготовка теста
    db.speed_test.drop();
    db.speed_test.createIndex({"n": 1}, {"unique": 1});
    var longString1 = "".padEnd(blockSize, "*");
    var longString2 = "".padEnd(blockSize, "-");
    var waitInterval = new Date().getTime() + 1000;
    while (waitInterval > new Date().getTime()){};

    // Выполнение теста на добавление данных
    var startTime = new Date().getTime();
    for (var i=0; i < count; i++){
        db.speed_test.insertOne( {"n": i, "v": 1, "s": longString1}, {writeConcern: writeConcern});
    }
    var insertDuration = new Date().getTime() - startTime;

    // Выполнение теста на обновление
    startTime = new Date().getTime();
    for (var i=0; i < count; i++){
        db.speed_test.updateOne( {"n": i}, {"$inc": {"v": 1}, "$set": {s: longString2}}, {writeConcern: writeConcern});
    }
    var updateDuration = new Date().getTime() - startTime;

    // Вывод результатов
    print(`${JSON.stringify(writeConcern).padEnd(30," ")} ${insertDuration.toString().padStart(8," ")} мсек ${updateDuration.toString().padStart(8," ")} мсек`);
    return {... writeConcern, insertDuration, updateDuration};
};

/**********************************************
 * 
 * Тест на согласованность данных
 * ConsistencyTestGenerator({ w: 1, j: false}, 1024*1024*1, 10)
 * Зависит от writeConcern, длительность синхронизации зависит от blockSize
 *  
 **********************************************/ 
function ConsistencyTestGenerator(writeConcern, readConcern, blockSize, count){
    // Подготовка теста
    var longString1 = "".padEnd(blockSize, "*");
    var longString2 = "".padEnd(blockSize, "-");
    db.consistency_test.drop();
    db.consistency_test.updateOne({"n": 1}, {"$set": {"v": 0, "s": longString1}}, {"upsert": true});
    var primaryMongo = new Mongo("mongodb://localhost:29001/?directConnection=true");
    var primarySession = primaryMongo.startSession( { readPreference: { mode: "primary" } } );
    var primaryDb = primarySession.getDatabase("test");
    var secondaryMongo1 = new Mongo("mongodb://localhost:29002/?directConnection=true");
    var secondaryDb1 = secondaryMongo1.getDB("test");
    var secondaryMongo2 = new Mongo("mongodb://localhost:29003/?directConnection=true");
    var secondaryDb2 = secondaryMongo2.getDB("test");

    // Выполнение теста
    print(` ${"start tr  -  end tran =  duration".padEnd(33," ")} ? ${"primary".padStart(7," ")} ${"second1".padStart(7," ")} ${"second2".padStart(7," ")} ${"replset".padStart(7," ")} get_time`);
    for (var i=1; i < 10; i++){
        var waitInterval = new Date().getTime() + 1000;
        while (waitInterval > new Date().getTime()){};
            // Обновление документа в транзакции 10 раз 
        primarySession.startTransaction( { readConcern: { level: "local" }, writeConcern: writeConcern } );
        for (var j=0; j < count; j++){
            primaryDb.consistency_test.updateOne( {"n": 1}, {"$inc": {"v": 1}, "$set": {"s": (j % 2 ? longString1 : longString2)}}, {writeConcern: writeConcern});
        }
        var startTime = new Date();
        primarySession.commitTransaction();
        var commitTime = new Date();

        // Чтение с разных узлов реплики
        var secondaryData1 = secondaryDb1.consistency_test.findOne({"n": 1}, {"_id": 0, "v": 1}, {readConcern: "local", readPreference: "secondary"});
        var secondaryData2 = secondaryDb2.consistency_test.findOne({"n": 1}, {"_id": 0, "v": 1}, {readConcern: "local", readPreference: "secondary"});
        var rsStartTime = new Date();
        var replicaSetData = db.consistency_test.findOne({"n": 1}, {"_id": 0, "v": 1}, {readConcern: readConcern, readPreference: "primary"});
        var rsGetDuration = new Date().getTime() - rsStartTime.getTime();

        // Вывод результатов измерения
        var isOk = ((i*10) == replicaSetData.v) && (replicaSetData.v == secondaryData1.v) && (secondaryData1.v == secondaryData2.v);
        replicaSetData.v = ((i*10) == replicaSetData.v ? replicaSetData.v : -replicaSetData.v);
        secondaryData1.v = ((i*10) == secondaryData1.v ? secondaryData1.v : -secondaryData1.v);
        secondaryData2.v = ((i*10) == secondaryData2.v ? secondaryData2.v : -secondaryData2.v);
        print(` ${startTime.toLocaleTimeString([], {minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3})} - ${commitTime.toLocaleTimeString([], {minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3})} = ${(commitTime.getTime()-startTime.getTime()).toString().padStart(4)} мсек ${(isOk ? "+" : "!")} ${(i*10).toString().padStart(7)} ${secondaryData1.v.toString().padStart(7)} ${secondaryData2.v.toString().padStart(7)} ${replicaSetData.v.toString().padStart(7)} ${rsGetDuration.toString().padStart(5)} ms`);
    }
}

// Наблюдение за согласованностью данных
// ConsistencyTestObserver("local")
// ConsistencyTestObserver("majority")
// ConsistencyTestObserver("linearizable")
function ConsistencyTestObserver(readConcern){
    function ConnectToDatabase( node ){
        if (node.db){
            return node.db;
        }
        node.connectionStrings.some(connectionString => {
            try {
                node.mongo = new Mongo(connectionString);
                node.db = node.mongo.getDB("test");
            } catch(error){
                node.value = null;
                node.rsName = null;
                return false;
            }
            return true;
        });
        return node.db;
    }
    function GetNodeData( node ){
        if (!node.db){
            return null;
        }
        node.value = null;
        node.rsName = null;
        try {
            node.data = node.db.consistency_test.findOne({"n": 1}, {"_id": 0, "v": 1}, {readConcern: node.readConcern, readPreference: node.readPreference, wtimeout: node.wtimeout});
            if (node.data){
                node.value = node.data.v;
            }
            if (node.isReplicaset){
                var isMaster = node.db.runCommand({hello: 1});
                if (isMaster){
                    node.rsName = isMaster.me;
                }
            }
        } catch(error){
            node.data = null;
            node.db = null;
        }
        return node.data;
    }
    function GetDataForNodes(nodes){
        // Сначала переподключаемся ко всем узлам
        nodes.forEach(node => {
            ConnectToDatabase(node);
        });
        // только потом вычитываем данные
        nodes.filter(n => n.isReplicaset).forEach(node => {
            GetNodeData(node);
        });
        nodes.filter(n => !n.isReplicaset).forEach(node => {
            GetNodeData(node);
        });
        return nodes;
    }
    function GetPrintHeader(nodes){
        return `  # ${"  time  ".padEnd(9," ")} ${"duration"}  ? ${nodes.map(n => n.name.padStart(7," ")).join(" ")} ${"Primary".padEnd(15)}`;
    }
    function GetPrintValues(nodes, step, nowTime, getDuration, isOk){
        var rsNode = nodes.find(n => n.isReplicaset);
        var etalonValue = (rsNode ? rsNode.value : null);
        return ` ${("0"+step).slice(-2)} ${nowTime.toLocaleTimeString([], {minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3})} ${getDuration.toString().padStart(5)} ms  ${(isOk ? "+" : "!")} ${nodes.map(n => (!n.value ? "-" : (n.value == etalonValue ? n.value : -n.value).toString()).padStart(7)).join(" ")} ${(rsNode && rsNode.rsName ? rsNode.rsName : "   -").padEnd(15)}`;
    }
    // Подготовка теста
    var NODES = [
        {
            name: "replset",
            isReplicaset: true,
            mongo: null,
            db: null,
            data: null,
            value: null,
            connectionStrings: [
                "mongodb://localhost:29001/?replicaSet=rs&readPreference=primaryPreferred",
                "mongodb://localhost:29002/?replicaSet=rs&readPreference=primaryPreferred",
                "mongodb://localhost:29003/?replicaSet=rs&readPreference=primaryPreferred"
            ],
            readConcern: readConcern,
            readPreference: "primaryPreferred",
            wtimeout: 600
        },
        {
            name: "29001",
            isReplicaset: false,
            mongo: null,
            db: null,
            data: null,
            value: null,
            connectionStrings: ["mongodb://localhost:29001/?directConnection=true"],
            readConcern: "local",
            readPreference: "primary",
            wtimeout: 100
        },
        {
            name: "29002",
            isReplicaset: false,
            mongo: null,
            db: null,
            data: null,
            value: null,
            connectionStrings: ["mongodb://localhost:29002/?directConnection=true"],
            readConcern: "local",
            readPreference: "secondary",
            wtimeout: 100
        },
        {
            name: "29003",
            isReplicaset: false,
            mongo: null,
            db: null,
            data: null,
            value: null,
            connectionStrings: ["mongodb://localhost:29003/?directConnection=true"],
            readConcern: "local",
            readPreference: "secondary",
            wtimeout: 100
        },
    ];
    const rsNODE = NODES.find(n => n.isReplicaset);
    var counter = 0;
    // Окно несогласованности (inconsistency window)
    // Получение данных
    var previousIsOk = true;
    var previousStamp = "";
    var totalInconsistencyWindow = 0;
    var totalMeasurements = 0;
    var startInconsistencyTime = new Date();
    var endInconsistencyTime = new Date();
    var lastPrint = new Date();
    print( GetPrintHeader(NODES) );
    var step = 0;
    while ( true ){
        var nowTime = new Date();
        GetDataForNodes(NODES);
        var getDuration = new Date().getTime() - nowTime.getTime();
        var isOk = rsNODE.data && !NODES.some(n => !n.data || n.value != rsNODE.value );
        var stamp = NODES.map(n => (n.value ? n.value : "0")).join("-");
        if (previousStamp != stamp || (lastPrint.getTime() < nowTime.getTime() - 5 * 1000)) {
            step++;
            print( GetPrintValues(NODES, step, nowTime, getDuration, isOk) );
            lastPrint = nowTime;
        }
        if (!previousIsOk && isOk){
            endInconsistencyTime = nowTime;
            var inconsistencyWindow = endInconsistencyTime.getTime()-startInconsistencyTime.getTime();
            print(`Окно несогласованности (inconsistency window): ${inconsistencyWindow} мсек`);
            var hasData = NODES.every(n => n.value > 0);
            if (hasData) {
                totalMeasurements++;
                totalInconsistencyWindow += inconsistencyWindow;
                print(`Окно несогласованности в среднем: ${(totalMeasurements ? (totalInconsistencyWindow / totalMeasurements).toFixed() : 0)} мсек`);
            } else {
                totalMeasurements = 0;
                totalInconsistencyWindow = 0;
            }
            print("");
            print(`readConcern: ${readConcern} `);
            print( GetPrintHeader(NODES) );
        }
        if (previousIsOk && !isOk){
            startInconsistencyTime = nowTime;
        }
        counter++;
        previousIsOk = isOk;
        previousStamp = stamp;
    }
}

(function(){
	
})()