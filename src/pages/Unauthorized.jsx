import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABELS } from '../lib/roles'
import { I } from '../components/icons'

export default function Unauthorized() {
  const navigate  = useNavigate()
  const { usuario } = useAuth()
  const rolLabel  = ROLE_LABELS[usuario?.rol] || usuario?.rol || 'Usuario'

  return (
    <div style={{
      minHeight: '100svh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }} className="anim-fade">

        {/* Icono */}
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--radius-xl)',
          background: 'var(--danger-dim)', border: '1px solid var(--danger)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.5rem',
        }}>
          <I.Lock width={32} height={32} style={{ color: 'var(--danger)' }} />
        </div>

        {/* Título */}
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Acceso no autorizado
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-2)', lineHeight: 1.6, marginBottom: '0.5rem' }}>
          Tu cuenta tiene el rol de <strong style={{ color: 'var(--text)' }}>{rolLabel}</strong> y no tiene
          permiso para ver esta sección.
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', marginBottom: '2rem' }}>
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-outline"
            style={{ fontSize: '0.875rem' }}
          >
            <I.ArrowLeft width={14} height={14} />
            Regresar
          </button>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="btn btn-primary"
            style={{ fontSize: '0.875rem' }}
          >
            <I.Dashboard width={14} height={14} />
            Ir al Panel
          </button>
        </div>
      </div>
    </div>
  )
}
