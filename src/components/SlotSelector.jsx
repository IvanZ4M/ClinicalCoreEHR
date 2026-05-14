import { memo } from 'react'

function SlotSelector({ slots, horaSeleccionada, onHora, cargando, error }) {
  if (cargando) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            width: 64, height: 32, borderRadius: 'var(--radius-md)',
            background: 'var(--bg-subtle)', opacity: 0.5 + (i % 3) * 0.15,
          }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p style={{ fontSize: '0.75rem', color: 'var(--danger)', padding: '0.5rem 0' }}>
        Error al cargar horarios. Intenta de nuevo.
      </p>
    )
  }

  if (!slots || slots.length === 0) {
    return (
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', padding: '0.5rem 0' }}>
        Sin horarios disponibles para este día.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
      {slots.map(({ hora, disponible }) => {
        const seleccionado = hora === horaSeleccionada
        return (
          <button
            key={hora}
            onClick={() => disponible && onHora(hora)}
            disabled={!disponible}
            style={{
              width: 64, height: 32,
              borderRadius: 'var(--radius-md)',
              border: seleccionado
                ? '2px solid var(--accent)'
                : '1.5px solid var(--border)',
              background: seleccionado
                ? 'var(--accent)'
                : !disponible
                ? 'var(--bg-inset)'
                : 'var(--bg-elev)',
              color: seleccionado
                ? 'white'
                : !disponible
                ? 'var(--text-3)'
                : 'var(--text)',
              fontSize: '0.75rem',
              fontWeight: seleccionado ? 700 : 500,
              cursor: disponible ? 'pointer' : 'not-allowed',
              opacity: !disponible ? 0.5 : 1,
              textDecoration: !disponible ? 'line-through' : 'none',
              transition: 'background 0.1s, border-color 0.1s',
              position: 'relative',
              flexShrink: 0,
            }}
            title={!disponible ? 'Horario ocupado' : hora}
          >
            {hora}
          </button>
        )
      })}
    </div>
  )
}

export default memo(SlotSelector)
