import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import styles from './Header.module.css'
import { useAuth } from '../../context/useAuth'

function Header() {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const { isAuthenticated, user, logoutUser } = useAuth()
  const linkClass = (path) => location.pathname === path ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
  const handleLogout = () => { logoutUser() }

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <h1>CoinHub</h1>
          </Link>
        </div>
        
        <nav className={styles.navigation}>
            <Link to="/" className={linkClass('/')}>Home</Link>
            <Link to="/criptos" className={linkClass('/criptos')}>Criptos</Link>
            <Link to="/foro" className={linkClass('/foro')}>Foro</Link>
      <Link to="/recursos" className={linkClass('/recursos')}>Recursos</Link>
            <Link to="/portfolio" className={linkClass('/portfolio')}>Portfolio</Link>
            {user && user.role === 'admin' && (
              <Link to="/admin/users" className={linkClass('/admin/users')}>Admin</Link>
            )}
        </nav>
          <div>
            {!isAuthenticated && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" className={linkClass('/login')}>Login</Link>
                <Link to="/register" className={linkClass('/register')}>Registro</Link>
              </div>
            )}
            {isAuthenticated && (
              <div style={{ position: 'relative' }} ref={menuRef}>
                <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  {user && user.avatar && <img src={user.avatar} alt={user.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />}
                  <span>{user ? user.username : ''}</span>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid #ddd', padding: '0.5rem', borderRadius: 8, minWidth: 160, display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 20 }}>
                    <Link to="/perfil" className={linkClass('/perfil')}>Perfil</Link>
                    <button onClick={handleLogout} style={{ padding: '0.4rem 0.6rem', textAlign: 'left' }}>Salir</button>
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </header>
  )
}

export default Header