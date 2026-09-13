@echo off
title Lost Ark CP Calculator - Serveur Local
color 0b
echo ====================================================
echo    LOST ARK COMBAT POWER CALCULATOR ^& SIMULATOR
echo    Lancement du serveur local sur le port 8080...
echo ====================================================
echo.

:: Ouvre l'URL dans le navigateur par défaut après 1 seconde
start "" "http://localhost:8080/"

:: Lance le serveur Node.js
node server.js

pause
