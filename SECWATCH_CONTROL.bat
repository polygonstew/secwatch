@echo off
REM ================================================================
REM  SECWATCH CONTROL  -  double-click to open the level + story editor
REM  Starts a tiny local web server in this folder (needs Python),
REM  then opens the editor in its own Edge app window.
REM  Close the "SECWATCH server" window when you are done.
REM ================================================================
title SECWATCH CONTROL
cd /d "%~dp0"
set PORT=8777
set PAGE=%1
if "%PAGE%"=="" set PAGE=control.html
set PY=
py -c "import http.server" >nul 2>nul && set PY=py
if not defined PY ( python -c "import http.server" >nul 2>nul && set PY=python )
if not defined PY (
  echo.
  echo  Python was not found. It runs the little local server the editor needs.
  echo  Install it from https://www.python.org/downloads/  and tick "Add python.exe to PATH".
  echo  Then double-click this file again.
  echo.
  pause
  exit /b 1
)
REM start the server once (if the port is already in use it is probably ours)
netstat -an | find ":%PORT% " | find "LISTENING" >nul
if errorlevel 1 start "SECWATCH server" /min %PY% -m http.server %PORT% --bind 127.0.0.1
timeout /t 2 /nobreak >nul
set URL=http://localhost:%PORT%/%PAGE%
set EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe
if not exist "%EDGE%" set EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe
if exist "%EDGE%" (
  start "" "%EDGE%" --app=%URL% --window-size=1500,920
) else (
  start "" %URL%
)
exit /b 0
