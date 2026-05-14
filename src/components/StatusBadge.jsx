import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { I } from './icons'

// Inline SVGs for states that don't have an icon in icons.jsx
function ClockSvg({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function DoorSvg({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 4H3v16h10V4z" />
      <path d="M21 20H13" />
      <circle cx="10" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function UserXSvg({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" y1="8" x2="23" y2="14" />
      <line x1="23" y1="8" x2="17" y2="14" />
    </svg>
  )
}

const CONFIG = {
  programada:  { label: 'Programada',  bg: 'var(--accent-dim)',  fg: 'var(--accent)',  Icon: ClockSvg },
  confirmada:  { label: 'Confirmada',  bg: 'var(--ok-dim)',      fg: 'var(--ok)',      Icon: I.Check },
  en_sala:     { label: 'En sala',     bg: 'var(--warn-dim)',    fg: 'var(--warn)',    Icon: DoorSvg },
  en_consulta: { label: 'En consulta', bg: 'oklch(72% 0.17 55 / 0.18)', fg: 'oklch(52% 0.22 55)', Icon: I.Stethoscope },
  completada:  { label: 'Completada',  bg: 'var(--bg-subtle)',   fg: 'var(--text-3)',  Icon: I.Check },
  cancelada:   { label: 'Cancelada',   bg: 'oklch(70% 0.18 25 / 0.16)', fg: 'oklch(48% 0.22 25)', Icon: I.X },
  no_acudio:   { label: 'No acudió',   bg: 'var(--bg-subtle)',   fg: 'var(--text-3)',  Icon: UserXSvg },
}

const SIZE = {
  sm: { font: '0.5875rem', iconSz: 10, pad: '2px 7px', gap: 4, height: 20 },
  md: { font: '0.75rem',   iconSz: 12, pad: '3px 10px', gap: 5, height: 24 },
}

function StatusBadge({ status, size = 'sm' }) {
  const cfg = CONFIG[status] || { label: status, bg: 'var(--bg-subtle)', fg: 'var(--text-3)', Icon: ClockSvg }
  const sz  = SIZE[size] || SIZE.sm
  const { Icon } = cfg

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.12 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: sz.gap,
          background: cfg.bg, color: cfg.fg,
          padding: sz.pad, borderRadius: 'var(--radius-full)',
          fontSize: sz.font, fontWeight: 600, lineHeight: 1,
          whiteSpace: 'nowrap', userSelect: 'none',
          height: sz.height,
        }}
      >
        <Icon size={sz.iconSz} width={sz.iconSz} height={sz.iconSz} />
        {cfg.label}
      </motion.span>
    </AnimatePresence>
  )
}

export default memo(StatusBadge)
