@echo off
REM Stop all market-terminal processes regardless of the execution policy.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1" %*
