@echo off
:: Respaldo diario de ClinicalCore EHR — datos de PocketBase.
:: Programar en el Programador de Tareas de Windows para ejecutar diariamente.
::
:: IMPORTANTE: Guarda los respaldos en un disco diferente al del servidor.
:: Un fallo de disco destruiria tanto los datos como los respaldos si estan en el mismo disco.

:: ── Configuración ────────────────────────────────────────────────────────────
set BACKUP_DRIVE=D:
set BACKUP_DIR=%BACKUP_DRIVE%\ClinicalCoreBackups
set PB_DATA=C:\ClinicalCore\backend\pb_data
set MAX_BACKUPS=30

:: Fecha en formato YYYY-MM-DD usando wmic (independiente de locale de Windows)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DATETIME=%%I
set FECHA=%DATETIME:~0,4%-%DATETIME:~4,2%-%DATETIME:~6,2%

:: ── Verificaciones ───────────────────────────────────────────────────────────
if not exist "%PB_DATA%" (
  echo ERROR: No se encontro la carpeta de datos: %PB_DATA%
  echo Ajusta la variable PB_DATA en este script con la ruta correcta.
  exit /b 1
)

if not exist "%BACKUP_DRIVE%\" (
  echo ERROR: El disco de respaldo %BACKUP_DRIVE% no esta disponible.
  echo Conecta el disco externo antes de ejecutar el respaldo.
  exit /b 1
)

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: ── Copia de datos ───────────────────────────────────────────────────────────
echo [%FECHA%] Iniciando respaldo de ClinicalCore EHR...
xcopy "%PB_DATA%" "%BACKUP_DIR%\backup_%FECHA%\" /E /I /Q /Y

if %errorLevel% equ 0 (
  echo [%FECHA%] Respaldo completado: %BACKUP_DIR%\backup_%FECHA%
) else (
  echo [%FECHA%] ERROR: El respaldo fallo. Revisa el disco de respaldo.
  exit /b 1
)

:: ── Limpiar respaldos viejos (mantener solo los ultimos MAX_BACKUPS) ─────────
set COUNT=0
for /f "delims=" %%D in ('dir /b /ad /o-d "%BACKUP_DIR%\backup_*" 2^>nul') do (
  set /a COUNT+=1
  if !COUNT! gtr %MAX_BACKUPS% (
    echo Eliminando respaldo antiguo: %%D
    rmdir /s /q "%BACKUP_DIR%\%%D"
  )
)

echo [%FECHA%] Respaldos disponibles: %COUNT% (maximo: %MAX_BACKUPS%)
