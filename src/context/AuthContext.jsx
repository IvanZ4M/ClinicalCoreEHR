import { createContext, useContext, useState, useEffect } from 'react';
import pb from '../lib/pb';
import { logAuditEvent } from '../services/auditService';
import { logWarn } from '../lib/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(pb.authStore.record);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const quitar = pb.authStore.onChange((token, record) => {
      setUsuario(record);
    });

    const verificarSesion = async () => {
      if (pb.authStore.isValid) {
        try {
          await pb.collection('usuarios').authRefresh();
        } catch (err) {
          // VULN-FIX (ÁREA 9): solo cerrar la sesión si el servidor RECHAZA el
          // token (401/403). Antes, cualquier error hacía authStore.clear(),
          // así que un corte de red momentáneo o un reinicio del servidor
          // expulsaba a todo el personal — y al médico que estaba capturando
          // una consulta le hacía perder lo escrito.
          const status = err?.status ?? 0;
          if (status === 401 || status === 403) {
            pb.authStore.clear();
          } else {
            // Red caída o servidor no disponible: se conserva la sesión local.
            // Las siguientes peticiones fallarán y la interfaz mostrará el error.
            logWarn('AuthContext.authRefresh', err);
          }
        }
      }
      setCargando(false);
    };

    verificarSesion();

    return () => quitar();
  }, []);

  const login = async (email, contrasena) => {
    // VULN-FIX (ÁREA 7): registrar inicio de sesión exitoso en audit_log
    const resultado = await pb.collection('usuarios').authWithPassword(email, contrasena);
    logAuditEvent('LOGIN_OK', 'usuarios', resultado.record?.id);
    return resultado;
  };

  const logout = () => {
    // VULN-FIX (ÁREA 7): registrar cierre de sesión
    logAuditEvent('LOGOUT', 'usuarios', pb.authStore.record?.id);
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}
