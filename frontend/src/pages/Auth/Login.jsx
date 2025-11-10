import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginUser, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    try {
      await loginUser({ email, password })
      const from = location.state && location.state.from ? location.state.from.pathname : '/'
      navigate(from, { replace: true })
  } catch { void 0 }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        {error ? <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{error}</div> : null}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.5rem' }}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      <p style={{ marginTop: '1rem' }}>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
    </div>
  )
}
