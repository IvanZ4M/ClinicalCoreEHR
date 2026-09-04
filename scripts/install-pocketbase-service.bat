@echo off
:: Instala PocketBase como servicio de Windows usando NSSM.
:: Ejecutar como Administrador.

echo ==========================================================
echo  ClinicalCore EHR — Instalacion de servicio PocketBase
echo ==========================================================
echo.

:: Verificar que se ejecuta como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
  echo ERROR: Este script debe ejecutarse como Administrador.
  echo Haz clic derecho en el archivo y elige "Ejecutar como administrador".
  pause
  exit /b 1
)

set NSSM=%~dp0..\resources\nssm.exe
set PB_EXE=%~dp0..\pocketbase\pocketbase.exe
set PB_DIR=%~dp0..\pocketbase
set LOG_DIR=%PB_DIR%\logs

:: Verificar que existe nssm.exe
if not exist "%NSSM%" (
  echo ERROR: No se encontro nssm.exe en resources\
  echo Descarga NSSM desde https://nssm.cc/download y coloca nssm.exe en la carpeta resources\
  pause
  exit /b 1
)

:: Verificar que existe pocketbase.exe
if not exist "%PB_EXE%" (
  echo ERROR: No se encontro pocketbase.exe en pocketbase\
  echo Asegurate de haber copiado pocketbase.exe a la carpeta pocketbase\
  pause
  exit /b 1
)

:: Crear carpeta de logs si no existe
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: Desinstalar servicio existente si hay uno previo
%NSSM% status ClinicalCorePocketBase >nul 2>&1
if %errorLevel% equ 0 (
  echo Desinstalando version anterior del servicio...
  %NSSM% stop ClinicalCorePocketBase >nul 2>&1
  %NSSM% remove ClinicalCorePocketBase confirm >nul 2>&1
)

echo Instalando servicio PocketBase...
%NSSM% install ClinicalCorePocketBase "%PB_EXE%"
%NSSM% set ClinicalCorePocketBase AppDirectory "%PB_DIR%"
%NSSM% set ClinicalCorePocketBase AppParameters "serve --http=0.0.0.0:8090"
%NSSM% set ClinicalCorePocketBase DisplayName "ClinicalCore EHR - Base de datos"
%NSSM% set ClinicalCorePocketBase Description "Servidor de base de datos para ClinicalCore EHR"
%NSSM% set ClinicalCorePocketBase Start SERVICE_AUTO_START
%NSSM% set ClinicalCorePocketBase AppStdout "%LOG_DIR%\pocketbase-stdout.log"
%NSSM% set ClinicalCorePocketBase AppStderr "%LOG_DIR%\pocketbase-stderr.log"
%NSSM% set ClinicalCorePocketBase AppRotateFiles 1
%NSSM% set ClinicalCorePocketBase AppRotateBytes 10485760

net start ClinicalCorePocketBase

echo.
echo ==========================================================
echo  PocketBase instalado y ejecutandose como servicio.
echo  Puerto: 8090 (accesible desde toda la red local)
echo  Logs:   %LOG_DIR%
echo ==========================================================
pause
