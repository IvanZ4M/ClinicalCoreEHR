import { createContext, useContext, useState, useEffect } from 'react';
import pb from '../lib/pb';
import { logAuditEvent } from '../services/auditService';

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
        } catch {
          pb.authStore.clear();
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
