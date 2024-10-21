CALL _paths.bat

SET DBNAME=test
SET MONGOS=127.0.0.1
SET PORT1=29001
SET PORT2=29002
SET PORT3=29003
 
cd %SCRIPTS_PATH%

title "client-%PORT3%" 
"%MONGO_PATH_SHELL%\mongosh.exe" "mongodb://%MONGOS%:%PORT3%/%DBNAME%?directConnection=true" --shell --eval "snippet load-all" --eval "cls" rs_prepare.js
rem mongo %MONGOS%:%PORT%/%DBNAME% generateTestData.js -u root -p 12345 --authenticationDatabase "admin"  --shell
