import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import pb from '../lib/pb'
import { useAuth } from './AuthContext'

const Ctx = createContext({
  notificaciones: [],
  totalNoLeidas: 0,
  marcarLeida: () => {},
  marcarTodasLeidas: async () => {},
})

export function NotificationsProvider({ children }) {
  const { usuario } = useAuth()
  const [notificaciones, setNotificaciones] = useState([])
  const unsubRef = useRef(null)

  const cargar = useCallback(async () => {
    if (!usuario?.id) return
    try {
      const r = await pb.collection('notificaciones').getList(1, 50, {
        filter: `usuario_destino = "${usuario.id}"`,
        sort: '-created',
      })
      setNotificaciones(r.items)
    } catch {
      // collection may not exist yet — fail silently
    }
  }, [usuario?.id])

  useEffect(() => { cargar() }, [cargar])

  // Realtime subscription
  useEffect(() => {
    if (!usuario?.id) return
    pb.collection('notificaciones').subscribe('*', (e) => {
      if (e.record.usuario_destino === usuario.id) cargar()
    }).then(fn => { unsubRef.current = fn }).catch(() => {})

    return () => { unsubRef.current?.(); unsubRef.current = null }
  }, [usuario?.id, cargar])

  const marcarLeida = useCallback(async (id) => {
    try {
      await pb.collection('notificaciones').update(id, { leida: true })
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
    } catch { /* fail silently */ }
  }, [])

  const marcarTodasLeidas = useCallback(async () => {
    const pendientes = notificaciones.filter(n => !n.leida)
    await Promise.all(pendientes.map(n =>
      pb.collection('notificaciones').update(n.id, { leida: true }).catch(() => {})
    ))
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })))
  }, [notificaciones])

  const totalNoLeidas = notificaciones.filter(n => !n.leida).length

  return (
    <Ctx.Provider value={{ notificaciones, totalNoLeidas, marcarLeida, marcarTodasLeidas }}>
      {children}
    </Ctx.Provider>
  )
}

export const useNotifications = () => useContext(Ctx)
