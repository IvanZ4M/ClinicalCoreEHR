import { memo } from 'react'
import { I } from './icons'

const TIPO_CITA_LABEL = {
  consulta_general: 'Consulta General',
  seguimiento:      'Seguimiento',
  urgencia:         'Urgencia',
  revision:         'Revisión',
  chequeo:          'Chequeo',
}

const TIPO_CITA_STYLE = {
  consulta_general: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  seguimiento:      { background: 'var(--ok-dim)',     color: 'var(--ok)' },
  urgencia:         { background: 'var(--danger-dim)', color: 'var(--danger)' },
  revision:         { background: 'var(--warn-dim)',   color: 'var(--warn)' },
  chequeo:          { background: 'var(--bg-subtle)',  color: 'var(--text-3)' },
}

function formatearFechaHora(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function SeccionHeader({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.625rem' }}>
      {icon}
      <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
    </div>
  )
}

function SVitales({ label, valor, unidad }) {
  if (!valor) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem', gap: 2 }}>
      <span style={{ fontSize: '0.5625rem', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span className="tabular" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text)' }}>
        {valor}
        {unidad && <span style={{ fontSize: '0.625rem', color: 'var(--text-3)', fontWeight: 400, marginLeft: 2 }}>{unidad}</span>}
      </span>
    </div>
  )
}

const ConsultaPreviaCard = memo(function ConsultaPreviaCard({
  consulta,
  diagnosticos,
  receta,
  triage,
  expandido,
  onToggle,
}) {
  const sv = (() => {
    try {
      const raw = consulta.signos_vitales
      return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null
    } catch { return null }
  })()

  const medicamentos = (() => {
    try {
      const raw = receta?.medicamentos
      if (!raw) return []
      return typeof raw === 'string' ? JSON.parse(raw) : raw
    } catch { return [] }
  })()

  const principal    = diagnosticos.find(d => d.tipo === 'principal')
  const tipo         = consulta.expand?.cita?.tipo
  const tipoStyle    = TIPO_CITA_STYLE[tipo] || {}
  const triageNurse  = triage?.expand?.enfermera_id

  const imc = (sv?.peso && sv?.talla)
    ? (parseFloat(sv.peso) / ((parseFloat(sv.talla) / 100) ** 2)).toFixed(1)
    : null

  return (
    <div style={{ position: 'relative', paddingLeft: '2rem' }}>
      {/* Timeline dot */}
      <div style={{
        position: 'absolute', left: 0, top: '1.375rem',
        width: 12, height: 12, borderRadius: '50%', zIndex: 1,
        background: consulta.estado === 'completada' ? 'var(--ok)' : 'var(--warn)',
        border: '2.5px solid var(--bg)',
        boxShadow: '0 0 0 2px ' + (consulta.estado === 'completada' ? 'var(--ok)' : 'var(--warn)') + '33',
      }} />

      <div className="card" style={{ overflow: 'hidden' }}>

        {/* ── Header (always visible) ─────────────────────────────── */}
        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Meta chips */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                  {formatearFechaHora(consulta.fecha)}
                </span>
                {tipo && (
                  <span style={{ fontSize: '0.625rem', fontWeight: 600, padding: '1px 7px', borderRadius: 3, ...tipoStyle }}>
                    {TIPO_CITA_LABEL[tipo]}
                  </span>
                )}
                <span className={consulta.estado === 'completada' ? 'badge badge-ok' : 'badge badge-warn'} style={{ fontSize: '0.625rem' }}>
                  {consulta.estado === 'completada' ? 'Completada' : 'Borrador'}
                </span>
                {consulta.expand?.medico && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                    Dr. {consulta.expand.medico.nombre} {consulta.expand.medico.apellidos}
                  </span>
                )}
              </div>

              {/* Primary diagnosis (always visible) */}
              {principal ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {principal.codigo_cie10}
                  </span>
                  <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)' }}>
                    {principal.descripcion}
                  </span>
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', fontStyle: 'italic' }}>
                  {consulta.motivo || 'Sin diagnóstico registrado'}
                </p>
              )}
            </div>

            <button
              onClick={onToggle}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)',
                background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0,
                padding: '0.25rem 0',
              }}
            >
              {expandido ? 'Ocultar' : 'Ver detalle'}
              {expandido
                ? <I.ChevronUp   width={13} height={13} />
                : <I.ChevronDown width={13} height={13} />}
            </button>
          </div>
        </div>

        {/* ── Expandable body ─────────────────────────────────────── */}
        {expandido && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Signos vitales */}
            {sv && (
              <div>
                <SeccionHeader
                  icon={<I.Heart width={13} height={13} style={{ color: 'var(--danger)' }} />}
                  label="Signos Vitales"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '0.5rem' }}>
                  <SVitales label="P. Arterial"  valor={sv.presion_arterial}    unidad="mmHg" />
                  <SVitales label="Temperatura"  valor={sv.temperatura}         unidad="°C"   />
                  <SVitales label="F. Cardíaca"  valor={sv.frecuencia_cardiaca} unidad="lpm"  />
                  <SVitales label="SpO₂"         valor={sv.saturacion_o2}       unidad="%"    />
                  <SVitales label="Peso"         valor={sv.peso}                unidad="kg"   />
                  <SVitales label="Talla"        valor={sv.talla}               unidad="cm"   />
                  {imc && <SVitales label="IMC" valor={imc} unidad="kg/m²" />}
                </div>
              </div>
            )}

            {/* Motivo y exploración */}
            {(consulta.motivo || consulta.exploracion_fisica) && (
              <div>
                <SeccionHeader
                  icon={<I.Clipboard width={13} height={13} style={{ color: 'var(--text-3)' }} />}
                  label="Motivo y Exploración"
                />
                {consulta.motivo && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>Motivo: </span>
                    {consulta.motivo}
                  </p>
                )}
                {consulta.exploracion_fisica && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-3)' }}>Exploración: </span>
                    {consulta.exploracion_fisica}
                  </p>
                )}
              </div>
            )}

            {/* Diagnósticos */}
            {diagnosticos.length > 0 && (
              <div>
                <SeccionHeader
                  icon={<I.Stethoscope width={13} height={13} style={{ color: 'var(--text-3)' }} />}
                  label="Diagnósticos"
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {diagnosticos.map(dx => (
                    <div key={dx.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <span className="mono" style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                        {dx.codigo_cie10}
                      </span>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text)', flex: 1 }}>
                        {dx.descripcion}
                      </span>
                      <span style={{ fontSize: '0.625rem', color: 'var(--text-3)', textTransform: 'capitalize', flexShrink: 0 }}>
                        {dx.tipo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medicamentos */}
            {medicamentos.length > 0 && (
              <div>
                <SeccionHeader
                  icon={<I.Pill width={13} height={13} style={{ color: 'var(--text-3)' }} />}
                  label="Medicamentos Prescritos"
                />
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {medicamentos.map((med, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.8125rem', color: 'var(--text-2)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
                      <span>
                        <strong style={{ color: 'var(--text)' }}>{med.nombre}</strong>
                        {med.dosis      && ` ${med.dosis}`}
                        {med.frecuencia && ` — ${med.frecuencia}`}
                        {med.duracion   && ` por ${med.duracion}`}
                        {med.indicaciones && (
                          <em style={{ color: 'var(--text-3)', fontStyle: 'normal' }}> ({med.indicaciones})</em>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Plan y tratamiento */}
            {consulta.plan_tratamiento && (
              <div>
                <SeccionHeader
                  icon={<I.Clipboard width={13} height={13} style={{ color: 'var(--text-3)' }} />}
                  label="Plan y Tratamiento"
                />
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {consulta.plan_tratamiento}
                </p>
              </div>
            )}

            {/* Valoración enfermería */}
            {triage && (
              <div style={{ background: 'var(--ok-dim)', border: '1px solid var(--ok)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <SeccionHeader
                  icon={<I.Activity width={13} height={13} style={{ color: 'var(--ok)' }} />}
                  label="Valoración de Enfermería"
                />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.375rem', marginBottom: triage.queja_principal ? '0.625rem' : 0 }}>
                  {triage.presion_arterial   && <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>PA: {triage.presion_arterial}</span>}
                  {triage.temperatura        && <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>Temp: {triage.temperatura}°C</span>}
                  {triage.frecuencia_cardiaca && <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>FC: {triage.frecuencia_cardiaca} lpm</span>}
                  {triage.saturacion_oxigeno && <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>SpO₂: {triage.saturacion_oxigeno}%</span>}
                  {triage.peso               && <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>Peso: {triage.peso} kg</span>}
                </div>
                {triage.queja_principal && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: '0.375rem' }}>
                    <strong>Queja: </strong>{triage.queja_principal}
                  </p>
                )}
                {triageNurse && (
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-3)' }}>
                    Registrado por: Enf. {triageNurse.nombre} {triageNurse.apellidos}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default ConsultaPreviaCard
