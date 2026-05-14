import { memo } from 'react'
import { I } from './icons'

const DIAS  = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function obtenerCeldas(anio, mes) {
  // Monday-first: shift Sunday (0) to 6, others -1
  const primerDia = new Date(anio, mes, 1).getDay()
  const offset    = primerDia === 0 ? 6 : primerDia - 1
  const totalDias = new Date(anio, mes + 1, 0).getDate()
  const celdas    = []
  for (let i = 0; i < offset; i++) celdas.push(null)
  for (let d = 1; d <= totalDias; d++) celdas.push(d)
  return celdas
}

function MiniCalendario({ anio, mes, diaSeleccionado, diasConCitas = [], onDia, onMesAnterior, onMesSiguiente }) {
  const hoy   = new Date()
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
  const esPasado = (d) => new Date(anio, mes, d) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())

  const celdas = obtenerCeldas(anio, mes)

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <button onClick={onMesAnterior} className="btn btn-ghost btn-icon" style={{ padding: '0.25rem' }}>
          <I.ChevronLeft width={14} height={14} />
        </button>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)' }}>
          {MESES[mes]} {anio}
        </span>
        <button onClick={onMesSiguiente} className="btn btn-ghost btn-icon" style={{ padding: '0.25rem' }}>
          <I.ChevronRight width={14} height={14} />
        </button>
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.25rem' }}>
        {DIAS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-3)', padding: '0.25rem 0', textTransform: 'uppercase' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`e-${i}`} />

          const pasado      = esPasado(dia)
          const seleccionado = dia === diaSeleccionado
          const conCita     = diasConCitas.includes(dia)

          return (
            <button
              key={dia}
              onClick={() => !pasado && onDia(dia)}
              disabled={pasado}
              title={conCita ? 'Tiene citas' : undefined}
              style={{
                width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                border: 'none', cursor: pasado ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, padding: 0,
                background: seleccionado
                  ? 'var(--accent)'
                  : esHoy(dia)
                  ? 'var(--accent-dim)'
                  : 'transparent',
                opacity: pasado ? 0.3 : 1,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!pasado && !seleccionado) e.currentTarget.style.background = 'var(--bg-subtle)' }}
              onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.background = seleccionado ? 'var(--accent)' : esHoy(dia) ? 'var(--accent-dim)' : 'transparent' }}
            >
              <span style={{
                fontSize: '0.75rem', fontWeight: seleccionado ? 700 : esHoy(dia) ? 600 : 400,
                color: seleccionado ? 'white' : esHoy(dia) ? 'var(--accent)' : 'var(--text)',
                lineHeight: 1,
              }}>
                {dia}
              </span>
              {conCita && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: seleccionado ? 'rgba(255,255,255,0.7)' : 'var(--accent)',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(MiniCalendario)
