@echo off
echo ========================================================
echo   Installation du Lost Ark Raid Tracker au demarrage
echo ========================================================
schtasks /create /f /tn "LostArkRaidTrackerAgent" /tr "wscript.exe \"%~dp0start-agent-hidden.vbs\"" /sc onlogon
echo.
echo [OK] Tache planifiee creee avec succes !
echo L'agent tournera silencieusement en arriere-plan a chaque demarrage.
echo.
pause
