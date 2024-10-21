CALL _paths.bat

SET DBNAME=test
SET MONGOS=127.0.0.1
SET PORT=29001
 
cd %SCRIPTS_PATH%
 
"%MONGO_PATH_SHELL%\mongosh.exe" %MONGOS%:%PORT%/%DBNAME% %RUN_PATH%/rs_build.js --shell
rem mongo %MONGOS%:%PORT%/%DBNAME% generateTestData.js -u root -p 12345 --authenticationDatabase "admin"  --shell
rem db.runCommand( { dropDatabase: 1 } )

pause
