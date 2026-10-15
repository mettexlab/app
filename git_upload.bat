@echo off
title Git Upload Automation
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0git_upload.ps1" %*
echo.
pause
