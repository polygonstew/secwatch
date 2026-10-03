@echo off
REM  SECWATCH  -  double-click to play (opens the terminal dashboard)
cd /d "%~dp0"
call SECWATCH_CONTROL.bat index.html
