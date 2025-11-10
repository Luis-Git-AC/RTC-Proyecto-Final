import { Link, useLocation } from 'react-router-dom'
import styles from './Header.module.css'

function Header() {
  const location = useLocation()

  const isActive = (path) => {
    return location.pathname === path
      ? `${styles.navLink} ${styles.navLinkActive}`
      : styles.navLink
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link to="/">
            <h1>CoinHub</h1>
          </Link>
        </div>
        
        <nav className={styles.navigation}>
          <Link to="/" className={isActive('/')}>
            Home
          </Link>
          <Link to="/criptos" className={isActive('/criptos')}>
            Criptos
          </Link>
          <Link to="/portfolio" className={isActive('/portfolio')}>
            Portfolio
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header