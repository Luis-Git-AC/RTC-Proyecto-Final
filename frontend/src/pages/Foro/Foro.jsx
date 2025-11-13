import { useEffect, useState, useCallback } from 'react'
import { getPosts } from '../../services/posts'
import PostCard from '../../components/PostCard/PostCard'
import { Link } from 'react-router-dom'
import styles from './Foro.module.css'

export default function Foro() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(9)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const data = await getPosts({ page: p, limit })
      setItems(data.posts || [])
      setTotalPages(data.pagination ? data.pagination.pages : 1)
      setError('')
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { load(page) }, [page, load])

  const next = () => { if (page < totalPages) setPage(page + 1) }
  const prev = () => { if (page > 1) setPage(page - 1) }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Foro</h2>
        <Link to="/foro/nuevo" style={{ textDecoration: 'none' }}>
          <button className={styles.actionBtn}>Nuevo post</button>
        </Link>
      </div>
      {loading && <div className={styles.loading}>Cargando…</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && items.length === 0 && <div className={styles.empty}>No hay posts</div>}
      <div className={styles.grid}>
        {items.map(p => <PostCard key={p._id} post={p} />)}
      </div>
      <div className={styles.pagination}>
        <button className={styles.pageBtn} onClick={prev} disabled={page <= 1}>Anterior</button>
        <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
        <button className={styles.pageBtn} onClick={next} disabled={page >= totalPages}>Siguiente</button>
      </div>
    </div>
  )
}
