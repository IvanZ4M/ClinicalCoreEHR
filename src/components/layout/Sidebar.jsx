import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: '📊', label: 'Panel de Control' },
    { path: '/patients', icon: '👥', label: 'Pacientes' },
    { path: '/appointments', icon: '📅', label: 'Citas' },
    { path: '/reports', icon: '📈', label: 'Informes' },
    { path: '/settings', icon: '⚙️', label: 'Configuración' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between h-screen">
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-10 h-10 bg-blue-800 rounded flex items-center justify-center text-white font-bold">
            CM
          </div>
          <div>
            <h1 className="text-blue-900 font-bold leading-tight">Centro Médico</h1>
            <p className="text-xs text-gray-500 uppercase">Unidad de Atención</p>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4">
        <button className="w-full bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors">
          Consulta Rápida
        </button>
      </div>
    </aside>
  );
}
