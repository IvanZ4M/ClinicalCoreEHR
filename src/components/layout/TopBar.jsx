import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const iniciales = usuario
    ? `${usuario.nombre?.[0] || ''}${usuario.apellidos?.[0] || ''}`
    : 'US';

  const nombreCompleto = usuario
    ? `Dr. ${usuario.nombre} ${usuario.apellidos}`
    : 'Usuario';

  const rol = usuario?.rol
    ? usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)
    : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      
      <h2 className="text-sm font-medium text-gray-500">
        Centro Médico — Clínica Integral
      </h2>

      <div className="flex items-center gap-3">
        {/* Botón urgencias */}
        <button className="px-3 py-1.5 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors">
          ✚ Urgencias
        </button>

        {/* Notificaciones */}
        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors relative">
          🔔
        </button>

        {/* Avatar y nombre del usuario real */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
          <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {iniciales.toUpperCase()}
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900 leading-tight">{nombreCompleto}</p>
            <p className="text-xs text-gray-400 capitalize">{rol}</p>
          </div>

          {/* Menú cerrar sesión */}
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-xs"
          >
            ⏻
          </button>
        </div>
      </div>
    </header>
  );
}