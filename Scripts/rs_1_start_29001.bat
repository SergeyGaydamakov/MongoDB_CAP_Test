CALL _paths.bat
@echo on

if not exist "%DB_PATH%/RS_1" mkdir "%DB_PATH%/RS_1"
title rs-1
start "rs-1" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29001 --replSet rs --dbpath %DB_PATH%/RS_1

rem "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29001 --replSet rs --dbpath %DB_PATH%/RS_1
rem pause