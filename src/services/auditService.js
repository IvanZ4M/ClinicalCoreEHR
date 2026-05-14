// VULN-FIX (ÁREA 7): servicio de auditoría clínica.
// Registra acciones sensibles en la colección audit_log de PocketBase.
// Los logs son inmutables (Update/Delete vacíos en PB) y solo el admin puede leerlos.
// IMPORTANTE: los errores al escribir logs se silencian — nunca deben
// interrumpir el flujo clínico principal.
import pb from '../lib/pb'

export async function logAuditEvent(accion, recurso, recursoId = null) {
  try {
    await pb.collection('audit_log').create({
      usuario_id: pb.authStore.record?.id ?? '',
      accion,      // p.ej. 'LOGIN_OK', 'VER_EXPEDIENTE', 'CREAR_CONSULTA'
      recurso,     // p.ej. 'usuarios', 'pacientes', 'consultas'
      recurso_id: recursoId ?? '',
    })
  } catch {
    // Silenciar — el log es secundario y no debe romper la operación clínica
  }
}
