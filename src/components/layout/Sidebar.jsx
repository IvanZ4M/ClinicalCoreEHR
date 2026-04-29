import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const estaActivo = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/',              icono: '▪', label: 'Panel de Control' },
    { path: '/pacientes',     icono: '▪', label: 'Pacientes'        },
    { path: '/citas',         icono: '▪', label: 'Citas'            },
    { path: '/informes',      icono: '▪', label: 'Informes'         },
    { path: '/configuracion', icono: '▪', label: 'Configuración'    },
  ];

  // Si el usuario es administrador, mostrar también Usuarios
  const itemsFinal = usuario?.rol === 'administrador'
    ? [...navItems.slice(0, 4), { path: '/usuarios', icono: '▪', label: 'Usuarios' }, navItems[4]]
    : navItems;

  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col justify-between h-screen flex-shrink-0">
      
      {/* Logo */}
      <div>
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            CM
          </div>
          <div className="min-w-0">
            <h1 className="text-blue-900 font-bold leading-tight text-sm">Centro Médico</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wide truncate">
              Unidad de Atención Primaria
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="mt-4 flex flex-col gap-0.5 px-3">
          <p className="text-xs text-gray-400 uppercase font-medium px-3 pb-2 tracking-wider">
            Menú principal
          </p>
          {itemsFinal.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                estaActivo(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700 pl-2'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {/* Ícono SVG según módulo */}
              <span className="w-5 h-5 flex items-center justify-center text-base leading-none">
                {item.path === '/'              && '📊'}
                {item.path === '/pacientes'     && '👥'}
                {item.path === '/citas'         && '📅'}
                {item.path === '/informes'      && '📈'}
                {item.path === '/usuarios'      && '👤'}
                {item.path === '/configuracion' && '⚙️'}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Botón Consulta Rápida */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => navigate('/citas')}
          className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          ✚ Consulta Rápida
        </button>
      </div>
    </aside>
  );
}