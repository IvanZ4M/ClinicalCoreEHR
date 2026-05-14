import { memo } from 'react'
import { motion } from 'framer-motion'
import StatusBadge from './StatusBadge'
import { safeAnimate } from '../lib/animations'

// Deterministic avatar palette derived from patient name
const BG = [
  'var(--accent-dim)', 'var(--ok-dim)', 'var(--violet-dim)',
  'var(--warn-dim)', 'oklch(72% 0.14 220 / 0.18)', 'oklch(65% 0.18 350 / 0.14)',
]
const FG = [
  'var(--accent)', 'var(--ok)', 'var(--violet)',
  'var(--warn)', 'oklch(40% 0.18 220)', 'oklch(46% 0.22 350)',
]

function hashIdx(str) {
  let h = 5381
  for (const c of str) h = ((h << 5) + h + c.charCodeAt(0)) & 0xffff
  return Math.abs(h) % BG.length
}

const TIPO_LABEL = {
  consulta_general: 'Consulta general', seguimiento: 'Seguimiento',
  urgencia: 'Urgencia', revision: 'Revisión', chequeo: 'Chequeo',
}

function fmtHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function CitaCard({ cita, isNext, conTriage, onAccion }) {
  const pac      = cita.expand?.paciente
  const nombre   = pac ? `${pac.nombre} ${pac.apellidos}` : 'Paciente'
  const initials = pac ? `${pac.nombre?.[0] || ''}${pac.apellidos?.[0] || ''}`.toUpperCase() : '?'
  const idx      = hashIdx(nombre)

  const { estado } = cita
  const activa    = estado === 'en_consulta'
  const terminada = estado === 'completada'
  const cancelada = estado === 'cancelada' || estado === 'no_acudio'

  const borderColor = activa ? 'var(--warn)' : isNext ? 'var(--accent)' : 'transparent'
  const cardBg = activa
    ? 'color-mix(in oklch, var(--warn) 6%, var(--bg-elev))'
    : isNext
    ? 'color-mix(in oklch, var(--accent) 6%, var(--bg-elev))'
    : 'var(--bg-elev)'

  // Action button config
  let accionLabel = null
  let accionStyle = {}
  if (activa) {
    accionLabel = 'Continuar'
    accionStyle = {
      background: 'var(--warn-dim)', color: 'var(--warn)',
      border: '1.5px solid var(--warn)', fontWeight: 700,
    }
  } else if (estado === 'programada' || estado === 'confirmada' || estado === 'en_sala') {
    accionLabel = 'Iniciar consulta'
    accionStyle = { background: 'var(--accent)', color: 'white', border: 'none', fontWeight: 600 }
  } else if (terminada) {
    accionLabel = 'Ver resumen'
    accionStyle = {
      background: 'transparent', color: 'var(--text-3)',
      border: '1.5px solid var(--border)', fontWeight: 500,
    }
  }

  return (
    <motion.div
      style={{
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        padding: '0.875rem 1rem',
        background: cardBg,
        borderRadius: 'var(--radius-md)',
        borderLeft: `3px solid ${borderColor}`,
        opacity: cancelada ? 0.5 : terminada ? 0.65 : 1,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
      {...(cancelada ? {} : safeAnimate({
        whileHover: { y: -2, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' },
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      }))}
    >
      {/* Avatar */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: BG[idx],
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: FG[idx] }}>
          {initials}
        </span>
      </div>

      {/* Patient info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{
            fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.3,
            textDecoration: cancelada ? 'line-through' : 'none',
          }}>
            {nombre}
          </span>
          {conTriage && !cancelada && (
            <span style={{
              fontSize: '0.5625rem', fontWeight: 700, color: 'var(--ok)',
              background: 'var(--ok-dim)', borderRadius: 3, padding: '1px 5px',
            }}>
              ✓ Valorado
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.7813rem', color: 'var(--text-3)', marginTop: 2, lineHeight: 1.3 }}>
          {TIPO_LABEL[cita.tipo] || cita.tipo} · {fmtHora(cita.fecha_hora)}
          {cita.consultorio ? ` · ${cita.consultorio}` : ''}
        </p>
        <div style={{ marginTop: '0.375rem' }}>
          <StatusBadge status={estado} size="sm" />
        </div>
      </div>

      {/* Action button */}
      {accionLabel && (
        <motion.button
          onClick={() => onAccion?.(cita)}
          style={{
            minWidth: 120, height: 36, padding: '0 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8125rem', cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
            ...accionStyle,
          }}
          {...safeAnimate({
            whileHover: { opacity: 0.82, y: -1 },
            whileTap: { scale: 0.97 },
            transition: { type: 'spring', stiffness: 400, damping: 25 },
          })}
        >
          {accionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

export default memo(CitaCard)
