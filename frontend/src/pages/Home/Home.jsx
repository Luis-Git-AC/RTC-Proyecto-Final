import { useState, useMemo } from 'react'
import useNoticias from '../../hooks/useNoticias'
import NoticiaCard from '../../components/NoticiaCard/NoticiaCard'
import { SearchForm } from '../../components/SearchForm/SearchForm'
import WorldClocks from '../../components/WorldClocks/WorldClocks'
import styles from './Home.module.css'

const TIMEZONES_LEFT = [
  { city: 'Nueva York', zone: 'America/New_York', flag: '🇺🇸' },
  { city: 'Londres', zone: 'Europe/London', flag: '🇬🇧' },
  { city: 'Berlín', zone: 'Europe/Berlin', flag: '🇩🇪' }
]

const TIMEZONES_RIGHT = [
  { city: 'Tokio', zone: 'Asia/Tokyo', flag: '🇯🇵' },
  { city: 'Hong Kong', zone: 'Asia/Hong_Kong', flag: '🇭🇰' },
  { city: 'Sídney', zone: 'Australia/Sydney', flag: '🇦🇺' }
]

function Home() {
  const { noticias, loading, error } = useNoticias()
  const [searchTerm, setSearchTerm] = useState('')

  const noticiasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return noticias
    
    const termLower = searchTerm.toLowerCase()
    return noticias.filter(
      (noticia) =>
        noticia.titulo?.toLowerCase().includes(termLower) ||
        noticia.descripcion?.toLowerCase().includes(termLower) ||
        noticia.moneda?.toLowerCase().includes(termLower)
    )
  }, [noticias, searchTerm])

  return (
    <div className={styles.container}>
      <div className={styles.newsHeader}>
        <h1>Últimas Noticias Crypto</h1>
        <p>Las noticias más recientes del mundo de las criptomonedas</p>
      </div>

      <SearchForm
        onSearch={setSearchTerm}
        placeholder="Buscar noticias ..."
        label="Buscar noticias"
      />

      <div className={styles.layout}>
        <WorldClocks timezones={TIMEZONES_LEFT} title="🌍 Europa/EEUU" />

        <main className={styles.mainContent}>
          {error && (
            <div className={styles.error} role="alert">
              <p>{error}</p>
              <p>Por favor, recarga la página para intentar nuevamente.</p>
            </div>
          )}

          {loading && !noticias.length ? (
            <div className={styles.loading}>Cargando noticias…</div>
          ) : (
            <div className={styles.newsGrid} role="list">
              {noticiasFiltradas.map((noticia) => (
                <NoticiaCard key={noticia.id} noticia={noticia} />
              ))}
            </div>
          )}

          {!loading && !error && noticiasFiltradas.length === 0 && (
            <p className={styles.empty}>
              {searchTerm 
                ? `No se encontraron noticias para "${searchTerm}"`
                : 'No se encontraron noticias disponibles.'}
            </p>
          )}
        </main>

        <WorldClocks timezones={TIMEZONES_RIGHT} title="🌏 Asia-Pacífico" />
      </div>
    </div>
  )
}

export default Home