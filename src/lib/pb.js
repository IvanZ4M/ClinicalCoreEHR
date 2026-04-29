import PocketBase from 'pocketbase'

const pb = new PocketBase('http://127.0.0.1:8090')

pb.autoCancellation(false)

// Cargar sesión guardada si existe
const sesionGuardada = localStorage.getItem('pb_auth')
if (sesionGuardada) {
  try {
    const { token, record } = JSON.parse(sesionGuardada)
    pb.authStore.save(token, record)
  } catch {
    localStorage.removeItem('pb_auth')
  }
}

// Guardar sesión cada vez que cambie
pb.authStore.onChange((token, record) => {
  if (token && record) {
    localStorage.setItem('pb_auth', JSON.stringify({ token, record }))
  } else {
    localStorage.removeItem('pb_auth')
  }
})

export default pb