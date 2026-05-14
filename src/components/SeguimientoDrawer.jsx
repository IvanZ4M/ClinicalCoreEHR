import { useReducer, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { I } from './icons'
import MiniCalendario from './MiniCalendario'
import SlotSelector from './SlotSelector'
import { createCita, getSlotsDisponibles } from '../services/citasService'

const TIPOS = [
  { valor: 'seguimiento',      label: 'Seguimiento' },
  { valor: 'consulta_general', label: 'Consulta general' },
  { valor: 'revision',         label: 'Revisión' },
  { valor: 'chequeo',          label: 'Chequeo' },
]

const hoy = new Date()
const init = {
  anio:      hoy.getFullYear(),
  mes:       hoy.getMonth(),
  dia:       null,
  slots:     [],
  cargSlots: false,
  errSlots:  null,
  hora:      null,
  tipo:      'seguimiento',
  notas:     '',
  guardando: false,
  exito:     false,
  errGuard:  null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'MES_ANTERIOR': {
      const mes = state.mes === 0 ? 11 : state.mes - 1
      const anio = state.mes === 0 ? state.anio - 1 : state.anio
      return { ...state, mes, anio, dia: null, slots: [], hora: null, errSlots: null }
    }
    case 'MES_SIGUIENTE': {
      const mes = state.mes === 11 ? 0 : state.mes + 1
      const anio = state.mes === 11 ? state.anio + 1 : state.anio
      return { ...state, mes, anio, dia: null, slots: [], hora: null, errSlots: null }
    }
    case 'SET_DIA':
      return { ...state, dia: action.dia, slots: [], hora: null, cargSlots: true, errSlots: null }
    case 'SLOTS_OK':
      return { ...state, slots: action.slots, cargSlots: false }
    case 'SLOTS_ERR':
      return { ...state, errSlots: action.err, cargSlots: false }
    case 'SET_HORA':
      return { ...state, hora: action.hora }
    case 'SET_TIPO':
      return { ...state, tipo: action.tipo }
    case 'SET_NOTAS':
      return { ...state, notas: action.notas }
    case 'GUARDANDO':
      return { ...state, guardando: true, errGuard: null }
    case 'EXITO':
      return { ...state, guardando: false, exito: true }
    case 'ERR_GUARDANDO':
      return { ...state, guardando: false, errGuard: action.err }
    case 'RESET':
      return { ...init, notas: action.notas || '' }
    default:
      return state
  }
}

export default function SeguimientoDrawer({
  open, onCerrar,
  pacienteId, pacienteNombre,
  medicoId, medicoNombre,
  consultorio,
  planTratamiento,
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...init,
    notas: planTratamiento || '',
  })

  // Reset notas when planTratamiento changes (new consultation opened)
  useEffect(() => {
    if (open) dispatch({ type: 'RESET', notas: planTratamiento || '' })
  }, [open])

  // Escape key close
  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (e.key === 'Escape' && !state.guardando) onCerrar() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [open, state.guardando, onCerrar])

  // Load slots when day is selected
  useEffect(() => {
    if (!state.cargSlots || !state.dia) return
    const fecha = `${state.anio}-${String(state.mes + 1).padStart(2, '0')}-${String(state.dia).padStart(2, '0')}`
    getSlotsDisponibles(medicoId, fecha)
      .then(slots => dispatch({ type: 'SLOTS_OK', slots }))
      .catch(err  => dispatch({ type: 'SLOTS_ERR', err: err.message }))
  }, [state.cargSlots, state.dia, state.mes, state.anio, medicoId])

  const handleGuardar = useCallback(async () => {
    if (!state.dia || !state.hora) return
    dispatch({ type: 'GUARDANDO' })
    const fecha = `${state.anio}-${String(state.mes + 1).padStart(2, '0')}-${String(state.dia).padStart(2, '0')}`
    const fecha_hora = `${fecha} ${state.hora}:00`
    try {
      await createCita({
        paciente:   pacienteId,
        medico:     medicoId,
        fecha_hora,
        tipo:       state.tipo,
        consultorio: consultorio || '',
        notas:      state.notas,
        estado:     'programada',
      })
      dispatch({ type: 'EXITO' })
    } catch (err) {
      dispatch({ type: 'ERR_GUARDANDO', err: err.data?.message || err.message })
    }
  }, [state.dia, state.hora, state.anio, state.mes, state.tipo, state.notas, pacienteId, medicoId, consultorio])

  const fechaFormateada = state.dia
    ? new Date(state.anio, state.mes, state.dia).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    : null

  const puedeGuardar = state.dia && state.hora && !state.guardando

  return createPortal(
    <AnimatePresence>
      {open && (
      <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => { if (!state.guardando) onCerrar() }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 35 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 201,
          width: 420, maxWidth: '100vw',
          background: 'var(--bg-elev)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >

        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              Agendar seguimiento
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 2 }}>
              {pacienteNombre}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="btn-icon btn-ghost"
            disabled={state.guardando}
            style={{ padding: '0.375rem' }}
          >
            <I.X width={16} height={16} />
          </button>
        </div>

        {/* Readonly meta */}
        <div style={{
          padding: '0.875rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', gap: '1rem', flexShrink: 0,
          background: 'var(--bg-subtle)',
        }}>
          <MetaChip icon={<I.User width={12} height={12} />}    label="Médico"      value={medicoNombre ? `Dr. ${medicoNombre}` : '—'} />
          {consultorio && <MetaChip icon={<I.Calendar width={12} height={12} />} label="Consultorio" value={consultorio} />}
        </div>

        {/* Success state */}
        {state.exito ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '1rem', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ok-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Check width={28} height={28} style={{ color: 'var(--ok)' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>¡Cita agendada!</p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: 4 }}>
                {state.hora} · {fechaFormateada}
              </p>
            </div>
            <button onClick={onCerrar} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Listo
            </button>
          </div>
        ) : (
          <div style={{ flex: 1, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto' }}>

            {/* Calendar */}
            <Section titulo="Selecciona una fecha">
              <MiniCalendario
                anio={state.anio}
                mes={state.mes}
                diaSeleccionado={state.dia}
                diasConCitas={[]}
                onDia={(dia) => dispatch({ type: 'SET_DIA', dia })}
                onMesAnterior={() => dispatch({ type: 'MES_ANTERIOR' })}
                onMesSiguiente={() => dispatch({ type: 'MES_SIGUIENTE' })}
              />
            </Section>

            {/* Slots */}
            {state.dia && (
              <Section titulo={`Horarios — ${fechaFormateada}`}>
                <SlotSelector
                  slots={state.slots}
                  horaSeleccionada={state.hora}
                  onHora={(hora) => dispatch({ type: 'SET_HORA', hora })}
                  cargando={state.cargSlots}
                  error={state.errSlots}
                />
              </Section>
            )}

            {/* Type */}
            <Section titulo="Tipo de consulta">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {TIPOS.map(t => (
                  <button
                    key={t.valor}
                    onClick={() => dispatch({ type: 'SET_TIPO', tipo: t.valor })}
                    style={{
                      padding: '0.375rem 0.875rem', borderRadius: 'var(--radius-full)',
                      border: state.tipo === t.valor ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                      background: state.tipo === t.valor ? 'var(--accent-dim)' : 'transparent',
                      color: state.tipo === t.valor ? 'var(--accent)' : 'var(--text-2)',
                      fontSize: '0.8125rem', fontWeight: state.tipo === t.valor ? 600 : 400,
                      cursor: 'pointer', transition: 'all 0.1s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Section>

            {/* Notes */}
            <Section titulo="Notas para la próxima cita">
              <textarea
                value={state.notas}
                onChange={e => dispatch({ type: 'SET_NOTAS', notas: e.target.value })}
                rows={3}
                placeholder="Instrucciones o indicaciones para el seguimiento..."
                className="input"
                style={{ resize: 'none', fontSize: '0.8125rem' }}
              />
            </Section>

            {state.errGuard && (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem', color: 'var(--danger)', fontSize: '0.8125rem' }}>
                <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} />
                {state.errGuard}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!state.exito && (
          <div style={{
            padding: '1rem 1.5rem', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexShrink: 0,
            background: 'var(--bg-elev)',
          }}>
            <button onClick={onCerrar} className="btn btn-outline" style={{ fontSize: '0.875rem' }} disabled={state.guardando}>
              Omitir
            </button>
            <button
              onClick={handleGuardar}
              disabled={!puedeGuardar}
              className="btn btn-primary"
              style={{ fontSize: '0.875rem', opacity: puedeGuardar ? 1 : 0.5 }}
            >
              {state.guardando ? 'Guardando...' : 'Confirmar cita'}
            </button>
          </div>
        )}
      </motion.div>
      </>
      )}
    </AnimatePresence>,
    document.body
  )
}

function Section({ titulo, children }) {
  return (
    <div>
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>
        {titulo}
      </p>
      {children}
    </div>
  )
}

function MetaChip({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span style={{ fontSize: '0.5875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 3 }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text)' }}>{value}</span>
    </div>
  )
}
