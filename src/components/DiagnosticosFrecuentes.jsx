import { memo, useMemo } from 'react'
import { I } from './icons'

function DiagnosticosFrecuentes({ diagnosticos, onVerTodos }) {
  const top5 = useMemo(() => {
    const conteo = {}
    diagnosticos.forEach(d => {
      const k = d.codigo_cie10
        ? `${d.codigo_cie10} — ${d.descripcion}`
        : (d.descripcion || 'Sin descripción')
      conteo[k] = (conteo[k] || 0) + 1
    })
    const entries = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5)
    const maxN = entries[0]?.[1] || 1
    return entries.map(([nombre, n]) => ({ nombre, n, pct: Math.round((n / maxN) * 100) }))
  }, [diagnosticos])

  return (
    <div className="card" style={{ padding: '1.25rem', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <I.Activity width={14} height={14} style={{ color: 'var(--text-3)' }} />
          <h2 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
            Diagnósticos frecuentes
          </h2>
        </div>
        {onVerTodos && (
          <button
            onClick={onVerTodos}
            style={{
              fontSize: '0.6875rem', color: 'var(--accent)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Ver todos →
          </button>
        )}
      </div>

      {top5.length === 0 ? (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', textAlign: 'center', padding: '1.5rem 0' }}>
          Se mostrarán al registrar consultas
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {top5.map((dx, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                <span style={{
                  color: 'var(--text)', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem',
                }}>
                  {dx.nombre}
                </span>
                <span className="tabular" style={{ color: 'var(--text-3)', flexShrink: 0, fontWeight: 600 }}>
                  {dx.n}
                </span>
              </div>
              <div style={{ width: '100%', background: 'var(--bg-inset)', borderRadius: 'var(--radius-full)', height: 4 }}>
                <div style={{
                  width: `${dx.pct}%`, height: 4,
                  background: 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.5s var(--ease-out)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(DiagnosticosFrecuentes)
