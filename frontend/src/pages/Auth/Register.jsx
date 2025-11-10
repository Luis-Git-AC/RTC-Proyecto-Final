import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function Register() {
  const navigate = useNavigate()
  const { registerUser, loading, error } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [wallet, setWallet] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !email || !password) return
    try {
      await registerUser({ username, email, password, wallet_address: wallet || undefined })
      navigate('/', { replace: true })
    } catch { void 0 }
  }

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="username">Usuario</label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="wallet">Wallet (opcional)</label>
          <input id="wallet" value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: '0.5rem' }} />
        </div>
        {error ? <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{error}</div> : null}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.5rem' }}>{loading ? 'Creando...' : 'Registrarse'}</button>
      </form>
      <p style={{ marginTop: '1rem' }}>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
    </div>
  )
}
