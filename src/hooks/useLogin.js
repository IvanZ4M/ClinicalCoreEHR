import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export function useLogin() {
  const { login } = useAuth()
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch {
      setError('Credenciales incorrectas. Verifica e intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return {
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    loading, error,
    handleSubmit,
  }
}
