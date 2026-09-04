# Guía de instalación — ClinicalCore EHR

**Sistema:** ClinicalCore EHR v1.0.0  
**Desarrollador:** Ivan Zamarrón  
**Soporte:** zamaescobedo@gmail.com  
**Fecha:** Mayo 2026

---

## ¿Cómo funciona el sistema?

Una computadora actúa como **servidor principal**. En esa computadora se instala
el programa (Electron) y la base de datos (PocketBase).

Las demás computadoras y tablets de la clínica **no necesitan instalar nada** — solo
abren un navegador web (Chrome, Edge, Firefox) y escriben la dirección IP del servidor.

```
Servidor principal → ejecuta PocketBase + la app Electron
Otras computadoras → acceden vía navegador en http://192.168.1.10:8090
```

---

## Paso 1 — Configurar IP estática en el servidor

Para que la dirección del servidor no cambie, necesitas asignarle una IP fija.

1. Abre el **Panel de Control** → **Centro de redes y recursos compartidos**
2. Haz clic en tu conexión de red → **Propiedades**
3. Selecciona **Protocolo de Internet versión 4 (TCP/IPv4)** → **Propiedades**
4. Elige **Usar la siguiente dirección IP** y escribe:

   | Campo            | Valor de ejemplo     |
   |------------------|----------------------|
   | Dirección IP     | `192.168.1.10`       |
   | Máscara          | `255.255.255.0`      |
   | Puerta de enlace | `192.168.1.1` (IP de tu router) |
   | DNS preferido    | `8.8.8.8`            |

> **Nota:** Anota esta IP. La necesitarás en los siguientes pasos y en todos
> los dispositivos de la clínica que accedan al sistema.

---

## Paso 2 — Instalar PocketBase como servicio de Windows

PocketBase es la base de datos del sistema. Debe iniciar automáticamente con Windows.

**Requisitos previos:**
- Descarga **NSSM** desde https://nssm.cc/download y coloca `nssm.exe` en la carpeta `resources\`
- `pocketbase.exe` ya viene incluido en la carpeta `pocketbase\` del repositorio; no hay que descargarlo aparte

**Instalación:**

1. Haz clic derecho en `scripts\install-pocketbase-service.bat`
2. Elige **Ejecutar como administrador**
3. Espera a que el script termine — verás el mensaje "PocketBase instalado y ejecutándose como servicio"

Para verificar que el servicio está activo:
- Presiona `Win + R`, escribe `services.msc` y presiona Enter
- Busca **ClinicalCore EHR - Base de datos**
- El estado debe ser **En ejecución** y el inicio **Automático**

---

## Paso 3 — Abrir el puerto en el Firewall de Windows

Para que otras computadoras puedan conectarse, el firewall debe permitir el tráfico al puerto 8090.

1. Haz clic derecho en `scripts\configure-firewall.bat`
2. Elige **Ejecutar como administrador**
3. Verás el mensaje "Puerto 8090 abierto para conexiones entrantes"

---

## Paso 4 — Configurar y construir la aplicación

En la computadora donde tienes el código fuente (la del desarrollador):

```bash
# 1. Configurar la IP del servidor
npm run setup 192.168.1.10

# 2. Generar el instalador
npm run build:electron
```

El instalador `.exe` se genera en la carpeta `dist-electron\`.

---

## Paso 5 — Instalar la aplicación en el servidor

1. Copia el archivo `.exe` de `dist-electron\` al servidor
2. Ejecuta el instalador con doble clic
3. Sigue las instrucciones (puedes cambiar la carpeta de instalación si lo deseas)
4. Una vez instalado, abre **ClinicalCore EHR** desde el escritorio

---

## Paso 6 — Acceder desde otros dispositivos

Desde cualquier computadora o tablet conectada a la misma red Wi-Fi o LAN:

1. Abre un navegador web (Chrome, Edge, Firefox)
2. Escribe en la barra de direcciones: `http://192.168.1.10:8090` *(usa la IP real de tu servidor)*
3. Presiona Enter — verás la pantalla de inicio de sesión de ClinicalCore EHR

> **Si no carga:** Verifica que PocketBase esté ejecutándose (Paso 2) y que el
> firewall esté configurado (Paso 3).

---

## Paso 7 — Configurar respaldos automáticos

Los datos de los pacientes deben respaldarse diariamente en un disco externo.

**Configuración inicial:**
1. Conecta un disco externo (o configura una carpeta de red)
2. Abre el archivo `scripts\backup.bat` con el Bloc de notas
3. Cambia la variable `BACKUP_DRIVE=D:` a la letra de tu disco externo
4. Cambia `PB_DATA=C:\ClinicalCore\pocketbase\pb_data` a la ruta real de instalación

**Programar ejecución diaria:**
1. Abre el **Programador de tareas** (`Win + R` → `taskschd.msc`)
2. Clic en **Crear tarea básica**
3. Nombre: `Respaldo ClinicalCore EHR`
4. Desencadenador: **Diariamente** a las **11:00 PM**
5. Acción: **Iniciar un programa** → busca `scripts\backup.bat`
6. En **Configurar para:** selecciona **Windows 10**

> **Importante:** Los respaldos deben guardarse en un disco **diferente** al del
> servidor. Si el disco del servidor falla, los respaldos en el mismo disco
> también se perderían.

---

## Solución de problemas frecuentes

| Problema | Posible causa | Solución |
|----------|--------------|----------|
| "No se puede conectar al servidor" | PocketBase no está ejecutándose | Verificar en `services.msc` que el servicio esté activo |
| "No se puede conectar al servidor" | Firewall bloqueando puerto 8090 | Re-ejecutar `configure-firewall.bat` como administrador |
| "No se puede conectar al servidor" | IP del servidor cambió | Asignar IP estática (Paso 1) |
| La app no abre | Instalador incompleto | Reinstalar desde el `.exe` |
| Datos no aparecen | PocketBase se reinició con datos limpios | Restaurar respaldo desde `C:\ClinicalCoreBackups` |

---

## Restaurar un respaldo

Si necesitas recuperar datos de un respaldo:

1. Detén el servicio PocketBase: `services.msc` → **ClinicalCore EHR - Base de datos** → **Detener**
2. Renombra la carpeta actual: `pocketbase\pb_data` → `pocketbase\pb_data_OLD`
3. Copia la carpeta del respaldo a `pocketbase\pb_data`
4. Reinicia el servicio PocketBase

---

## Contacto

Para soporte técnico o ante cualquier problema con el sistema:

**Desarrollador:** Ivan Zamarrón  
**Correo:** zamaescobedo@gmail.com

Por favor incluye en tu mensaje:
- Una descripción del problema
- Cuándo ocurrió por primera vez
- Qué estabas haciendo cuando ocurrió
- Capturas de pantalla si es posible
