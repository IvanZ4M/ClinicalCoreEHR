import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useRouteError } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Appointments from './pages/Appointments'
import PatientDetail from './pages/PatientDetail'
import NewConsultation from './pages/NewConsultation'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Settings from './pages/Settings'

function RutaProtegida({ children }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spinCw 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Cargando sistema...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  return children
}

function LoginConRedirect() {
  const { usuario, cargando } = useAuth()
  if (cargando) return null
  if (usuario) return <Navigate to="/" replace />
  return <Login />
}

function PlaceholderModulo({ nombre }) {
  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center text-gray-400">
        <p className="text-5xl mb-4">🚧</p>
        <h2 className="text-xl font-bold text-gray-600 mb-1">{nombre}</h2>
        <p className="text-sm">Este módulo está en desarrollo</p>
      </div>
    </div>
  )
}

// Muestra el error en pantalla en lugar de redirigir silenciosamente
function ErrorPagina() {
  const error = useRouteError()
  const navigate = useNavigate()
  return (
    <div className="p-6 flex items-center justify-center h-full">
      <div className="text-center text-gray-400 max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-700 mb-2">Error en la página</h2>
        <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg mb-4 text-left font-mono">
          {error?.message || String(error)}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm hover:bg-blue-800"
        >
          Volver al Dashboard
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
          <Route path="/login" element={<LoginConRedirect />} />
          <Route
            path="/*"
            element={
              <RutaProtegida>
                <Layout>
                  <Routes>
                    <Route path="/"                   element={<Dashboard />}                                        errorElement={<ErrorPagina />} />
                    <Route path="/pacientes"          element={<Patients />}                                         errorElement={<ErrorPagina />} />
                    <Route path="/pacientes/:id"      element={<PatientDetail />}                                    errorElement={<ErrorPagina />} />
                    <Route path="/citas"              element={<Appointments />}                                     errorElement={<ErrorPagina />} />
                    <Route path="/informes" element={<Reports />} errorElement={<ErrorPagina />} />
                    <Route path="/configuracion" element={<Settings />} errorElement={<ErrorPagina />} />
                    <Route path="/usuarios" element={<Users />} errorElement={<ErrorPagina />} />
                    <Route path="/consulta/nueva" element={<NewConsultation />} errorElement={<ErrorPagina />} />
                    <Route path="*"                   element={<Navigate to="/" replace />} />
                  </Routes>
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