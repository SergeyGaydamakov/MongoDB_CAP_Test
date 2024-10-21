cls

@echo off
CHCP 65001 
echo ***
echo *
echo * Кодировка UTF-8
echo *

rem Ищем MongoShell
SET MONGO_SERGEY=C:\Sergeyg\MongoDB\Server\7.0\bin
SET MONGO_PATH_7_0=C:\Program Files\MongoDB\Server\7.0\bin
SET MONGO_PATH_6_0=C:\Program Files\MongoDB\Server\6.0\bin
SET MONGO_PATH_5_0=C:\Program Files\MongoDB\Server\5.0\bin

IF EXIST "%MONGO_PATH_5_0%\mongod.exe" SET MONGO_PATH=%MONGO_PATH_5_0%
IF EXIST "%MONGO_PATH_6_0%\mongod.exe" SET MONGO_PATH=%MONGO_PATH_6_0%
IF EXIST "%MONGO_PATH_7_0%\mongod.exe" SET MONGO_PATH=%MONGO_PATH_7_0%
IF EXIST "%MONGO_SERGEY%\mongod.exe" SET MONGO_PATH=%MONGO_SERGEY%

SET MONGO_PATH_SHELL=%MONGO_PATH%
rem IF NOT EXIST "%MONGO_PATH_SHELL%\mongosh.exe" GOTO mongo_not_found
IF NOT EXIST "%MONGO_PATH%\mongod.exe" GOTO mongo_not_found
IF NOT EXIST "%MONGO_PATH%\mongos.exe" GOTO mongo_not_found

rem Устанавливаем переменные mongodb относительно BASE_PATH
set HOMEDRIVE=%~d0
set HOMEPATH=%~p0
set HOME=%~p0

rem Получаем путь на уровень выше
SET RUN_PATH=%~dp0
cd %RUN_PATH%

if {%RUN_PATH:~-1,1%}=={\} (set CONF_PATH=%RUN_PATH%Conf) else (set CONF_PATH=%RUN_PATH%\Conf)
if {%RUN_PATH:~-1,1%}=={\} (set DB_PATH=%RUN_PATH%DB) else (set DB_PATH=%RUN_PATH%\DB)

GOTO ok

:mongo_not_found
echo * На компьютере не найдены все или часть файлов MongoDB в следующих каталогах:
echo * %MONGO_SERGEY%
echo * %MONGO_PATH_7_0%
echo * %MONGO_PATH_6_0%
echo * %MONGO_PATH_5_0%
echo * 
echo * Mongo Shell:
echo * %MONGO_PATH_SHELL%
echo *
echo * Работа не возможна.
echo *
echo ***
pause
exit

:ok
echo * Структура каталогов для работы относительно каталога запуска:
echo *
echo * HOMEDRIVE каталог:
echo * %HOMEDRIVE%
echo *
echo * HOMEPATH каталог:
echo * %HOMEPATH%
echo *
echo * Каталог баз данных MongoDB:   
echo * %MONGO_PATH%
echo * 
echo * Конфигурационные файлы запуска MongoDB
echo * %CONF_PATH%
echo *
echo * Mongo Shell path:
echo * %MONGO_PATH_SHELL%
echo *
echo * Каталог запуска скриптов:
echo * %cd%
echo *
echo * Запускаем скрипты...
echo *
echo ***
