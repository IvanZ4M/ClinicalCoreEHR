import { lazy, Suspense } from 'react'
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useRouteError } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ROLES } from './lib/roles'
import RoleGuard from './components/guards/RoleGuard'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Unauthorized from './pages/Unauthorized'

const Dashboard             = lazy(() => import('./pages/Dashboard'))
const DashboardEnfermera    = lazy(() => import('./pages/DashboardEnfermera'))
const DashboardRecepcionista = lazy(() => import('./pages/DashboardRecepcionista'))
const DashboardAdmin        = lazy(() => import('./pages/DashboardAdmin'))
const Patients              = lazy(() => import('./pages/Patients'))
const Appointments          = lazy(() => import('./pages/Appointments'))
const PatientDetail         = lazy(() => import('./pages/PatientDetail'))
const NewConsultation       = lazy(() => import('./pages/NewConsultation'))
const Reports               = lazy(() => import('./pages/Reports'))
const Users                 = lazy(() => import('./pages/Users'))
const Settings              = lazy(() => import('./pages/Settings'))
const EnfermeriaQueue       = lazy(() => import('./pages/EnfermeriaQueue'))
const EnfermeriaValoracion  = lazy(() => import('./pages/EnfermeriaValoracion'))

// ── Spinner de carga inicial ─────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spinCw 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Cargando sistema...</p>
      </div>
    </div>
  )
}

// ── Guard de autenticación ────────────────────────────────────────────────────
function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()
  if (cargando) return <Spinner />
  if (!usuario) return <Navigate to="/login" replace />
  return children
}

// ── Redirige al login si ya hay sesión ────────────────────────────────────────
function LoginConRedirect() {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  if (usuario) return <Navigate to="/" replace />
  return <Login />
}

// ── Dashboard enrutado por rol ─────────────────────────────────────────────────
function DashboardPorRol() {
  const { usuario } = useAuth()
  switch (usuario?.rol) {
    case ROLES.ENFERMERA:     return <DashboardEnfermera />
    case ROLES.RECEPCIONISTA: return <DashboardRecepcionista />
    case ROLES.ADMINISTRADOR: return <DashboardAdmin />
    default:                  return <Dashboard />        // medico + fallback
  }
}

// ── Página de error de ruta ────────────────────────────────────────────────────
function ErrorPagina() {
  const error    = useRouteError()
  const navigate = useNavigate()
  return (
    <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</p>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>Error en la página</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid var(--danger)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', textAlign: 'left', wordBreak: 'break-all' }}>
          {error?.message || String(error)}
        </p>
        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
          Volver al Panel
        </button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Pública */}
            <Route path="/login"         element={<LoginConRedirect />} />
            <Route path="/no-autorizado" element={<Unauthorized />} />

            {/* Protegidas — solo usuarios autenticados */}
            <Route
              path="/*"
              element={
                <RutaProtegida>
                  <Layout>
                    <Suspense fallback={<Spinner />}>
                    <Routes>
                      {/* Dashboard dinámico por rol */}
                      <Route path="/" element={<DashboardPorRol />} errorElement={<ErrorPagina />} />

                      {/* Médico + Recepcionista + Enfermera */}
                      <Route path="/pacientes" element={
                        <RoleGuard allowedRoles={[ROLES.MEDICO, ROLES.RECEPCIONISTA, ROLES.ENFERMERA]}>
                          <Patients />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      <Route path="/pacientes/:id" element={
                        <RoleGuard allowedRoles={[ROLES.MEDICO, ROLES.RECEPCIONISTA, ROLES.ENFERMERA]}>
                          <PatientDetail />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      <Route path="/citas" element={
                        <RoleGuard allowedRoles={[ROLES.MEDICO, ROLES.ENFERMERA, ROLES.RECEPCIONISTA]}>
                          <Appointments />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      {/* Solo enfermera */}
                      <Route path="/enfermeria" element={
                        <RoleGuard allowedRoles={[ROLES.ENFERMERA]}>
                          <EnfermeriaQueue />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      <Route path="/enfermeria/:citaId" element={
                        <RoleGuard allowedRoles={[ROLES.ENFERMERA]}>
                          <EnfermeriaValoracion />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      {/* Solo médico */}
                      <Route path="/informes" element={
                        <RoleGuard allowedRoles={[ROLES.MEDICO]}>
                          <Reports />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      <Route path="/consulta/nueva" element={
                        <RoleGuard allowedRoles={[ROLES.MEDICO]}>
                          <NewConsultation />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      {/* Médico + Administrador */}
                      <Route path="/configuracion" element={
                        <RoleGuard allowedRoles={[ROLES.MEDICO, ROLES.ADMINISTRADOR]}>
                          <Settings />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      {/* Solo administrador */}
                      <Route path="/usuarios" element={
                        <RoleGuard allowedRoles={[ROLES.ADMINISTRADOR]}>
                          <Users />
                        </RoleGuard>
                      } errorElement={<ErrorPagina />} />

                      {/* Cualquier ruta desconocida → dashboard del rol */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    </Suspense>
                  </Layout>
                </RutaProtegida>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}
