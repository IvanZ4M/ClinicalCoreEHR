import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export default function MetricCard({ label, value, Icon, colorVar, dimVar, loading = false }) {
  const count   = useMotionValue(0)
  const rounded = useTransform(count, Math.round)

  const isNumeric = typeof value === 'number'

  useEffect(() => {
    if (loading || !isNumeric) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      count.set(value)
      return
    }
    const ctrl = animate(count, value, { duration: 0.8, ease: 'easeOut' })
    return () => ctrl.stop()
  }, [value, loading, isNumeric]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{
        width: 32, height: 32,
        background: dimVar,
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '0.75rem',
      }}>
        <Icon width={15} height={15} style={{ color: colorVar }} />
      </div>
      <p className="tabular" style={{
        fontSize: '1.625rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1,
      }}>
        {loading ? '—' : isNumeric ? <motion.span>{rounded}</motion.span> : value}
      </p>
      <p style={{
        fontSize: '0.625rem', fontWeight: 600, color: 'var(--text-3)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        marginTop: '0.375rem', lineHeight: 1.4,
      }}>
        {label}
      </p>
    </div>
  )
}
