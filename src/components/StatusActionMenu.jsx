import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import StatusBadge from './StatusBadge'
import pb from '../lib/pb'

const TRANSICIONES = {
  programada: {
    recepcionista: [
      { estado: 'confirmada', label: 'Confirmar llegada', color: 'var(--ok)',          destructivo: false },
      { estado: 'no_acudio',  label: 'No acudió',         color: 'oklch(52% 0.22 50)', destructivo: true  },
      { estado: 'cancelada',  label: 'Cancelar cita',     color: 'var(--danger)',       destructivo: true, conMotivo: true },
    ],
    medico:        [{ estado: 'cancelada', label: 'Cancelar cita', color: 'var(--danger)', destructivo: true, conMotivo: true }],
    enfermera:     [],
    administrador: [],
  },
  confirmada: {
    recepcionista: [
      { estado: 'en_sala',   label: 'Llegó a sala', color: 'var(--warn)',          destructivo: false },
      { estado: 'no_acudio', label: 'No acudió',    color: 'oklch(52% 0.22 50)',   destructivo: true  },
      { estado: 'cancelada', label: 'Cancelar cita', color: 'var(--danger)',        destructivo: true, conMotivo: true },
    ],
    enfermera:     [{ estado: 'en_sala',   label: 'Llegó a sala', color: 'var(--warn)', destructivo: false }],
    medico:        [{ estado: 'cancelada', label: 'Cancelar cita', color: 'var(--danger)', destructivo: true, conMotivo: true }],
    administrador: [],
  },
  en_sala: {
    recepcionista: [{ estado: 'cancelada',   label: 'Cancelar cita',    color: 'var(--danger)',  destructivo: true, conMotivo: true }],
    enfermera:     [{ estado: 'en_consulta', label: 'Derivar a médico', color: 'var(--violet)',  destructivo: false }],
    medico: [
      { estado: 'en_consulta', label: 'Iniciar consulta', color: 'var(--violet)', destructivo: false, accion: 'navegar_consulta' },
      { estado: 'cancelada',   label: 'Cancelar cita',    color: 'var(--danger)', destructivo: true, conMotivo: true },
    ],
    administrador: [],
  },
  en_consulta: {
    medico:        [{ estado: 'completada', label: 'Finalizar consulta', color: 'var(--ok)', destructivo: false }],
    recepcionista: [],
    enfermera:     [],
    administrador: [],
  },
  completada:  { medico: [], enfermera: [], recepcionista: [], administrador: [] },
  cancelada:   { medico: [], enfermera: [], recepcionista: [], administrador: [] },
  no_acudio:   { medico: [], enfermera: [], recepcionista: [], administrador: [] },
}

export default function StatusActionMenu({
  citaId, estadoActual, rolUsuario, pacienteId, pacienteNombre, onSuccess, size = 'sm',
}) {
  const navigate = useNavigate()
  const [abierto,    setAbierto]    = useState(false)
  const [pendiente,  setPendiente]  = useState(null)   // { accion }
  const [motivo,     setMotivo]     = useState('')
  const [guardando,  setGuardando]  = useState(false)
  const [errorLocal, setErrorLocal] = useState('')
  const rootRef = useRef(null)

  const acciones = TRANSICIONES[estadoActual]?.[rolUsuario] ?? []

  // Close on outside click / Escape
  useEffect(() => {
    if (!abierto) return
    const onKey = (e) => { if (e.key === 'Escape') cerrar() }
    const onMouse = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) cerrar() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouse)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouse)
    }
  }, [abierto])

  const cerrar = useCallback(() => {
    setAbierto(false)
    setPendiente(null)
    setMotivo('')
    setErrorLocal('')
  }, [])

  const confirmar = async () => {
    if (!pendiente) return
    const { accion } = pendiente

    if (accion.accion === 'navegar_consulta') {
      try {
        await pb.collection('citas').update(citaId, { estado: 'en_consulta' })
        onSuccess?.('en_consulta')
      } catch { /* fail silently, navigate anyway */ }
      cerrar()
      navigate(`/consulta/nueva?paciente=${pacienteId}`)
      return
    }

    setGuardando(true)
    setErrorLocal('')
    const payload = { estado: accion.estado }
    if (accion.conMotivo && motivo.trim()) payload.notas = motivo.trim()

    onSuccess?.('__optimistic__' + accion.estado)
    try {
      await pb.collection('citas').update(citaId, payload)
      onSuccess?.(accion.estado)
      cerrar()
    } catch (err) {
      onSuccess?.(estadoActual) // revert
      setErrorLocal('Error: ' + (err.data?.message || err.message))
    } finally { setGuardando(false) }
  }

  if (acciones.length === 0) return <StatusBadge status={estadoActual} size={size} />

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setAbierto(a => !a)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, display: 'inline-flex', alignItems: 'center', gap: 3,
          borderRadius: 'var(--radius-full)',
          outline: abierto ? '2px solid var(--accent)' : 'none',
          outlineOffset: 2,
          transition: 'opacity 0.15s',
        }}
        title="Cambiar estado"
      >
        <StatusBadge status={estadoActual} size={size} />
        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--text-3)', opacity: 0.7 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.12, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 100,
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            minWidth: 210, overflow: 'hidden',
          }}>
          {pacienteNombre && (
            <div style={{ padding: '0.5rem 0.875rem', borderBottom: '1px solid var(--border)', fontSize: '0.6875rem', color: 'var(--text-3)', fontWeight: 500 }}>
              {pacienteNombre}
            </div>
          )}

          {!pendiente ? (
            <div style={{ padding: '0.375rem 0' }}>
              {acciones.map(accion => (
                <button
                  key={accion.estado}
                  onClick={() => {
                    if (accion.destructivo || accion.conMotivo) {
                      setPendiente({ accion })
                    } else if (accion.accion === 'navegar_consulta') {
                      setPendiente({ accion })
                    } else {
                      setGuardando(true)
                      const prev = estadoActual
                      onSuccess?.('__optimistic__' + accion.estado)
                      pb.collection('citas').update(citaId, { estado: accion.estado })
                        .then(() => { onSuccess?.(accion.estado); cerrar() })
                        .catch(() => { onSuccess?.(prev); setErrorLocal('Error al actualizar') })
                        .finally(() => setGuardando(false))
                    }
                  }}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.5rem 0.875rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.8125rem', color: accion.color || 'var(--text)',
                    fontWeight: accion.destructivo ? 500 : 600,
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-subtle)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                  disabled={guardando}
                >
                  {accion.label}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: '0.75rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600 }}>
                {pendiente.accion.accion === 'navegar_consulta'
                  ? '¿Iniciar consulta?'
                  : `¿${pendiente.accion.label}?`
                }
              </p>
              {pendiente.accion.conMotivo && (
                <textarea
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Motivo (opcional)..."
                  rows={2}
                  className="input"
                  style={{ fontSize: '0.75rem', resize: 'none' }}
                  autoFocus
                />
              )}
              {errorLocal && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--danger)' }}>{errorLocal}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={cerrar} className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                  No
                </button>
                <button
                  onClick={confirmar}
                  disabled={guardando}
                  style={{
                    fontSize: '0.75rem', padding: '0.25rem 0.875rem',
                    background: pendiente.accion.color, color: 'white',
                    border: 'none', borderRadius: 'var(--radius-md)',
                    cursor: guardando ? 'default' : 'pointer', fontWeight: 600,
                    opacity: guardando ? 0.7 : 1,
                  }}
                >
                  {guardando ? '...' : 'Confirmar'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
