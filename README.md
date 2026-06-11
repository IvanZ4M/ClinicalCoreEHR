# ClinicalCore EHR

**Sistema de Gestión de Expedientes Clínicos Electrónicos**

Aplicación de escritorio para Windows orientada a la digitalización del ciclo completo de atención médica en consultorios y clínicas de primer nivel. Opera de forma **100% local**, sin conexión a Internet, lo que garantiza disponibilidad continua y confidencialidad de la información clínica.

---

## Características principales

- **Autenticación con roles** — Médico, enfermera, recepcionista y administrador, con acceso diferenciado por rol
- **Gestión de pacientes** — Registro completo con CURP, antecedentes, alergias críticas y foto
- **Expediente clínico** — Historial médico, consultas previas y condiciones activas por paciente
- **Agenda de citas** — Calendario mensual interactivo con estados: programada, confirmada, en sala, en consulta, completada, cancelada
- **Registro de consultas** — Motivo, signos vitales, exploración física, diagnósticos CIE-10 y plan de tratamiento
- **Prescripción digital** — Generación automática de recetas médicas en formato PDF
- **Reportes y estadísticas** — Dashboard con top diagnósticos, pirámide poblacional y actividad clínica
- **Modo offline** — Sin dependencia de servicios externos ni conexión a Internet

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
# Compilar e instalar
npm run build
npm run dist

# Los instaladores se generan en /dist:
# - Clinical Core EHR Setup X.X.X.exe  (instalador NSIS)
# - Clinical Core EHR X.X.X.exe        (ejecutable portátil)
```

---

## Configuración inicial

Al ejecutar por primera vez, PocketBase aplica automáticamente las migraciones y crea las colecciones del sistema. Accede al panel administrativo en `http://127.0.0.1:8090/_/` para crear la cuenta de superusuario inicial.

---

## Documentación

- [Manual de Usuario](docs/ClinicalCoreEHR_Manual_Usuario.pdf)
- [Manual Técnico](docs/ClinicalCoreEHR_Manual_Tecnico.pdf)

---

## Autor

**Diego Iván Zamarrón Escobedo**  
Proyecto de Titulación — Ingeniería en Sistemas Computacionales  
