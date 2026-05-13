import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRegistro, useColeccion } from '../hooks/usePocketBase'
import { useAuth } from '../context/AuthContext'
import pb from '../lib/pb'
import { I } from '../components/icons'

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const hoy = new Date()
  const nac = new Date(fechaNacimiento)
  let e = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() - nac.getMonth() === 0 && hoy.getDate() < nac.getDate())) e--
  return e
}

function categoriaIMC(v) {
  const n = parseFloat(v)
  if (!n) return null
  if (n < 18.5) return { label: 'Bajo peso',  color: 'var(--warn)' }
  if (n < 25)   return { label: 'Normal',      color: 'var(--ok)' }
  if (n < 30)   return { label: 'Sobrepeso',   color: 'var(--warn)' }
  return          { label: 'Obesidad',    color: 'var(--danger)' }
}

const TIPO_LABEL = {
  consulta_general: 'Consulta General', seguimiento: 'Seguimiento',
  urgencia: 'Urgencia', revision: 'Revisión', chequeo: 'Chequeo',
}

const FORM_VACIO = {
  presion_arterial: '', temperatura: '', frecuencia_cardiaca: '',
  frecuencia_respiratoria: '', saturacion_oxigeno: '',
  peso: '', talla: '',
  queja_principal: '', antecedentes_actualizados: '', notas_enfermeria: '',
}

export default function EnfermeriaValoracion() {
  const { citaId }  = useParams()
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  const { dato: cita,     cargando: cargCita }    = useRegistro('citas',    citaId, 'paciente,medico')
  const { datos: consultas }                       = useColeccion('consultas', {
    filtro:  cita ? `paciente = "${cita.paciente}" && estado = "completada"` : '',
    orden:   '-created', porPagina: 1,
  })

  const [form,       setForm]       = useState(FORM_VACIO)
  const [guardando,  setGuardando]  = useState(false)
  const [error,      setError]      = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const paciente  = cita?.expand?.paciente
  const medico    = cita?.expand?.medico
  const ultimaCx  = consultas[0]
  const ultimosSV = (() => { try { return JSON.parse(ultimaCx?.signos_vitales || '{}') } catch { return {} } })()

  const imc = (() => {
    const p = parseFloat(form.peso), t = parseFloat(form.talla)
    return (p > 0 && t > 0) ? (p / ((t / 100) ** 2)).toFixed(1) : null
  })()

  const campoReq = !form.presion_arterial || !form.temperatura || !form.frecuencia_cardiaca || !form.queja_principal

  const handleGuardar = async () => {
    if (campoReq) {
      setError('Completa los campos requeridos: presión arterial, temperatura, frecuencia cardíaca y queja principal.')
      return
    }
    setGuardando(true); setError('')
    try {
      await pb.collection('triage').create({
        cita_id:                  citaId,
        paciente_id:              cita.paciente,
        enfermera_id:             usuario?.id,
        presion_arterial:         form.presion_arterial,
        temperatura:              parseFloat(form.temperatura)            || null,
        frecuencia_cardiaca:      parseInt(form.frecuencia_cardiaca)      || null,
        frecuencia_respiratoria:  parseInt(form.frecuencia_respiratoria)  || null,
        saturacion_oxigeno:       parseFloat(form.saturacion_oxigeno)     || null,
        peso:                     parseFloat(form.peso)                   || null,
        talla:                    parseFloat(form.talla)                  || null,
        queja_principal:          form.queja_principal,
        antecedentes_actualizados: form.antecedentes_actualizados,
        notas_enfermeria:         form.notas_enfermeria,
        estado:                   'completado',
      })
      await pb.collection('citas').update(citaId, { estado: 'en_consulta' })
      navigate('/enfermeria')
    } catch (err) {
      setError('Error al guardar: ' + (err.data?.message || err.message))
      setConfirmando(false)
    } finally { setGuardando(false) }
  }

  if (cargCita) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '0.75rem', color: 'var(--text-3)' }}>
        <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} className="anim-spin" />
        Cargando...
      </div>
    )
  }

  if (!cita) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-3)' }}>
        <p style={{ marginBottom: '1rem' }}>Cita no encontrada.</p>
        <button onClick={() => navigate('/enfermeria')} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
          <I.ChevronLeft width={14} height={14} /> Regresar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="anim-fade">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => navigate('/enfermeria')} className="btn btn-ghost btn-icon">
          <I.ChevronLeft width={16} height={16} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Valoración inicial de enfermería
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>
            {paciente ? `${paciente.nombre} ${paciente.apellidos}` : '—'} · {TIPO_LABEL[cita.tipo] || cita.tipo}
          </p>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Left: Patient summary (sticky) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>

          {/* Patient card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="avatar" style={{ width: 44, height: 44 }}>
                {`${paciente?.nombre?.[0] || ''}${paciente?.apellidos?.[0] || ''}`}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
                  {paciente ? `${paciente.nombre} ${paciente.apellidos}` : '—'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  {calcularEdad(paciente?.fecha_nacimiento) !== null ? `${calcularEdad(paciente?.fecha_nacimiento)} años` : '—'}
                  {paciente?.sexo ? ` · ${paciente.sexo}` : ''}
                </p>
              </div>
            </div>

            {/* Allergy alert */}
            {paciente?.alergias && (
              <div style={{
                background: 'var(--danger-dim)', border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)', padding: '0.625rem 0.75rem', marginBottom: '0.875rem',
              }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: 3 }}>
                  <I.Alert width={12} height={12} /> ALERGIAS CONOCIDAS
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--danger)', lineHeight: 1.4 }}>{paciente.alergias}</p>
              </div>
            )}

            <InfoFila label="Médico asignado" value={medico ? `Dr. ${medico.nombre} ${medico.apellidos}` : '—'} />
            {cita.consultorio && <InfoFila label="Consultorio" value={cita.consultorio} />}
            {cita.notas && <InfoFila label="Notas de cita" value={cita.notas} />}
          </div>

          {/* Last vitals reference */}
          {ultimaCx && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Signos de última consulta
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {ultimosSV.presion_arterial   && <InfoFila label="PA"   value={`${ultimosSV.presion_arterial} mmHg`} />}
                {ultimosSV.temperatura        && <InfoFila label="Temp" value={`${ultimosSV.temperatura} °C`}       />}
                {ultimosSV.frecuencia_cardiaca && <InfoFila label="FC"  value={`${ultimosSV.frecuencia_cardiaca} lpm`} />}
                {ultimosSV.peso               && <InfoFila label="Peso" value={`${ultimosSV.peso} kg`}              />}
                {ultimosSV.talla              && <InfoFila label="Talla" value={`${ultimosSV.talla} cm`}            />}
              </div>
              <p style={{ fontSize: '0.625rem', color: 'var(--text-3)', marginTop: '0.5rem' }}>
                {new Date(ultimaCx.created).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Antecedents */}
          {(paciente?.antecedentes_personales || paciente?.antecedentes_familiares) && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                Antecedentes
              </p>
              {paciente.antecedentes_personales && (
                <div style={{ marginBottom: '0.625rem' }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginBottom: 2 }}>Personales</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{paciente.antecedentes_personales}</p>
                </div>
              )}
              {paciente.antecedentes_familiares && (
                <div>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)', marginBottom: 2 }}>Familiares</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.5 }}>{paciente.antecedentes_familiares}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Triage form ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Signos vitales */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <I.Activity width={15} height={15} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Signos Vitales</h2>
              </div>
              <span style={{ fontSize: '0.6875rem', color: 'var(--danger)' }}>* requeridos</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <CampoSigno label="Presión Arterial *" value={form.presion_arterial}
                onChange={v => setForm(f => ({ ...f, presion_arterial: v }))}
                placeholder="120/80" unidad="mmHg" />
              <CampoSigno label="Temperatura *" value={form.temperatura}
                onChange={v => setForm(f => ({ ...f, temperatura: v }))}
                placeholder="36.5" unidad="°C" tipo="number" />
              <CampoSigno label="Frec. Cardíaca *" value={form.frecuencia_cardiaca}
                onChange={v => setForm(f => ({ ...f, frecuencia_cardiaca: v }))}
                placeholder="75" unidad="lpm" tipo="number" />
              <CampoSigno label="Frec. Respiratoria" value={form.frecuencia_respiratoria}
                onChange={v => setForm(f => ({ ...f, frecuencia_respiratoria: v }))}
                placeholder="16" unidad="rpm" tipo="number" />
              <CampoSigno label="SpO₂" value={form.saturacion_oxigeno}
                onChange={v => setForm(f => ({ ...f, saturacion_oxigeno: v }))}
                placeholder="98" unidad="%" tipo="number" />
            </div>
          </div>

          {/* Antropometría + IMC */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <I.User width={15} height={15} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Antropometría</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <CampoSigno label="Peso" value={form.peso}
                onChange={v => setForm(f => ({ ...f, peso: v }))}
                placeholder="70" unidad="kg" tipo="number" />
              <CampoSigno label="Talla" value={form.talla}
                onChange={v => setForm(f => ({ ...f, talla: v }))}
                placeholder="170" unidad="cm" tipo="number" />
              {/* IMC */}
              <div style={{
                background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '0.25rem',
              }}>
                <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>IMC</p>
                {imc ? (
                  <>
                    <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{imc}</p>
                    <p style={{ fontSize: '0.6875rem', fontWeight: 600, color: categoriaIMC(imc)?.color }}>{categoriaIMC(imc)?.label}</p>
                  </>
                ) : (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)' }}>—</p>
                )}
              </div>
            </div>
          </div>

          {/* Valoración clínica */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <I.Clipboard width={15} height={15} style={{ color: 'var(--accent)' }} />
              <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>Valoración Clínica</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="field-label">Queja principal *</label>
                <textarea
                  value={form.queja_principal}
                  onChange={e => setForm(f => ({ ...f, queja_principal: e.target.value }))}
                  rows={3}
                  placeholder="Describa la queja o síntoma principal del paciente..."
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="field-label">Antecedentes actualizados</label>
                <textarea
                  value={form.antecedentes_actualizados}
                  onChange={e => setForm(f => ({ ...f, antecedentes_actualizados: e.target.value }))}
                  rows={2}
                  placeholder="Cambios desde la última visita (alergias nuevas, diagnósticos recientes...)..."
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div>
                <label className="field-label">Notas de enfermería</label>
                <textarea
                  value={form.notas_enfermeria}
                  onChange={e => setForm(f => ({ ...f, notas_enfermeria: e.target.value }))}
                  rows={2}
                  placeholder="Observaciones adicionales, estado general del paciente..."
                  className="input"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              background: 'var(--danger-dim)', border: '1px solid var(--danger)',
              borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
              color: 'var(--danger)', fontSize: '0.875rem',
            }}>
              <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
            </div>
          )}

          {/* Confirm / Actions */}
          {confirmando ? (
            <div className="card" style={{ padding: '1.25rem', border: '1px solid var(--warn)' }}>
              <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>
                ¿Finalizar la valoración?
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Se registrará la valoración y el estado de la cita cambiará a <strong>En consulta</strong>. El médico será notificado.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="btn btn-primary"
                  style={{ fontSize: '0.875rem', flex: 1 }}
                >
                  <I.Check width={14} height={14} />
                  {guardando ? 'Guardando...' : 'Confirmar y finalizar'}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  disabled={guardando}
                  className="btn btn-outline"
                  style={{ fontSize: '0.875rem' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => navigate('/enfermeria')} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                Cancelar
              </button>
              <button
                onClick={() => { if (campoReq) { setError('Completa los campos requeridos: presión arterial, temperatura, frecuencia cardíaca y queja principal.'); return } setConfirmando(true) }}
                className="btn btn-primary"
                style={{ fontSize: '0.875rem', minWidth: 200 }}
              >
                <I.Check width={14} height={14} /> Finalizar valoración
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CampoSigno({ label, value, onChange, placeholder, unidad, tipo = 'text' }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={tipo}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="input"
          inputMode={tipo === 'number' ? 'decimal' : 'text'}
          style={{ paddingRight: unidad ? '3rem' : undefined }}
        />
        {unidad && (
          <span style={{
            position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', pointerEvents: 'none',
          }}>
            {unidad}
          </span>
        )}
      </div>
    </div>
  )
}

function InfoFila({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', padding: '0.25rem 0' }}>
      <span style={{ fontSize: '0.6875rem', color: 'var(--text-3)', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
