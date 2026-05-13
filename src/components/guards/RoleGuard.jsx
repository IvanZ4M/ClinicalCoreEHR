import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Envuelve una ruta y redirige a /no-autorizado si el rol del usuario
 * no está en `allowedRoles`. Actúa como segunda capa después de RutaProtegida.
 *
 * Uso:
 *   <RoleGuard allowedRoles={['medico', 'administrador']}>
 *     <MiPagina />
 *   </RoleGuard>
 */
export default function RoleGuard({ allowedRoles, children }) {
  const { usuario } = useAuth()

  if (!allowedRoles.includes(usuario?.rol)) {
    return <Navigate to="/no-autorizado" replace />
  }

  return children
}
