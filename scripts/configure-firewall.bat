@echo off
:: Abre el puerto 8090 en el Firewall de Windows para PocketBase.
:: Ejecutar como Administrador.

echo ==========================================================
echo  ClinicalCore EHR — Configuracion de Firewall
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

:: Eliminar regla anterior si existe
netsh advfirewall firewall delete rule name="ClinicalCore EHR - PocketBase" >nul 2>&1

:: Agregar nueva regla
netsh advfirewall firewall add rule ^
  name="ClinicalCore EHR - PocketBase" ^
  dir=in ^
  action=allow ^
  protocol=TCP ^
  localport=8090 ^
  description="Permite acceso a PocketBase desde la red local de la clinica"

if %errorLevel% equ 0 (
  echo.
  echo ✓ Regla de firewall creada correctamente.
  echo   Puerto 8090 abierto para conexiones entrantes TCP.
  echo.
  echo   Los dispositivos de la clinica (tablets, computadoras) podran
  echo   conectarse a este servidor usando su direccion IP.
) else (
  echo ERROR: No se pudo crear la regla de firewall.
  echo Verifica que estes ejecutando como Administrador.
)

echo.
pause
