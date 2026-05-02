import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { I } from '../components/icons'

const FEATURES = [
  'Expedientes electrónicos completos',
  'Generación de recetas en PDF',
  'Diagnósticos con código CIE-10',
  'Estadísticas y reportes clínicos',
]

export default function Login() {
  const { login } = useAuth()
  const [email,     setEmail]     = useState('')
  const [contrasena, setPass]     = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [showPass,  setShowPass]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, contrasena)
    } catch {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100svh', display: 'flex', background: 'var(--bg)' }}>

      {/* ── Left panel — decorative ───────────────────────────────── */}
      <div style={{
        display: 'none',
        width: '52%',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '3rem',
        position: 'relative',
        overflow: 'hidden',
        background: 'oklch(14% 0.03 214)',
      }}
        className="lg:flex"
      >
        {/* Gradient blobs */}
        <div style={{
          position: 'absolute', top: -100, left: -80,
          width: 380, height: 380, borderRadius: '50%',
          background: 'oklch(55% 0.20 214 / 0.15)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -80, right: -60,
          width: 300, height: 300, borderRadius: '50%',
          background: 'oklch(55% 0.20 214 / 0.12)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }} />
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.75rem' }} className="anim-fade">
          <div style={{
            width: 40, height: 40,
            background: 'var(--accent)',
            borderRadius: 'var(--radius-md)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px oklch(55% 0.20 214 / 0.40)',
          }}>
            <I.Pulse width={20} height={20} stroke="white" strokeWidth={2} />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              ClinicalCore EHR
            </p>
            <p style={{ color: 'oklch(70% 0.08 214)', fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>
              Sistema de Expedientes
            </p>
          </div>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative' }} className="anim-fade-up">
          <div style={{
            width: 72, height: 72,
            background: 'oklch(55% 0.20 214 / 0.15)',
            border: '1px solid oklch(55% 0.20 214 / 0.30)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '2rem',
          }}>
            <I.Stethoscope width={36} height={36} stroke="oklch(75% 0.15 214)" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '0.875rem' }}>
            Sistema clínico<br />de última generación
          </h2>
          <p style={{ color: 'oklch(60% 0.05 214)', fontSize: '0.9375rem', lineHeight: 1.7, maxWidth: 300, marginBottom: '2rem' }}>
            Gestiona expedientes, consultas y prescripciones con la precisión que merece tu práctica médica.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {FEATURES.map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 'var(--radius-full)',
                  background: 'oklch(55% 0.20 214 / 0.25)',
                  border: '1px solid oklch(55% 0.20 214 / 0.40)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <I.Check width={10} height={10} stroke="oklch(72% 0.16 214)" strokeWidth={2.5} />
                </div>
                <span style={{ color: 'oklch(72% 0.04 214)', fontSize: '0.875rem' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: 'relative', color: 'oklch(40% 0.03 214)', fontSize: '0.75rem' }}>
          © {new Date().getFullYear()} ClinicalCore EHR — Uso exclusivo del personal autorizado
        </p>
      </div>

      {/* ── Right panel — form ────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        background: 'var(--bg-elev)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="anim-fade-up">

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' }}
            className="lg:hidden">
            <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I.Pulse width={18} height={18} stroke="white" strokeWidth={2} />
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>ClinicalCore EHR</p>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.375rem' }}>
              Bienvenido de vuelta
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            {/* Email */}
            <div>
              <label className="field-label">Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <I.Mail width={14} height={14} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-3)', pointerEvents: 'none',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dr.ejemplo@clinica.com"
                  required
                  className="input"
                  style={{ paddingLeft: 36 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="field-label">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <I.Lock width={14} height={14} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-3)', pointerEvents: 'none',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={contrasena}
                  onChange={e => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-3)', padding: 4, borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {showPass ? <I.EyeOff width={15} height={15} /> : <I.Eye width={15} height={15} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
                background: 'var(--danger-dim)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem',
                color: 'var(--danger)',
                fontSize: '0.875rem',
              }} className="anim-fade-up">
                <I.Alert width={15} height={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', paddingTop: '0.625rem', paddingBottom: '0.625rem', fontSize: '0.9375rem', marginTop: '0.25rem' }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }} className="anim-spin" />
                  Verificando...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '2rem' }}>
            Acceso exclusivo para personal médico autorizado
          </p>
        </div>
      </div>
    </div>
  )
}
