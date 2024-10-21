CALL _paths.bat

SET DBNAME=test
SET MONGOS=127.0.0.1
SET PORT1=29001
SET PORT2=29002
SET PORT3=29003
 
cd %SCRIPTS_PATH%

rem https://mongodb.github.io/mongo-java-driver/4.1/apidocs/mongodb-driver-core/com/mongodb/ConnectionString.html
title "client-rs"
rem "%MONGO_PATH_SHELL%\mongosh.exe" "mongodb://%MONGOS%:%PORT1%,%MONGOS%:%PORT2%,%MONGOS%:%PORT3%/?replicaSet=rs&serverSelectionTimeoutMS=200&localThresholdMS=500&heartbeatFrequencyMS=100"
"%MONGO_PATH_SHELL%\mongosh.exe" "mongodb://%MONGOS%:%PORT1%,%MONGOS%:%PORT2%,%MONGOS%:%PORT3%/?replicaSet=rs&readPreference=primaryPreferred&serverSelectionTimeoutMS=20000&maxStalenessSeconds=120" --shell --eval "snippet load-all" --eval "cls" rs_prepare.js
rem mongo %MONGOS%:%PORT%/%DBNAME% generateTestData.js -u root -p 12345 --authenticationDatabase "admin"  --shell
pause
