/*
 * Login — ClinicalCore EHR
 * Ref A: aurora background + branding above form (MedTutor AI style)
 * Ref B: centered white card + logo mark at top (glassmorphism style)
 * Animations: card → logo → content, staggered via .login-visible CSS class.
 * Respects the app's light/dark mode via design-system CSS variables.
 */
import { useEffect, useState } from 'react'
import { I } from '../components/icons'
import { useLogin } from '../hooks/useLogin'
import '../styles/login.css'

export default function Login() {
  const [visible, setVisible] = useState(false)
  const {
    email, setEmail, password, setPassword,
    showPassword, setShowPassword,
    loading, error, handleSubmit,
  } = useLogin()

  // 50ms delay ensures transition fires even on Electron's instant load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', position: 'relative', overflow: 'hidden', background: 'var(--bg)' }}>
      <div className="login-blob-1" aria-hidden="true" />
      <div className="login-blob-2" aria-hidden="true" />

      <div
        className={`login-card${visible ? ' login-visible' : ''}`}
        style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-modal)', padding: '2.5rem 2.25rem', width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        <BrandingPanel />

        <div className="login-content">
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-2)', marginBottom: '1.75rem' }}>
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.375rem' }}>Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <I.Mail width={14} height={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                <input
                  type="email" autoComplete="email" autoFocus
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="dr.ejemplo@clinica.com" required readOnly={loading}
                  className={`login-field${error ? ' error' : ''}`}
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.375rem' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <I.Lock width={14} height={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required readOnly={loading}
                  className={`login-field${error ? ' error' : ''}`}
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-2)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)' }}
                >
                  {showPassword ? <I.EyeOff width={15} height={15} /> : <I.Eye width={15} height={15} />}
                </button>
              </div>
            </div>

            {error && <ErrorMessage msg={error} />}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? (
                <><span className="login-spinner" aria-hidden="true" /> Verificando...</>
              ) : 'Iniciar sesión'}
            </button>

          </form>

          <p style={{ textAlign: 'center', fontSize: '0.6875rem', color: 'var(--text-3)', marginTop: '1.5rem', lineHeight: 1.5 }}>
            Acceso exclusivo para personal médico autorizado
          </p>
        </div>
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.6875rem', color: 'var(--text-3)', position: 'relative', zIndex: 1 }}>
        © {new Date().getFullYear()} ClinicalCore EHR
      </p>
    </div>
  )
}

function BrandingPanel() {
  return (
    <div className="login-logo" style={{ textAlign: 'center', marginBottom: '1.875rem' }}>
      <div style={{ width: 54, height: 54, borderRadius: 15, background: 'linear-gradient(135deg, oklch(55% 0.20 214) 0%, oklch(57% 0.22 195) 100%)', boxShadow: '0 4px 20px oklch(55% 0.20 214 / 0.30)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
        <I.Pulse width={26} height={26} stroke="white" strokeWidth={2} />
      </div>
      <h1 style={{ marginTop: '1rem', fontSize: '1.375rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', lineHeight: 1.2 }}>
        ClinicalCore <span style={{ color: 'var(--accent)' }}>EHR</span>
      </h1>
      <p style={{ marginTop: '0.375rem', fontSize: '0.6875rem', fontWeight: 600, letterSpacing: '0.11em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
        Sistema de Expedientes Clínicos
      </p>
    </div>
  )
}

function ErrorMessage({ msg }) {
  return (
    <div className="login-error-enter" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', background: 'var(--danger-dim)', border: '1px solid var(--danger)', borderRadius: 10, padding: '0.75rem 0.875rem', color: 'var(--danger)', fontSize: '0.8125rem' }}>
      <I.Alert width={14} height={14} style={{ flexShrink: 0, marginTop: 1 }} />
      {msg}
    </div>
  )
}
