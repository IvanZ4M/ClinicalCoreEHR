import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'
import { I } from '../components/icons'

const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
               'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ESTADO_COLOR = {
  programada:  { bg: 'var(--accent-dim)',            text: 'var(--accent)',       border: 'var(--accent)' },
  confirmada:  { bg: 'var(--ok-dim)',                text: 'var(--ok)',           border: 'var(--ok)' },
  en_sala:     { bg: 'var(--warn-dim)',              text: 'var(--warn)',         border: 'var(--warn)' },
  en_consulta: { bg: 'var(--violet-dim)',            text: 'var(--violet)',       border: 'var(--violet)' },
  completada:  { bg: 'var(--bg-subtle)',             text: 'var(--text-3)',       border: 'var(--border)' },
  cancelada:   { bg: 'var(--danger-dim)',            text: 'var(--danger)',       border: 'var(--danger)' },
  no_acudio:   { bg: 'oklch(62% 0.18 50 / 0.12)',   text: 'oklch(52% 0.22 50)', border: 'oklch(52% 0.22 50)' },
}
const ESTADO_LABEL = {
  programada:  'Programada',
  confirmada:  'Confirmada',
  en_sala:     'En sala',
  en_consulta: 'En consulta',
  completada:  'Completada',
  cancelada:   'Cancelada',
  no_acudio:   'No acudió',
}
const TIPOS_CITA = [
  { valor: 'consulta_general', etiqueta: 'Consulta General' },
  { valor: 'seguimiento',      etiqueta: 'Seguimiento' },
  { valor: 'urgencia',         etiqueta: 'Urgencia' },
  { valor: 'revision',         etiqueta: 'Revisión' },
  { valor: 'chequeo',          etiqueta: 'Chequeo de Rutina' },
]

const TRANSICIONES = {
  programada: {
    recepcionista: [
      { estado: 'confirmada', label: 'Confirmar llegada', color: 'var(--ok)',          destructivo: false },
      { estado: 'no_acudio',  label: 'No acudió',         color: 'oklch(52% 0.22 50)', destructivo: true  },
      { estado: 'cancelada',  label: 'Cancelar',          color: 'var(--danger)',       destructivo: true  },
    ],
    medico:        [{ estado: 'cancelada', label: 'Cancelar', color: 'var(--danger)', destructivo: true }],
    enfermera:     [],
    administrador: [],
  },
  confirmada: {
    recepcionista: [
      { estado: 'en_sala',   label: 'Llegó a sala', color: 'var(--warn)',          destructivo: false },
      { estado: 'no_acudio', label: 'No acudió',    color: 'oklch(52% 0.22 50)',   destructivo: true  },
      { estado: 'cancelada', label: 'Cancelar',     color: 'var(--danger)',         destructivo: true  },
    ],
    enfermera:     [{ estado: 'en_sala',   label: 'Llegó a sala', color: 'var(--warn)',    destructivo: false }],
    medico:        [{ estado: 'cancelada', label: 'Cancelar',     color: 'var(--danger)',  destructivo: true  }],
    administrador: [],
  },
  en_sala: {
    recepcionista: [{ estado: 'cancelada',   label: 'Cancelar',        color: 'var(--danger)',  destructivo: true  }],
    enfermera:     [{ estado: 'en_consulta', label: 'Derivar a médico', color: 'var(--violet)', destructivo: false }],
    medico: [
      { estado: 'en_consulta', label: 'Iniciar consulta', color: 'var(--violet)', destructivo: false, accion: 'navegar_consulta' },
      { estado: 'cancelada',   label: 'Cancelar',         color: 'var(--danger)', destructivo: true  },
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

function formatearHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function obtenerDiasDelMes(anio, mes) {
  const primerDia = new Date(anio, mes, 1).getDay()
  const totalDias = new Date(anio, mes + 1, 0).getDate()
  const celdas = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= totalDias; d++) celdas.push(d)
  return celdas
}

export default function Appointments() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const hoy = new Date()
  const rol = usuario?.rol || 'medico'

  const [mesActual,             setMesActual]             = useState(hoy.getMonth())
  const [anioActual,            setAnioActual]            = useState(hoy.getFullYear())
  const [diaSeleccionado,       setDiaSeleccionado]       = useState(hoy.getDate())
  const [modalAbierto,          setModalAbierto]          = useState(false)
  const [guardando,             setGuardando]             = useState(false)
  const [errorForm,             setErrorForm]             = useState('')
  const [consultorioAutoFilled, setConsultorioAutoFilled] = useState(false)
  const [cargandoConsultorio,   setCargandoConsultorio]   = useState(false)

  const [form, setForm] = useState({
    paciente: '', medico: rol === 'medico' ? (usuario?.id || '') : '',
    fecha_hora: '', tipo: 'consulta_general',
    estado: 'programada', consultorio: '', notas: '',
  })

  const inicioMes = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-01 00:00:00`
  const ultimoDia = new Date(anioActual, mesActual + 1, 0).getDate()
  const finMes    = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${ultimoDia} 23:59:59`

  const { datos: citasMes, recargar } = useColeccion('citas', {
    filtro: `fecha_hora >= "${inicioMes}" && fecha_hora <= "${finMes}"`,
    orden: 'fecha_hora', expandir: 'paciente,medico',
  })
  const { datos: pacientes } = useColeccion('pacientes', { filtro: 'activo = true', orden: 'nombre' })
  const { datos: medicos }   = useColeccion('usuarios',  { filtro: 'rol = "medico" && activo = true', orden: 'nombre' })

  const citasDia = useMemo(() =>
    citasMes.filter(c => {
      if (!c.fecha_hora) return false
      const d = new Date(c.fecha_hora)
      return d.getDate() === diaSeleccionado && d.getMonth() === mesActual && d.getFullYear() === anioActual
    }), [citasMes, diaSeleccionado, mesActual, anioActual])

  const diasCalendario = obtenerDiasDelMes(anioActual, mesActual)

  const mesAnterior  = () => { if (mesActual === 0) { setMesActual(11); setAnioActual(a => a - 1) } else setMesActual(m => m - 1); setDiaSeleccionado(1) }
  const mesSiguiente = () => { if (mesActual === 11) { setMesActual(0); setAnioActual(a => a + 1) } else setMesActual(m => m + 1); setDiaSeleccionado(1) }
  const irAHoy = () => { setMesActual(hoy.getMonth()); setAnioActual(hoy.getFullYear()); setDiaSeleccionado(hoy.getDate()) }

  const handleMedicoChange = async (medicoId) => {
    setForm(f => ({ ...f, medico: medicoId, consultorio: '' }))
    setConsultorioAutoFilled(false)
    if (!medicoId) return
    setCargandoConsultorio(true)
    try {
      const med = await pb.collection('usuarios').getOne(medicoId)
      const nombreConsultorio = med.consultorio || ''
      setForm(f => ({ ...f, consultorio: nombreConsultorio }))
      setConsultorioAutoFilled(!!nombreConsultorio)
    } catch { /* fail silently — consultorio stays empty */ }
    finally { setCargandoConsultorio(false) }
  }

  const handleGuardar = async () => {
    if (!form.paciente || !form.fecha_hora || !form.medico) { setErrorForm('El paciente, la fecha/hora y el médico son obligatorios.'); return }
    setGuardando(true); setErrorForm('')
    try {
      const fechaFormateada = new Date(form.fecha_hora).toISOString().replace('T', ' ').slice(0, 19)
      await pb.collection('citas').create({
        paciente: form.paciente, medico: form.medico || usuario?.id,
        fecha_hora: fechaFormateada, tipo: form.tipo, estado: form.estado,
        consultorio: form.consultorio, notas: form.notas,
      })
      setModalAbierto(false)
      setForm({ paciente: '', medico: rol === 'medico' ? (usuario?.id || '') : '', fecha_hora: '', tipo: 'consulta_general', estado: 'programada', consultorio: '', notas: '' })
      setConsultorioAutoFilled(false)
      recargar()
    } catch (err) {
      setErrorForm('Error al guardar: ' + (err.data?.message || err.message))
    } finally { setGuardando(false) }
  }

  const cambiarEstado = async (citaId, nuevoEstado) => {
    try { await pb.collection('citas').update(citaId, { estado: nuevoEstado }); recargar() }
    catch (err) { console.error('Error al cambiar estado:', err) }
  }

  const cerrarModal = () => { setModalAbierto(false); setErrorForm(''); setConsultorioAutoFilled(false) }

  const esHoy = (dia) => dia === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear()

  return (
    <div style={{ padding: '1.5rem', display: 'flex', gap: '1.25rem' }} className="anim-fade">

      {/* ── Calendar column ───────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Month header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <button onClick={mesAnterior} className="btn btn-ghost btn-icon" style={{ fontSize: '1.25rem', lineHeight: 1 }}>‹</button>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', minWidth: 220, textAlign: 'center' }}>
              {MESES[mesActual]} {anioActual}
            </h2>
            <button onClick={mesSiguiente} className="btn btn-ghost btn-icon" style={{ fontSize: '1.25rem', lineHeight: 1 }}>›</button>
            <button onClick={irAHoy} className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginLeft: '0.25rem' }}>Hoy</button>
          </div>
          <button onClick={() => setModalAbierto(true)} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
            <I.Plus width={14} height={14} /> Nueva Cita
          </button>
        </div>

        {/* Calendar grid */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--border)' }}>
            {DIAS.map(d => (
              <div key={d} style={{ padding: '0.75rem 0', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {d}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {diasCalendario.map((dia, idx) => {
              if (!dia) return <div key={`v-${idx}`} style={{ height: 76, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)' }} />

              const seleccionado = dia === diaSeleccionado
              const citasDelDia  = citasMes.filter(c => c.fecha_hora && new Date(c.fecha_hora).getDate() === dia)
              const col = ESTADO_COLOR[citasDelDia[0]?.estado] || ESTADO_COLOR.programada

              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionado(dia)}
                  style={{
                    height: 76, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)',
                    padding: '0.375rem', textAlign: 'left', cursor: 'pointer', background: 'none',
                    transition: 'background 0.1s',
                    outline: seleccionado ? '2px solid var(--accent)' : 'none',
                    outlineOffset: -2,
                    backgroundColor: seleccionado ? 'var(--accent-dim)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!seleccionado) e.currentTarget.style.backgroundColor = 'var(--bg-subtle)' }}
                  onMouseLeave={e => { if (!seleccionado) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <span style={{
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-full)', fontSize: '0.75rem', marginBottom: 2,
                    background: esHoy(dia) ? 'var(--accent)' : 'transparent',
                    color: esHoy(dia) ? 'white' : seleccionado ? 'var(--accent)' : 'var(--text)',
                    fontWeight: esHoy(dia) ? 700 : 500,
                  }}>
                    {dia}
                  </span>
                  {citasDelDia.length > 0 && (
                    <div style={{ fontSize: '0.625rem', padding: '1px 4px', borderRadius: 3, background: col.bg, color: col.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {citasDelDia.length === 1 ? formatearHora(citasDelDia[0].fecha_hora) : `${citasDelDia.length} citas`}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', marginTop: '0.75rem', padding: '0 0.25rem' }}>
          {Object.entries(ESTADO_LABEL).map(([key, label]) => {
            const col = ESTADO_COLOR[key]
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--text-2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 'var(--radius-full)', background: col.text }} />
                {label}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right column ──────────────────────────────────────────── */}
      <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Day agenda */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)' }}>
              {diaSeleccionado} de {MESES[mesActual]}
            </h3>
            <span className="badge badge-neutral">{citasDia.length} cita{citasDia.length !== 1 ? 's' : ''}</span>
          </div>

          {citasDia.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', color: 'var(--text-3)' }}>
              <I.Calendar width={28} height={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 500 }}>Sin citas este día</p>
              <button onClick={() => setModalAbierto(true)} style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                + Agregar cita
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: 400, overflowY: 'auto' }}>
              {[...citasDia].sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)).map(cita => {
                const pac = cita.expand?.paciente
                const col = ESTADO_COLOR[cita.estado] || ESTADO_COLOR.programada
                return (
                  <div key={cita.id} style={{ borderLeft: `3px solid ${col.border}`, borderRadius: `0 var(--radius-md) var(--radius-md) 0`, padding: '0.625rem', background: col.bg }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pac ? `${pac.nombre} ${pac.apellidos}` : 'Paciente'}
                        </p>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: 2 }}>
                          {formatearHora(cita.fecha_hora)} · {TIPOS_CITA.find(t => t.valor === cita.tipo)?.etiqueta || cita.tipo}
                        </p>
                        {cita.consultorio && <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>{cita.consultorio}</p>}
                      </div>
                      <span className="badge" style={{ fontSize: '0.625rem', background: col.bg, color: col.text, flexShrink: 0 }}>
                        {ESTADO_LABEL[cita.estado]}
                      </span>
                    </div>
                    <StatusQuickAction
                      cita={cita}
                      rol={rol}
                      onCambiar={cambiarEstado}
                      onNavegar={(citaId, pacienteId) => {
                        cambiarEstado(citaId, 'en_consulta')
                        navigate(`/consulta/nueva?paciente=${pacienteId}`)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Mini next-month preview */}
        <div className="card" style={{ padding: '1rem' }}>
          <h4 style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
            {MESES[mesActual === 11 ? 0 : mesActual + 1]} {mesActual === 11 ? anioActual + 1 : anioActual}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, textAlign: 'center' }}>
            {DIAS.map(d => <div key={d} style={{ fontSize: '0.5625rem', color: 'var(--text-3)', paddingBottom: 4 }}>{d[0]}</div>)}
            {obtenerDiasDelMes(mesActual === 11 ? anioActual + 1 : anioActual, mesActual === 11 ? 0 : mesActual + 1)
              .map((dia, idx) => (
                <div key={idx} style={{ fontSize: '0.6875rem', padding: '2px 0', borderRadius: 3, color: dia ? 'var(--text-2)' : 'transparent' }}>
                  {dia || ''}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ── Modal: Nueva Cita ─────────────────────────────────────── */}
      {modalAbierto && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card anim-scale-in" style={{ width: '100%', maxWidth: 500 }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I.Calendar width={14} height={14} style={{ color: 'var(--accent)' }} />
                </div>
                <h2 style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Nueva Cita</h2>
              </div>
              <button onClick={cerrarModal} className="btn btn-ghost btn-icon">
                <I.X width={16} height={16} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <MSelect label="Paciente *" value={form.paciente} onChange={v => setForm(f => ({ ...f, paciente: v }))}>
                <option value="">Seleccionar paciente...</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.apellidos}</option>)}
              </MSelect>

              <MSelect label="Médico asignado" value={form.medico} onChange={handleMedicoChange}>
                <option value="">Sin asignar</option>
                {medicos.map(m => <option key={m.id} value={m.id}>Dr. {m.nombre} {m.apellidos}</option>)}
              </MSelect>

              <MInput label="Fecha y hora *" type="datetime-local" value={form.fecha_hora} onChange={v => setForm(f => ({ ...f, fecha_hora: v }))} />

              <MSelect label="Tipo de consulta" value={form.tipo} onChange={v => setForm(f => ({ ...f, tipo: v }))}>
                {TIPOS_CITA.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
              </MSelect>

              {/* Consultorio con autofill desde el médico */}
              <div>
                <label className="field-label">Consultorio</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={cargandoConsultorio ? 'Buscando...' : form.consultorio}
                    onChange={e => { setForm(f => ({ ...f, consultorio: e.target.value })); setConsultorioAutoFilled(false) }}
                    placeholder="Ej: Consultorio 1, Sala A..."
                    className="input"
                    readOnly={consultorioAutoFilled || cargandoConsultorio}
                    style={{
                      paddingRight: consultorioAutoFilled ? '2.25rem' : undefined,
                      background: consultorioAutoFilled ? 'var(--bg-inset)' : undefined,
                    }}
                  />
                  {consultorioAutoFilled && (
                    <div style={{ position: 'absolute', right: '0.625rem', top: '50%', transform: 'translateY(-50%)' }}>
                      <I.Check width={12} height={12} style={{ color: 'var(--ok)' }} />
                    </div>
                  )}
                </div>
                {consultorioAutoFilled && (
                  <button
                    type="button"
                    onClick={() => { setConsultorioAutoFilled(false); setForm(f => ({ ...f, consultorio: '' })) }}
                    style={{ fontSize: '0.6875rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginTop: 2 }}
                  >
                    Cambiar manualmente
                  </button>
                )}
                {form.medico && !cargandoConsultorio && !consultorioAutoFilled && !form.consultorio && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--warn)', marginTop: 2 }}>
                    El médico no tiene consultorio asignado
                  </p>
                )}
              </div>

              <div>
                <label className="field-label">Notas adicionales</label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  rows={2}
                  placeholder="Indicaciones previas, motivo de la cita..."
                  className="input"
                  style={{ resize: 'none' }}
                />
              </div>

              {errorForm && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>
                  <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} /> {errorForm}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
              <button onClick={cerrarModal} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                {guardando ? 'Guardando...' : 'Guardar Cita'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusQuickAction({ cita, rol, onCambiar, onNavegar }) {
  const [pendienteConf, setPendienteConf] = useState(null)
  const acciones = TRANSICIONES[cita.estado]?.[rol] ?? []
  if (acciones.length === 0) return null

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.375rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
      {pendienteConf ? (
        <>
          <p style={{ fontSize: '0.6875rem', color: 'var(--text-2)', flex: '1 1 100%' }}>
            ¿Confirmar: <strong>{pendienteConf.label}</strong>?
          </p>
          <button
            onClick={() => {
              if (pendienteConf.accion === 'navegar_consulta') {
                onNavegar(cita.id, cita.paciente)
              } else {
                onCambiar(cita.id, pendienteConf.estado)
              }
              setPendienteConf(null)
            }}
            style={{ fontSize: '0.6875rem', fontWeight: 600, color: pendienteConf.color, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sí, confirmar
          </button>
          <button
            onClick={() => setPendienteConf(null)}
            style={{ fontSize: '0.6875rem', color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            No
          </button>
        </>
      ) : (
        acciones.map(accion => (
          <button
            key={accion.estado}
            onClick={() => {
              if (accion.destructivo) {
                setPendienteConf(accion)
              } else if (accion.accion === 'navegar_consulta') {
                onNavegar(cita.id, cita.paciente)
              } else {
                onCambiar(cita.id, accion.estado)
              }
            }}
            style={{ fontSize: '0.6875rem', fontWeight: accion.destructivo ? 500 : 600, color: accion.color, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {accion.label}
          </button>
        ))
      )}
    </div>
  )
}

function MInput({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  )
}

function MSelect({ label, value, onChange, children }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="input">{children}</select>
    </div>
  )
}
