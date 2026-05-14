import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import { I } from '../components/icons'

const CHART_COLORS = [
  'var(--accent)', 'var(--ok)', 'var(--warn)', 'var(--danger)',
  'var(--violet)', 'var(--amber)', '#0891b2', '#db2777',
]
const CHART_HEX = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#f97316','#0891b2','#db2777']

const PERIODOS = [
  { valor: 'diario',  etiqueta: 'Diario'  },
  { valor: 'semanal', etiqueta: 'Semanal' },
  { valor: 'mensual', etiqueta: 'Mensual' },
  { valor: 'anual',   etiqueta: 'Anual'   },
]

function obtenerRango(periodo) {
  const hoy = new Date()
  const fmt = (d) => d.toISOString().replace('T', ' ').slice(0, 19)
  if (periodo === 'diario') {
    return [fmt(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0)),
            fmt(new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59))]
  }
  if (periodo === 'semanal') {
    const ini = new Date(hoy); ini.setDate(hoy.getDate() - 6); ini.setHours(0, 0, 0, 0)
    return [fmt(ini), fmt(hoy)]
  }
  if (periodo === 'anual') {
    return [fmt(new Date(hoy.getFullYear(), 0, 1, 0, 0, 0)),
            fmt(new Date(hoy.getFullYear(), 11, 31, 23, 59, 59))]
  }
  return [fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1, 0, 0, 0)),
          fmt(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59))]
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function StatCard({ label, value, sub, Icon, colorVar, dimVar }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ width: 40, height: 40, background: dimVar, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon width={18} height={18} style={{ color: colorVar }} />
        </div>
      </div>
      <p className="tabular" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.375rem' }}>{label}</p>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.125rem' }}>{sub}</p>
    </div>
  )
}

export default function Reports() {
  const [periodo, setPeriodo] = useState('mensual')
  const [fechaInicio, fechaFin] = useMemo(() => obtenerRango(periodo), [periodo])

  const { usuario } = useAuth()
  const esMedico = usuario?.rol === 'medico'
  const medicoId = usuario?.id || ''
  const filtroMedico = esMedico && medicoId ? `medico = "${medicoId}" && ` : ''
  const filtroDxMedico = esMedico && medicoId ? `consulta.medico = "${medicoId}" && ` : ''

  const { datos: pacientes } = useColeccion('pacientes', { filtro: 'activo = true', porPagina: 500 })
  const { datos: consultas } = useColeccion('consultas', {
    filtro: `${filtroMedico}estado = "completada" && fecha >= "${fechaInicio}" && fecha <= "${fechaFin}"`,
    porPagina: 500, expandir: 'medico,paciente',
  })
  const { datos: diagnosticos } = useColeccion('diagnosticos', {
    filtro: `${filtroDxMedico}created >= "${fechaInicio}" && created <= "${fechaFin}"`, porPagina: 500,
  })
  const { datos: citas } = useColeccion('citas', {
    filtro: `${filtroMedico}fecha_hora >= "${fechaInicio}" && fecha_hora <= "${fechaFin}"`, porPagina: 500,
  })

  const citasCompletadas = citas.filter(c => c.estado === 'completada').length
  const ocupacion = citas.length > 0 ? Math.round((citasCompletadas / citas.length) * 100) : 0
  const periodoLabel = PERIODOS.find(p => p.valor === periodo)?.etiqueta.toLowerCase() || ''

  const topDiagnosticos = useMemo(() => {
    const conteo = {}
    diagnosticos.forEach(d => { const k = `${d.codigo_cie10} — ${d.descripcion}`; conteo[k] = (conteo[k] || 0) + 1 })
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([nombre, casos]) => ({ nombre, casos }))
  }, [diagnosticos])

  const piramide = useMemo(() => {
    const grupos = [
      { rango: '0-19', min: 0, max: 19 }, { rango: '20-39', min: 20, max: 39 },
      { rango: '40-59', min: 40, max: 59 }, { rango: '60-79', min: 60, max: 79 }, { rango: '80+', min: 80, max: 999 },
    ]
    const hoy = new Date()
    return grupos.map(({ rango, min, max }) => {
      let hombres = 0, mujeres = 0
      pacientes.forEach(p => {
        if (!p.fecha_nacimiento) return
        const edad = hoy.getFullYear() - new Date(p.fecha_nacimiento).getFullYear()
        if (edad < min || edad > max) return
        if (p.sexo === 'masculino') hombres++; else if (p.sexo === 'femenino') mujeres++
      })
      return { rango, hombres: -hombres, mujeres }
    })
  }, [pacientes])

  const edadMedia = useMemo(() => {
    const hoy = new Date()
    const edades = pacientes.filter(p => p.fecha_nacimiento).map(p => hoy.getFullYear() - new Date(p.fecha_nacimiento).getFullYear())
    return edades.length === 0 ? 0 : Math.round(edades.reduce((a, b) => a + b, 0) / edades.length)
  }, [pacientes])

  const ratioFM = useMemo(() => {
    const f = pacientes.filter(p => p.sexo === 'femenino').length
    const m = pacientes.filter(p => p.sexo === 'masculino').length
    return m === 0 ? '—' : (f / m).toFixed(1) + ' : 1'
  }, [pacientes])

  const consultasPorEsp = useMemo(() => {
    const conteo = {}
    consultas.forEach(c => { const esp = c.expand?.medico?.especialidad || 'General'; conteo[esp] = (conteo[esp] || 0) + 1 })
    return Object.entries(conteo).map(([name, value]) => ({ name, value }))
  }, [consultas])

  const actividadReciente = useMemo(() =>
    [...consultas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 8), [consultas])

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="anim-fade">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Reportes y Estadísticas</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>Monitoreo global de la actividad clínica y demográfica</p>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {PERIODOS.map(p => (
            <button key={p.valor} onClick={() => setPeriodo(p.valor)}
              className={p.valor === periodo ? 'btn btn-primary' : 'btn btn-outline'}
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        <StatCard label="Consultas Completadas" value={consultas.length} sub={`período ${periodoLabel}`} Icon={I.Stethoscope} colorVar="var(--accent)" dimVar="var(--accent-dim)" />
        <StatCard label="Total Pacientes"        value={pacientes.length} sub="activos en el sistema" Icon={I.Patients} colorVar="var(--ok)" dimVar="var(--ok-dim)" />
        <StatCard label="Diagnósticos"           value={diagnosticos.length} sub={`período ${periodoLabel}`} Icon={I.Clipboard} colorVar="var(--violet)" dimVar="var(--violet-dim)" />
        <StatCard label="Ocupación de Citas"     value={`${ocupacion}%`} sub={ocupacion >= 90 ? 'Meta alcanzada' : 'Meta: 90%'} Icon={I.Calendar}
          colorVar={ocupacion >= 90 ? 'var(--ok)' : 'var(--warn)'} dimVar={ocupacion >= 90 ? 'var(--ok-dim)' : 'var(--warn-dim)'} />
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* Top diagnósticos */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <I.Activity width={15} height={15} style={{ color: 'var(--text-3)' }} />
            <div>
              <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Top Diagnósticos (CIE-10)</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Frecuencia por código diagnóstico</p>
            </div>
          </div>
          {topDiagnosticos.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-3)' }}>
              <I.Activity width={32} height={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>Sin datos aún</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>Se mostrarán al registrar consultas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {topDiagnosticos.map((dx, i) => {
                const pct = Math.round((dx.casos / topDiagnosticos[0].casos) * 100)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <span className="tabular" style={{ fontSize: '0.6875rem', color: 'var(--text-3)', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.5rem' }}>{dx.nombre}</span>
                        <span className="tabular" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', flexShrink: 0 }}>{dx.casos}</span>
                      </div>
                      <div style={{ width: '100%', background: 'var(--bg-inset)', borderRadius: 'var(--radius-full)', height: 5 }}>
                        <div style={{ width: `${pct}%`, height: 5, background: CHART_HEX[i % CHART_HEX.length], borderRadius: 'var(--radius-full)', transition: 'width 0.5s var(--ease-out)' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pirámide poblacional */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Pirámide Poblacional</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Distribución por edad y sexo</p>
          </div>
          {pacientes.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-3)' }}>
              <I.Patients width={32} height={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>Sin pacientes registrados</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={piramide} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tickFormatter={v => Math.abs(v)} tick={{ fontSize: 10, fill: 'var(--text-3)' }} />
                  <YAxis dataKey="rango" type="category" tick={{ fontSize: 11, fill: 'var(--text-3)' }} width={35} />
                  <Tooltip formatter={(value, name) => [Math.abs(value), name === 'hombres' ? 'Hombres' : 'Mujeres']} />
                  <Bar dataKey="hombres" fill="#3b82f6" name="hombres" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="mujeres" fill="#db2777" name="mujeres" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                {[['#3b82f6','Hombres'],['#db2777','Mujeres']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: c }} /> {l}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                {[['Edad Media', `${edadMedia} años`], ['Ratio F:M', ratioFM]].map(([l, v]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.625rem', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{l}</p>
                    <p className="tabular" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{v}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── By specialty ───────────────────────────────────────────── */}
      {consultasPorEsp.length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)', marginBottom: '1rem' }}>Consultas por Especialidad</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={consultasPorEsp} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                  {consultasPorEsp.map((_, i) => <Cell key={i} fill={CHART_HEX[i % CHART_HEX.length]} />)}
                </Pie>
                <Tooltip formatter={v => [`${v} consultas`]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {consultasPorEsp.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 'var(--radius-full)', flexShrink: 0, background: CHART_HEX[i % CHART_HEX.length] }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-2)', flex: 1 }}>{item.name}</span>
                  <span className="tabular" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent activity ────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Actividad de Consultas Recientes</h2>
        </div>
        {actividadReciente.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--text-3)' }}>
            <I.Stethoscope width={36} height={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.875rem' }}>Sin consultas registradas aún</p>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Fecha / Hora', 'Paciente', 'Especialidad', 'Médico', 'Estado'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1.25rem', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actividadReciente.map(c => {
                const pac = c.expand?.paciente
                const med = c.expand?.medico
                return (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-2)' }}>{formatearFecha(c.fecha)}</td>
                    <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600, color: 'var(--text)' }}>{pac ? `${pac.nombre} ${pac.apellidos}` : '—'}</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-2)' }}>{med?.especialidad || 'Medicina General'}</td>
                    <td style={{ padding: '0.75rem 1.25rem', color: 'var(--text-2)' }}>{med ? `Dr. ${med.nombre} ${med.apellidos}` : '—'}</td>
                    <td style={{ padding: '0.75rem 1.25rem' }}>
                      <span className={c.estado === 'completada' ? 'badge badge-ok' : 'badge badge-warn'}>
                        {c.estado === 'completada' ? 'Completada' : 'Borrador'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
