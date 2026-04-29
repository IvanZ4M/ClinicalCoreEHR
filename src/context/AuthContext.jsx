import { createContext, useContext, useState, useEffect } from 'react';
import pb from '../lib/pb';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(pb.authStore.record);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Escuchar cambios en la sesión (login / logout)
    const quitar = pb.authStore.onChange((token, record) => {
      setUsuario(record);
    });

    // Verificar si ya hay sesión guardada y refrescarla
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
    const resultado = await pb
      .collection('usuarios')
      .authWithPassword(email, contrasena);
    return resultado;
  };

  const logout = () => {
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto en cualquier componente
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}