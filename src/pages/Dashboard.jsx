import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useDashboardData } from '../hooks/useDashboardData'
import CitaCard from '../components/CitaCard'
import MetricCard from '../components/MetricCard'
import DiagnosticosFrecuentes from '../components/DiagnosticosFrecuentes'
import pb from '../lib/pb'
import { I } from '../components/icons'
import { safeAnimate, staggerContainer, listItem } from '../lib/animations'

function obtenerSaludo() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

function formatearFecha(date) {
  const s = date.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtHora(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

/* ── Empty / error / loading states for the agenda ──────────────────────── */

function AgendaVacia({ onNuevaCita }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', color: 'var(--text-3)', textAlign: 'center' }}>
      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.875rem', opacity: 0.35 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <p style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-2)', marginBottom: '0.25rem' }}>
        No hay citas programadas para hoy
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
        Puedes crear una nueva consulta directamente
      </p>
      <button onClick={onNuevaCita} className="btn btn-primary" style={{ fontSize: '0.8125rem' }}>
        <I.Plus width={14} height={14} /> Nueva consulta
      </button>
    </div>
  )
}

function AgendaError({ onReintentar }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem', color: 'var(--text-3)', gap: '0.75rem' }}>
      <I.Alert width={30} height={30} style={{ opacity: 0.35 }} />
      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-2)' }}>Error al cargar las citas</p>
      <button onClick={onReintentar} className="btn btn-outline" style={{ fontSize: '0.8125rem' }}>Reintentar</button>
    </div>
  )
}

function AgendaCargando() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
      {[1, 0.65, 0.4].map((op, i) => (
        <div key={i} style={{ height: 74, borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', opacity: op }} />
      ))}
    </div>
  )
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const navigate    = useNavigate()
  const { usuario } = useAuth()

  const [isWide, setIsWide] = useState(() => window.innerWidth >= 1024)
  useEffect(() => {
    const fn = () => setIsWide(window.innerWidth >= 1024)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const {
    citasOrdenadas, proximaCita,
    cargandoCitas,  errorCitas, recargarCitas,
    pacientes,      cargandoPacientes,
    citasCompletadasMes, cargandoMes,
    borradores,     cargandoBorradores,
    diagnosticos,   triagesHoy,
    notificacionTriage, setNotificacionTriage,
  } = useDashboardData(usuario)

  const tieneTriageHoy = useCallback(
    (citaId) => triagesHoy.some(t => t.cita_id === citaId),
    [triagesHoy]
  )

  useEffect(() => {
    if (!notificacionTriage) return
    toast.success('Paciente listo', {
      description: `${notificacionTriage.nombre} ha completado la valoración inicial de enfermería.`,
    })
    setNotificacionTriage(null)
  }, [notificacionTriage, setNotificacionTriage])

  /* When the doctor taps an action button on a cita card.
     recargarCitas is stable (delegates via internal ref) so it's safe to omit from deps. */
  const handleAccion = useCallback(async (cita) => {
    const { estado } = cita
    if (estado === 'programada' || estado === 'confirmada' || estado === 'en_sala') {
      try { await pb.collection('citas').update(cita.id, { estado: 'en_consulta' }) } catch {}
      recargarCitas()
      navigate(`/consulta/nueva?paciente=${cita.paciente}`)
    } else if (estado === 'en_consulta') {
      navigate(`/consulta/nueva?paciente=${cita.paciente}`)
    } else if (estado === 'completada') {
      navigate(`/pacientes/${cita.paciente}`)
    }
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  const apellido = usuario?.apellidos || usuario?.nombre || ''

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="anim-fade">

      {/* ── 2-column grid ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isWide ? '65fr 35fr' : '1fr',
        gap: '1.5rem',
        alignItems: 'start',
      }}>

        {/* ── LEFT — Agenda protagonist ────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Hero header */}
          <div>
            <h1 style={{
              fontSize: '1.5rem', fontWeight: 500,
              letterSpacing: '-0.025em', color: 'var(--text)', lineHeight: 1.2,
            }}>
              {obtenerSaludo()}, Dr.&nbsp;{apellido}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.375rem', flexWrap: 'wrap' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>
                {formatearFecha(new Date())}
              </p>
              {!cargandoCitas && (
                <span className="badge badge-accent">
                  {citasOrdenadas.length} cita{citasOrdenadas.length !== 1 ? 's' : ''} hoy
                </span>
              )}
            </div>
          </div>

          {/* Agenda card */}
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)',
            }}>
              <h2 style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text)' }}>
                Agenda del día
              </h2>
              <button
                onClick={() => navigate('/citas')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.75rem', fontWeight: 500, color: 'var(--accent)',
                  background: 'none', border: 'none', cursor: 'pointer',
                }}
              >
                Ver agenda completa <I.ChevronRight width={13} height={13} />
              </button>
            </div>

            {errorCitas ? (
              <AgendaError onReintentar={recargarCitas} />
            ) : cargandoCitas && citasOrdenadas.length === 0 ? (
              <AgendaCargando />
            ) : citasOrdenadas.length === 0 ? (
              <AgendaVacia onNuevaCita={() => navigate('/citas')} />
            ) : (
              <motion.div
                style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}
                {...safeAnimate({ variants: staggerContainer, initial: 'initial', animate: 'animate' })}
              >
                {citasOrdenadas.map(cita => (
                  <motion.div key={cita.id} {...safeAnimate({ variants: listItem })} layout>
                    <CitaCard
                      cita={cita}
                      isNext={proximaCita?.id === cita.id}
                      conTriage={tieneTriageHoy(cita.id)}
                      onAccion={handleAccion}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* ── RIGHT — Support panel ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Quick action */}
          <button
            onClick={() => navigate('/citas')}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 40, fontSize: '0.875rem', gap: '0.5rem' }}
          >
            <I.Plus width={15} height={15} /> Nueva consulta
          </button>

          {/* 2 × 2 metric cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MetricCard
              label="Pacientes activos"
              value={pacientes.length}
              Icon={I.Patients}
              colorVar="var(--accent)"
              dimVar="var(--accent-dim)"
              loading={cargandoPacientes}
            />
            <MetricCard
              label="Completadas este mes"
              value={citasCompletadasMes.length}
              Icon={I.Check}
              colorVar="var(--ok)"
              dimVar="var(--ok-dim)"
              loading={cargandoMes}
            />
            <MetricCard
              label="Borradores"
              value={borradores.length}
              Icon={I.Clipboard}
              colorVar={borradores.length > 0 ? 'var(--warn)' : 'var(--text-3)'}
              dimVar={borradores.length > 0 ? 'var(--warn-dim)' : 'var(--bg-subtle)'}
              loading={cargandoBorradores}
            />
            <MetricCard
              label="Próxima cita"
              value={proximaCita ? fmtHora(proximaCita.fecha_hora) : '—'}
              Icon={I.Calendar}
              colorVar="var(--violet)"
              dimVar="var(--violet-dim)"
              loading={cargandoCitas}
            />
          </div>

          {/* Frequent diagnoses */}
          <DiagnosticosFrecuentes
            diagnosticos={diagnosticos}
            onVerTodos={() => navigate('/informes')}
          />
        </div>
      </div>
    </div>
  )
}
