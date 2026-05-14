# Checklist pre-producción — ClinicalCore EHR

Revisar cada punto antes de instalar el sistema en la clínica.
Marcar con `[x]` cuando esté completado.

---

## Seguridad

- [ ] Reglas de acceso configuradas en PocketBase para todas las colecciones
- [ ] `contextIsolation: true` verificado en `electron/main.js`
- [ ] `nodeIntegration: false` verificado en `electron/main.js`
- [ ] DevTools deshabilitado en build de producción (verificar en `electron/main.js`)
- [ ] Variables de entorno configuradas con IP real (ejecutar `npm run setup <IP>`)
- [ ] `.env.production` NO incluido en el repositorio (verificar `.gitignore`)
- [ ] Auto-cierre de sesión por inactividad funcionando (30 min)

## Funcionalidad

- [ ] Login funciona correctamente con usuarios reales
- [ ] Cada médico ve SOLO sus propias citas
- [ ] Validaciones de formularios funcionando (CURP, teléfono, signos vitales)
- [ ] Generación de PDF de recetas funciona
- [ ] Cambio automático de estado al finalizar consulta funciona
- [ ] Agendar cita de seguimiento desde consulta funciona
- [ ] Valoración de enfermería fluye correctamente al médico
- [ ] Reportes del panel de administrador muestran datos correctos

## Infraestructura

- [ ] IP estática configurada en el servidor (no DHCP)
- [ ] PocketBase instalado como servicio de Windows (`scripts/install-pocketbase-service.bat`)
- [ ] PocketBase iniciando automáticamente con Windows (verificar en `services.msc`)
- [ ] PocketBase escuchando en `0.0.0.0:8090` (no solo `127.0.0.1`)
- [ ] Puerto 8090 abierto en firewall (`scripts/configure-firewall.bat`)
- [ ] Acceso verificado desde al menos otro dispositivo de la clínica
- [ ] Respaldos automáticos configurados en el Programador de Tareas de Windows
- [ ] Carpeta de respaldos en disco **diferente** al disco del servidor
- [ ] Respaldo de prueba ejecutado y verificado manualmente

## Datos iniciales

- [ ] Usuario administrador con contraseña segura (no la del desarrollador)
- [ ] Usuarios de médicos creados con roles correctos
- [ ] Contraseñas iniciales comunicadas de forma segura a cada usuario
- [ ] Datos del consultorio configurados (nombre, dirección, teléfono)
- [ ] Logo del consultorio configurado (para recetas PDF)
- [ ] Paciente de prueba creado, flujo completo verificado, y **eliminado** antes de ir live
- [ ] Base de datos de desarrollo NO copiada al servidor de producción

## Capacitación

- [ ] Personal médico capacitado en flujo de consulta (triage → consulta → receta)
- [ ] Recepcionista capacitada en registro de pacientes y citas
- [ ] Enfermera capacitada en valoración de signos vitales
- [ ] Todos los usuarios cambiaron su contraseña inicial
- [ ] Manual de usuario disponible en el servidor o impreso
- [ ] Número de contacto del desarrollador conocido por el responsable de TI

---

**Fecha de verificación:** _______________  
**Verificado por:** _______________  
**Versión del sistema:** 1.0.0
