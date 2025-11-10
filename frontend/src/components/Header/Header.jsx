import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'
import { useAuth } from '../../context/useAuth'

function Header() {
  const location = useLocation()

  const { isAuthenticated, user, logoutUser } = useAuth()
  const linkClass = (path) => location.pathname === path ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
  const handleLogout = () => { logoutUser() }

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
            <Link to="/portfolio" className={linkClass('/portfolio')}>Portfolio</Link>
            {isAuthenticated && <Link to="/perfil" className={linkClass('/perfil')}>Perfil</Link>}
        </nav>
          <div>
            {!isAuthenticated && (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Link to="/login" className={linkClass('/login')}>Login</Link>
                <Link to="/register" className={linkClass('/register')}>Registro</Link>
              </div>
            )}
            {isAuthenticated && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {user && user.avatar && <img src={user.avatar} alt={user.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />}
                <span>{user ? user.username : ''}</span>
                <button onClick={handleLogout} style={{ padding: '0.4rem 0.8rem' }}>Salir</button>
              </div>
            )}
          </div>
      </div>
    </header>
  )
}

export default Header