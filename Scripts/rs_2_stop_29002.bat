echo Run this script in minimize console
@echo off
if "%1"=="done" goto runtime
start "" /min %0 done
exit

:runtime
@echo on
echo Kill mongod process with name rs-2
taskkill.exe /F /FI "WINDOWTITLE eq rs-2"
taskkill.exe /F /FI "WINDOWTITLE eq rs-2"
taskkill.exe /F /FI "WINDOWTITLE eq rs-2"
exit