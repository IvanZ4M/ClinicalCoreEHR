# ClinicalCore EHR

**Sistema de Gestión de Expedientes Clínicos Electrónicos**

Aplicación de escritorio para Windows orientada a la digitalización del ciclo completo de atención médica en consultorios y clínicas de primer nivel. Opera **en la red local de la clínica y sin dependencia de Internet**: los datos nunca salen del consultorio y el sistema sigue funcionando aunque caiga el enlace externo.

---

## Características principales

- **Autenticación con roles** — Médico, enfermera, recepcionista y administrador, con acceso diferenciado por rol
- **Gestión de pacientes** — Registro completo con CURP, antecedentes, alergias críticas y foto
- **Expediente clínico** — Historial médico, consultas previas y condiciones activas por paciente
- **Agenda de citas** — Calendario mensual interactivo con estados: programada, confirmada, en sala, en consulta, completada, cancelada
- **Registro de consultas** — Motivo, signos vitales, exploración física, diagnósticos CIE-10 y plan de tratamiento
- **Prescripción digital** — Generación automática de recetas médicas en formato PDF
- **Reportes y estadísticas** — Dashboard con top diagnósticos, pirámide poblacional y actividad clínica
- **Sin dependencia de Internet** — Ningún servicio en la nube ni tercero involucrado; todo el software y los datos residen en la red local de la clínica

---

## Modelo de despliegue

ClinicalCore EHR es un sistema **en red local**, no monopuesto. Un equipo actúa como servidor y
los demás se conectan a él por la LAN de la clínica.

```
Servidor (consultorio principal)   PocketBase + la aplicacion Electron
       |
       |   LAN / Wi-Fi de la clinica  ->  http://<IP-del-servidor>:8090
       |
       +-- Recepcion     1 equipo    Registro de pacientes y agenda
       +-- Enfermeria    1 equipo    Triage y signos vitales
       +-- Consultorios  N equipos   Consulta, diagnostico y receta
```

**No requiere conexión a Internet, pero sí requiere red local.** La distinción importa: el
sistema no depende de servicios en la nube y la información clínica nunca sale de la clínica,
pero tampoco es una aplicación aislada en una sola computadora — necesita que los equipos se
vean entre sí en la red.

El procedimiento completo de instalación —IP estática, PocketBase como servicio de Windows,
firewall y respaldos— está en **[README-DESPLIEGUE.md](README-DESPLIEGUE.md)**.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Interfaz | React 19, Tailwind CSS 4, React Router 7 |
| Escritorio | Electron 41 |
| Backend / DB | PocketBase (SQLite embebido) |
| Gráficas | Recharts |
| PDF | jsPDF |
| Build | Vite 8, electron-builder |

---

## Capturas de pantalla

### Panel de Control
Vista general con indicadores del día, citas programadas y diagnósticos frecuentes.

### Expediente del Paciente
Pestañas de datos personales, antecedentes, historial médico y consultas previas.

### Registro de Consulta
Formulario con signos vitales, diagnóstico CIE-10 y prescripción de medicamentos.

### Receta Médica en PDF
Generada automáticamente al finalizar una consulta con medicamentos prescritos.

---

## Instalación para desarrollo

### Prerrequisitos

- Windows 10 (build 1809 o superior) / Windows 11
- Node.js 20.x LTS o superior
- Git 2.40 o superior

```bash
# 1. Clonar el repositorio
git clone https://github.com/IvanZ4M/ClinicalCoreEHR.git
cd ClinicalCoreEHR

# 2. Instalar dependencias
npm install

# 3. Iniciar entorno de desarrollo
# (lanza PocketBase, Vite y Electron simultáneamente)
npm run dev
```

### Generar instalador para Windows

```bash
# Compilar la interfaz y generar el instalador en un solo paso
npm run dist

# El instalador se genera en /dist-electron:
#   ClinicalCore EHR Setup X.X.X.exe   (instalador NSIS)
```

`npm run dist` ya ejecuta `vite build` internamente; no hace falta `npm run build` antes.
`npm run build:electron` es un alias del mismo comando.

> El instalador **no incluye PocketBase**. En la clínica, la base de datos se instala aparte
> como servicio de Windows: ver [README-DESPLIEGUE.md](README-DESPLIEGUE.md).

---

## Configuración inicial

Al ejecutar por primera vez, PocketBase aplica automáticamente las migraciones y crea las colecciones del sistema. Accede al panel administrativo en `http://127.0.0.1:8090/_/` para crear la cuenta de superusuario inicial.

---

## Documentación

En el repositorio:

- **[Guía de instalación en la clínica](README-DESPLIEGUE.md)** — despliegue en red, paso a paso
- **[Checklist pre-producción](CHECKLIST-PRODUCCION.md)** — verificaciones antes de poner el sistema en uso

Fuera del repositorio, entregados como documentos aparte:

- Manual de Usuario
- Manual Técnico

---

## Autor

**Diego Iván Zamarrón Escobedo**  
Proyecto de Titulación — Ingeniería en Sistemas Computacionales  
