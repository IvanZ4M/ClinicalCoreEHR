import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import pb from '../lib/pb'
import ConsultaPreviaCard from './ConsultaPreviaCard'
import { I } from './icons'

const POR_PAGINA = 10

export default function ConsultasPrevias({ pacienteId }) {
  const navigate = useNavigate()

  const [pagina,        setPagina]        = useState(1)
  const [totalPaginas,  setTotalPaginas]  = useState(1)
  const [totalItems,    setTotalItems]    = useState(0)
  const [anoFiltro,     setAnoFiltro]     = useState('todos')
  const [anos,          setAnos]          = useState([])
  const [consultas,     setConsultas]     = useState([])
  const [dxPorConsulta,  setDxPC]         = useState({}) // consultaId → diagnosticos[]
  const [recPorConsulta, setRecPC]        = useState({}) // consultaId → receta
  const [trPorConsulta,  setTrPC]         = useState({}) // consultaId → triage
  const [expandidos,    setExpandidos]    = useState(new Set())
  const [cargando,      setCargando]      = useState(true)

  // Load available years once
  useEffect(() => {
    if (!pacienteId) return
    pb.collection('consultas').getList(1, 200, {
      filter: `paciente = "${pacienteId}"`,
      sort: '-fecha',
    }).then(r => {
      const set = new Set(r.items.map(c => new Date(c.fecha).getFullYear()))
      setAnos([...set].sort((a, b) => b - a))
    }).catch(() => {})
  }, [pacienteId])

  const cargar = useCallback(async () => {
    if (!pacienteId) return
    setCargando(true)
    try {
      const filtroAno = anoFiltro !== 'todos'
        ? ` && fecha >= "${anoFiltro}-01-01 00:00:00" && fecha <= "${anoFiltro}-12-31 23:59:59"`
        : ''
      const r = await pb.collection('consultas').getList(pagina, POR_PAGINA, {
        filter: `paciente = "${pacienteId}"` + filtroAno,
        sort: '-fecha',
        expand: 'medico,cita',
      })
      setConsultas(r.items)
      setTotalPaginas(r.totalPages)
      setTotalItems(r.totalItems)

      // Auto-expand first item on first page only
      if (r.items.length > 0) {
        setExpandidos(prev => {
          if (prev.size === 0) return new Set([r.items[0].id])
          return prev
        })
      }

      if (r.items.length === 0) return

      const ids = r.items.map(c => c.id)
      const citaIds = r.items.filter(c => c.cita).map(c => c.cita)

      const [dxR, recR, trR] = await Promise.all([
        pb.collection('diagnosticos').getList(1, 200, {
          filter: ids.map(id => `consulta = "${id}"`).join(' || '),
          sort: 'tipo',
        }).catch(() => ({ items: [] })),
        pb.collection('recetas').getList(1, 200, {
          filter: ids.map(id => `consulta = "${id}"`).join(' || '),
        }).catch(() => ({ items: [] })),
        citaIds.length > 0
          ? pb.collection('triage').getList(1, 100, {
              filter: citaIds.map(id => `cita_id = "${id}"`).join(' || '),
              expand: 'enfermera_id',
            }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] }),
      ])

      const dxMap = {}
      dxR.items.forEach(dx => {
        if (!dxMap[dx.consulta]) dxMap[dx.consulta] = []
        dxMap[dx.consulta].push(dx)
      })

      const recMap = {}
      recR.items.forEach(rec => { recMap[rec.consulta] = rec })

      const trMap = {}
      trR.items.forEach(tr => {
        const c = r.items.find(cx => cx.cita === tr.cita_id)
        if (c) trMap[c.id] = tr
      })

      setDxPC(dxMap)
      setRecPC(recMap)
      setTrPC(trMap)
    } finally {
      setCargando(false)
    }
  }, [pacienteId, pagina, anoFiltro])

  useEffect(() => { cargar() }, [cargar])

  const toggle = useCallback((id) => {
    setExpandidos(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const expandirTodas  = () => setExpandidos(new Set(consultas.map(c => c.id)))
  const colapsarTodas  = () => setExpandidos(new Set())

  const handleAno = (ano) => { setAnoFiltro(ano); setPagina(1); setExpandidos(new Set()) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Controls bar ──────────────────────────────────────────── */}
      <div className="card" style={{ padding: '0.75rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>
              {totalItems} consulta{totalItems !== 1 ? 's' : ''}
            </span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <button onClick={expandirTodas} style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Expandir todas
            </button>
            <button onClick={colapsarTodas} style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              Colapsar todas
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {anos.length > 1 && (
              <select
                value={anoFiltro}
                onChange={e => handleAno(e.target.value)}
                className="input"
                style={{ height: 32, padding: '0 0.5rem', fontSize: '0.75rem', width: 'auto' }}
              >
                <option value="todos">Todos los años</option>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            )}
            <button
              onClick={() => navigate(`/consulta/nueva?paciente=${pacienteId}`)}
              className="btn btn-primary"
              style={{ fontSize: '0.8125rem' }}
            >
              <I.Plus width={13} height={13} /> Nueva Consulta
            </button>
          </div>
        </div>
      </div>

      {/* ── Timeline ──────────────────────────────────────────────── */}
      {cargando ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3rem', color: 'var(--text-3)' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="anim-spin" />
          Cargando consultas…
        </div>
      ) : consultas.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3.5rem 1rem', color: 'var(--text-3)' }}>
          <I.Stethoscope width={36} height={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
          <p style={{ fontSize: '0.875rem' }}>
            Sin consultas{anoFiltro !== 'todos' ? ` en ${anoFiltro}` : ''}
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Vertical connecting line */}
          <div style={{
            position: 'absolute',
            left: '0.3125rem', top: '1.5rem', bottom: '1.5rem',
            width: 2, background: 'var(--border)',
            borderRadius: 1,
          }} />
          {consultas.map(c => (
            <ConsultaPreviaCard
              key={c.id}
              consulta={c}
              diagnosticos={dxPorConsulta[c.id]  || []}
              receta={recPorConsulta[c.id]        || null}
              triage={trPorConsulta[c.id]         || null}
              expandido={expandidos.has(c.id)}
              onToggle={() => toggle(c.id)}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────────────── */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '0.5rem' }}>
          <button
            onClick={() => { setPagina(p => p - 1); setExpandidos(new Set()) }}
            disabled={pagina === 1}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.875rem' }}
          >
            ‹ Anterior
          </button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
            {pagina} / {totalPaginas}
          </span>
          <button
            onClick={() => { setPagina(p => p + 1); setExpandidos(new Set()) }}
            disabled={pagina === totalPaginas}
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.875rem' }}
          >
            Siguiente ›
          </button>
        </div>
      )}
    </div>
  )
}
