CALL _paths.bat
@echo on

if not exist "%DB_PATH%/RS_2" mkdir "%DB_PATH%/RS_2"
title rs-2
start "rs-2" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29002 --replSet rs --dbpath %DB_PATH%/RS_2
