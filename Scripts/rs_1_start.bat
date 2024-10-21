CALL _paths.bat
@echo on

if not exist "%DB_PATH%/RS_1" mkdir "%DB_PATH%/RS_1"
start "rs-1" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29001 --replSet rs --dbpath %DB_PATH%/RS_1

if not exist "%DB_PATH%/RS_2" mkdir "%DB_PATH%/RS_2"
start "rs-2" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29002 --replSet rs --dbpath %DB_PATH%/RS_2

if not exist "%DB_PATH%/RS_3" mkdir "%DB_PATH%/RS_3"
start "rs-3" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29003 --replSet rs --dbpath %DB_PATH%/RS_3

rem if not exist "%DB_PATH%/RS_4" mkdir "%DB_PATH%/RS_4"
rem start "rs-4" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/data.conf -v --port 29004 --replSet rs --dbpath %DB_PATH%/RS_4

rem if not exist "%DB_PATH%/RS_ARB" mkdir "%DB_PATH%/RS_ARB"
rem start "arb" /MIN "%MONGO_PATH%\mongod.exe" --config %CONF_PATH%/arbitr.conf -v --port 29005 --replSet rs --dbpath  %DB_PATH%/RS_ARB

@echo MongoDB started in other windows
rem pause
