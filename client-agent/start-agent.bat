@echo off
title Lost Ark Raid Agent
chcp 65001 >nul
cls
echo ===================================================================
echo             LOST ARK RAID TRACKER - AGENT DE SYNCHRO
echo               https://lostark.nevercry-prox.com
echo ===================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js n'est pas installe sur votre systeme.
    echo.
    echo Tentative d'installation automatique via Windows winget...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [X] Impossible d'installer automatiquement Node.js.
        echo Rendez-vous sur https://nodejs.org pour installer la version LTS (recommandee).
        echo Une fois installe, relancez simplement ce fichier.
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Node.js a ete installe avec succes !
    echo Veuillez fermer et relancer ce script pour finaliser l'initialisation.
    pause
    exit /b 0
)

echo [1/2] Node.js detecte avec succes.
echo [2/2] Demarrage de l'agent sur http://127.0.0.1:4848 ...
echo.
echo ===================================================================
echo  L'agent est actif ! Laissez cette fenetre ouverte (ou reduisez-la).
echo  Rendez-vous sur https://lostark.nevercry-prox.com
echo ===================================================================
echo.
node "%~dp0lostark-raid-agent.js"
pause
