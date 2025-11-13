import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPost, toggleLike, deletePost } from '../../services/posts'
import { getComments, createComment, deleteComment, updateComment } from '../../services/comments'
import { useAuth } from '../../context/useAuth'

export default function PostDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, token, user } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liking, setLiking] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [comments, setComments] = useState([])
  const [commentContent, setCommentContent] = useState('')
  const [commentsError, setCommentsError] = useState('')
  const [posting, setPosting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingContent, setEditingContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await getPost(id)
        if (active) setPost(data.post)
        try {
          const list = await getComments({ postId: id, limit: 50 })
          if (active) {
            setComments(list.comments || [])
            setCommentsError('')
          }
        } catch (ce) {
          if (active) setCommentsError(ce.message || 'Error al cargar comentarios')
        }
      } catch (e) {
        if (active) setError(e.message || 'Error')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [id])

  const hasLiked = () => {
    if (!post || !user) return false
    if (!Array.isArray(post.likes)) return false
    return post.likes.some(l => String(l) === String(user._id))
  }

  const likeToggle = async () => {
    if (!isAuthenticated) return navigate('/login', { replace: true, state: { from: { pathname: `/foro/${id}` } } })
    if (!post || liking) return
    setLiking(true)
    const optimistic = { ...post }
    const already = hasLiked()
    if (already) {
      optimistic.likes = optimistic.likes.filter(l => String(l) !== String(user._id))
    } else {
      optimistic.likes = [...optimistic.likes, String(user._id)]
    }
    setPost(optimistic)
    try {
      await toggleLike(token, id)
    } catch {
      setPost(post)
    } finally {
      setLiking(false)
    }
  }

  const isOwner = () => {
    if (!post || !user) return false
    const ownerId = post.userId && (post.userId._id || post.userId)
    return String(ownerId) === String(user._id)
  }

  const isAdmin = () => user && user.role === 'admin'

  const canManage = () => isOwner() || isAdmin()

  const onEdit = () => {
    if (!canManage()) return
    navigate(`/foro/editar/${id}`)
  }

  const onDelete = async () => {
    if (!canManage() || deleting) return
    const ok = window.confirm('¿Eliminar este post? Esta acción no se puede deshacer.')
    if (!ok) return
    setDeleting(true)
    setError('')
    try {
      await deletePost(token, id)
      navigate('/foro', { replace: true })
    } catch (e) {
      setError(e.message || 'Error al eliminar')
    } finally {
      setDeleting(false)
    }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) return navigate('/login', { replace: true, state: { from: { pathname: `/foro/${id}` } } })
    if (!commentContent.trim() || posting) return
    setPosting(true)
    try {
      const result = await createComment(token, { postId: id, content: commentContent.trim() })
      setComments([result.comment, ...comments])
      setCommentContent('')
    } catch (e) {
      setCommentsError(e.message || 'Error al publicar comentario')
    } finally {
      setPosting(false)
    }
  }

  const isCommentOwner = (c) => user && c.userId && (c.userId._id ? String(c.userId._id) : String(c.userId)) === String(user._id)
  const isCommentAdmin = () => user && user.role === 'admin'
  const canDeleteComment = (c) => isCommentOwner(c) || isCommentAdmin()

  const startEdit = (c) => {
    if (!isCommentOwner(c)) return
    setEditingId(c._id)
    setEditingContent(c.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingContent('')
    setEditSaving(false)
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    if (!editingId || editSaving) return
    if (!editingContent.trim()) return
    setEditSaving(true)
    try {
      const result = await updateComment(token, editingId, { content: editingContent.trim() })
      setComments(comments.map(c => c._id === editingId ? result.comment : c))
      cancelEdit()
    } catch (e) {
      setCommentsError(e.message || 'Error al guardar edición')
    } finally {
      setEditSaving(false)
    }
  }

  const removeComment = async (c) => {
    if (!canDeleteComment(c) || deleteBusy) return
    const ok = window.confirm('¿Eliminar comentario?')
    if (!ok) return
    setDeleteBusy(c._id)
    try {
      await deleteComment(token, c._id)
      setComments(comments.filter(x => x._id !== c._id))
    } catch (e) {
      setCommentsError(e.message || 'Error al eliminar comentario')
    } finally {
      setDeleteBusy(null)
    }
  }

  if (loading) return <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem' }}>Cargando…</div>
  if (error) return <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem', color: 'crimson' }}>{error}</div>
  if (!post) return null

  const likeCount = Array.isArray(post.likes) ? post.likes.length : 0

  return (
    <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem' }}>
      <h2>{post.title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {post.userId && post.userId.avatar ? <img src={post.userId.avatar} alt={post.userId.username} style={{ width: 36, height: 36, borderRadius: '50%' }} /> : null}
        <span>{post.userId ? post.userId.username : ''}</span>
        <span style={{ marginLeft: 'auto' }}>{post.category}</span>
      </div>
      {error && <div style={{ color: 'crimson', marginBottom: '0.5rem' }}>{error}</div>}
      {post.image ? <img src={post.image} alt={post.title} style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8, marginBottom: '1rem' }} /> : null}
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{post.content}</p>
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button onClick={likeToggle} disabled={liking}>{hasLiked() ? 'Quitar like' : 'Dar like'}</button>
        <span>{likeCount} ❤</span>
        {canManage() && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button onClick={onEdit}>Editar</button>
            <button onClick={onDelete} disabled={deleting}>{deleting ? 'Eliminando…' : 'Eliminar'}</button>
          </div>
        )}
      </div>
      <hr style={{ margin: '1.5rem 0' }} />
      <h3>Comentarios</h3>
      {commentsError && <div style={{ color: 'crimson', marginBottom: '0.5rem' }}>{commentsError}</div>}
      <form onSubmit={submitComment} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <textarea
          rows={4}
          placeholder={isAuthenticated ? 'Escribe un comentario…' : 'Inicia sesión para comentar'}
          value={commentContent}
          onChange={e => setCommentContent(e.target.value)}
          disabled={!isAuthenticated || posting}
        />
        <button type="submit" disabled={!isAuthenticated || posting || !commentContent.trim()}>{posting ? 'Publicando…' : 'Comentar'}</button>
      </form>
      {comments.length === 0 && <div style={{ color: '#666' }}>No hay comentarios</div>}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {comments.map(c => {
          const editing = editingId === c._id
          return (
            <li key={c._id} style={{ border: '1px solid #ddd', padding: '0.75rem', borderRadius: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                {c.userId && c.userId.avatar ? <img src={c.userId.avatar} alt={c.userId.username} style={{ width: 28, height: 28, borderRadius: '50%' }} /> : null}
                <strong style={{ fontSize: 14 }}>{c.userId ? c.userId.username : 'Desconocido'}</strong>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#666' }}>{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              {editing ? (
                <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <textarea
                    rows={3}
                    value={editingContent}
                    onChange={e => setEditingContent(e.target.value)}
                    disabled={editSaving}
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" disabled={editSaving || !editingContent.trim()}>{editSaving ? 'Guardando…' : 'Guardar'}</button>
                    <button type="button" onClick={cancelEdit} disabled={editSaving}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{c.content}</p>
              )}
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                {isCommentOwner(c) && !editing && <button onClick={() => startEdit(c)}>Editar</button>}
                {canDeleteComment(c) && <button onClick={() => removeComment(c)} disabled={deleteBusy === c._id}>{deleteBusy === c._id ? 'Eliminando…' : 'Eliminar'}</button>}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
