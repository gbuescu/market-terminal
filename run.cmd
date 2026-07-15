@echo off
REM Launch the market terminal regardless of the PowerShell execution policy.
REM Batch files are not blocked by Set-ExecutionPolicy, so this always works.
REM   run.cmd          -> dev mode (API :4780 + Vite :5173)
REM   run.cmd -Prod    -> production mode (serve everything from :4780)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
