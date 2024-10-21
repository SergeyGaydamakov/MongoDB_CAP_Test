CALL _paths.bat
@echo on

if not exist "%DB_PATH%/RS_3" mkdir "%DB_PATH%/RS_3"
title rs-3
start "rs-3" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29003 --replSet rs --dbpath %DB_PATH%/RS_3

rem taskkill.exe /F /FI "WINDOWTITLE eq rs-3"