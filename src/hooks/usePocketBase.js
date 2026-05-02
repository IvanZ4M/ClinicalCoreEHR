import { useState, useEffect, useRef } from 'react'
import pb from '../lib/pb'

export function useColeccion(coleccion, opciones = {}) {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Convertimos opciones a string para evitar re-renders infinitos
  const filtro = opciones.filtro || ''
  const orden = opciones.orden || '-created'
  const expandir = opciones.expandir || ''
  const porPagina = opciones.porPagina || 200
  const pagina = opciones.pagina || 1

  // Usamos ref para la función de recarga
  const recargarRef = useRef(null)

  useEffect(() => {
    let cancelado = false

    const cargar = async () => {
      setCargando(true)
      setError(null)
      try {
        const resultado = await pb.collection(coleccion).getList(pagina, porPagina, {
          sort: orden,
          filter: filtro,
          expand: expandir,
        })
        if (!cancelado) setDatos(resultado.items)
      } catch (err) {
        if (!cancelado) setError(err.message)
      } finally {
        if (!cancelado) setCargando(false)
      }
    }

    recargarRef.current = cargar
    cargar()

    return () => { cancelado = true }
  }, [coleccion, filtro, orden, expandir, porPagina, pagina])

  const recargar = () => {
    if (recargarRef.current) recargarRef.current()
  }

  return { datos, cargando, error, recargar }
}

export function useRegistro(coleccion, id, expandir = '') {
  const [dato, setDato] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!id) { setCargando(false); return }
    let cancelado = false

    setCargando(true)
    pb.collection(coleccion)
      .getOne(id, { expand: expandir })
      .then((r) => { if (!cancelado) setDato(r) })
      .catch((e) => { if (!cancelado) setError(e.message) })
      .finally(() => { if (!cancelado) setCargando(false) })

    return () => { cancelado = true }
  }, [coleccion, id, expandir, version])

  const recargar = () => setVersion(v => v + 1)

  return { dato, cargando, error, recargar }
}