@echo off
title Antibiotics CRM Expiry Reminder
echo Starting Antibiotics CRM Expiry Reminder...
start "" "%~dp0CRM-Reminder-Web\index.html"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check_crm_reminders.ps1"
echo.
echo Press any key to exit this window...
pause >nul
