import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await login(email, contrasena);
    } catch (err) {
      setError('Correo o contraseña incorrectos. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 w-full max-w-md">

        {/* Logo y título */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            CC
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ClinicalCore EHR</h1>
            <p className="text-sm text-gray-500">Sistema de Expedientes Clínicos</p>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Iniciar sesión</h2>
        <p className="text-gray-500 text-sm mb-8">
          Ingresa tus credenciales para acceder al sistema
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dr.ejemplo@clinica.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : 'Entrar al sistema'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
          ClinicalCore EHR — Uso exclusivo del personal autorizado
        </p>
      </div>
    </div>
  );
}