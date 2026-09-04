import { useState, useEffect, useCallback } from 'react'

const LS = {
  theme:        'cc.theme',
  accentH:      'cc.accentH',
  density:      'cc.density',
  sidebar:      'cc.sidebar',
  radius:       'cc.radius',
  presentacion: 'cc.presentacion',
}

// Factor de zoom de Electron en modo presentación. Escala TODO el renderer,
// incluidas las gráficas de Recharts, que dibujan SVG con medidas propias y
// no responden a --ui-scale.
const ZOOM_PRESENTACION = 1.15

function read(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback }
  catch { return fallback }
}

function persist(key, value) {
  try { localStorage.setItem(key, String(value)) } catch {}
}

export function useTheme() {
  /* ── theme: 'light' | 'dark' | 'system' ─────────────────────────── */
  const [theme, setThemeState] = useState(() => read(LS.theme, 'system'))

  /* ── accentH: 0–360 hue for the accent color ─────────────────────── */
  const [accentH, setAccentHState] = useState(() => Number(read(LS.accentH, 214)))

  /* ── density: 'compact' | 'regular' | 'spacious' ────────────────── */
  const [density, setDensityState] = useState(() => read(LS.density, 'regular'))

  /* ── sidebar: 'rail' | 'regular' | 'wide' ───────────────────────── */
  const [sidebar, setSidebarState] = useState(() => read(LS.sidebar, 'regular'))

  /* ── radius: 4 | 8 | 12 | 16 (px) ───────────────────────────────── */
  const [radius, setRadiusState] = useState(() => Number(read(LS.radius, 8)))

  /* ── presentacion: modo proyector (F9) ──────────────────────────── */
  const [presentacion, setPresentacionState] = useState(() => read(LS.presentacion, 'off') === 'on')

  /* Resolve effective dark mode */
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  /* Apply to DOM */
  useEffect(() => {
    const root = document.documentElement
    const resolvedDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    root.classList.toggle('dark', resolvedDark)
    persist(LS.theme, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-h', String(accentH))
    persist(LS.accentH, accentH)
  }, [accentH])

  useEffect(() => {
    document.documentElement.dataset.density = density
    persist(LS.density, density)
  }, [density])

  useEffect(() => {
    document.documentElement.dataset.sidebar = sidebar
    persist(LS.sidebar, sidebar)
  }, [sidebar])

  useEffect(() => {
    document.documentElement.style.setProperty('--radius', radius + 'px')
    persist(LS.radius, radius)
  }, [radius])

  /* Modo presentación: atributo en <html> + zoom del renderer de Electron */
  useEffect(() => {
    document.documentElement.dataset.presentacion = presentacion ? 'on' : 'off'
    persist(LS.presentacion, presentacion ? 'on' : 'off')
    // En el navegador (dev) electronAPI no existe: solo aplica --ui-scale.
    try {
      window.electronAPI?.send('ui:set-zoom', presentacion ? ZOOM_PRESENTACION : 1)
    } catch { /* sin puente de Electron: el escalado CSS ya funciona por sí solo */ }
  }, [presentacion])

  /* F9 alterna el modo presentación desde cualquier pantalla */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F9') {
        e.preventDefault()
        setPresentacionState(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* Listen for system preference changes when theme === 'system' */
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      document.documentElement.classList.toggle('dark', e.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  /* Setters */
  const setTheme   = useCallback((v) => setThemeState(v), [])
  const setAccentH = useCallback((v) => setAccentHState(Number(v)), [])
  const setDensity = useCallback((v) => setDensityState(v), [])
  const setSidebar = useCallback((v) => setSidebarState(v), [])
  const setRadius  = useCallback((v) => setRadiusState(Number(v)), [])

  const toggleDark = useCallback(() => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark')
  }, [])

  const setPresentacion   = useCallback((v) => setPresentacionState(Boolean(v)), [])
  const togglePresentacion = useCallback(() => setPresentacionState(v => !v), [])

  return {
    theme, setTheme, isDark, toggleDark,
    accentH, setAccentH,
    density, setDensity,
    sidebar, setSidebar,
    radius, setRadius,
    presentacion, setPresentacion, togglePresentacion,
  }
}
