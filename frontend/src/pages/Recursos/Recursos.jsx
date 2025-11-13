import { useCallback, useEffect, useState } from 'react'
import { getResources, deleteResource } from '../../services/resources'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import TradingViewWidget from '../../components/TradingViewWidget/TradingViewWidget'
import ResourceCard from '../../components/ResourceCard/ResourceCard'
import styles from './Recursos.module.css'

export default function Recursos() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(9)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [busyDelete, setBusyDelete] = useState(null)
  const { user, isAuthenticated, token } = useAuth()
  const navigate = useNavigate()

  const load = useCallback(async (p) => {
    setLoading(true)
    try {
      const data = await getResources({ page: p, limit })
      setItems(data.resources || [])
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
      <div style={{ marginBottom: '1rem' }}>
        <TradingViewWidget symbol="BTCUSDT" theme="light" height={320} />
      </div>
      <div className={styles.header}>
        <h2 className={styles.title}>Recursos</h2>
        <Link to="/recursos/nuevo"><button className={styles.actionBtn}>Subir recurso</button></Link>
      </div>
      {loading && <div className={styles.loading}>Cargando…</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && items.length === 0 && <div className={styles.empty}>No hay recursos</div>}
      <div className={styles.grid}>
        {items.map(r => {
          const ownerId = r.userId && (r.userId._id || r.userId)
          const isOwner = isAuthenticated && user && String(ownerId) === String(user._id)
          const isAdmin = isAuthenticated && user && user.role === 'admin'
          const canManage = isOwner || isAdmin
          return (
            <ResourceCard
              key={r._id}
              resource={r}
              canManage={canManage}
              busy={busyDelete === r._id}
              onEdit={() => navigate(`/recursos/editar/${r._id}`)}
              onDelete={async () => {
                if (busyDelete) return
                const ok = window.confirm('¿Eliminar recurso?')
                if (!ok) return
                setBusyDelete(r._id)
                try {
                  await deleteResource(token, r._id)
                  setItems(items.filter(x => x._id !== r._id))
                } catch (e) {
                  setError(e.message || 'Error al eliminar')
                } finally {
                  setBusyDelete(null)
                }
              }}
            />
          )
        })}
      </div>
      <div className={styles.pagination}>
        <button className={styles.pageBtn} onClick={prev} disabled={page <= 1}>Anterior</button>
        <span className={styles.pageInfo}>Página {page} de {totalPages}</span>
        <button className={styles.pageBtn} onClick={next} disabled={page >= totalPages}>Siguiente</button>
      </div>
    </div>
  )
}
