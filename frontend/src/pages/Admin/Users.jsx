import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../../context/useAuth'
import { listUsers, deleteUser } from '../../services/users'

export default function AdminUsers() {
  const { user, token } = useAuth()
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalPages, setTotalPages] = useState(1)
  const [busyDelete, setBusyDelete] = useState(null)

  const isAdmin = user && user.role === 'admin'

  const load = useCallback(async (p) => {
    if (!isAdmin) return
    setLoading(true)
    try {
      const data = await listUsers(token, { page: p, limit })
      setItems(data.users || [])
      setTotalPages(data.pagination ? data.pagination.pages : 1)
      setError('')
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }, [token, limit, isAdmin])

  useEffect(() => { load(page) }, [page, load])

  const next = () => { if (page < totalPages) setPage(page + 1) }
  const prev = () => { if (page > 1) setPage(page - 1) }

  if (!isAdmin) return <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem', color: 'crimson' }}>Acceso restringido</div>

  return (
    <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem' }}>
      <h2>Usuarios</h2>
      {loading && <div>Cargando…</div>}
      {error && <div style={{ color: 'crimson' }}>{error}</div>}
      {!loading && !error && items.length === 0 && <div>No hay usuarios</div>}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
            <th style={{ padding: '0.5rem' }}>Username</th>
            <th style={{ padding: '0.5rem' }}>Email</th>
            <th style={{ padding: '0.5rem' }}>Rol</th>
            <th style={{ padding: '0.5rem' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(u => (
            <tr key={u._id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>{u.username}</td>
              <td style={{ padding: '0.5rem' }}>{u.email}</td>
              <td style={{ padding: '0.5rem' }}>{u.role}</td>
              <td style={{ padding: '0.5rem' }}>
                <button
                  disabled={busyDelete === u._id || u._id === user._id}
                  onClick={async () => {
                    if (busyDelete) return
                    const ok = window.confirm('¿Eliminar usuario y su contenido?')
                    if (!ok) return
                    setBusyDelete(u._id)
                    try {
                      await deleteUser(token, u._id)
                      setItems(items.filter(x => x._id !== u._id))
                    } catch (e) {
                      setError(e.message || 'Error al eliminar')
                    } finally {
                      setBusyDelete(null)
                    }
                  }}
                >{busyDelete === u._id ? '...' : 'Eliminar'}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        <button onClick={prev} disabled={page <= 1}>Anterior</button>
        <span>Página {page} de {totalPages}</span>
        <button onClick={next} disabled={page >= totalPages}>Siguiente</button>
      </div>
    </div>
  )
}
