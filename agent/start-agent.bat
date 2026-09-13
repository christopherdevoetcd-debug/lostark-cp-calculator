@echo off
title Lost Ark Raid Tracker Agent
cd /d "%~dp0"
echo ========================================================
echo   Lost Ark Local Raid Sync Agent (LOA Logs Tracker)
echo   Port: http://127.0.0.1:4848/api/raid-status
echo ========================================================
node lostark-raid-agent.js
pause
