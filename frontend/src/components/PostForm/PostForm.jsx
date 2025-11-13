import { useEffect, useState } from 'react'
import { createPost, getPost, updatePost } from '../../services/posts'
import { useAuth } from '../../context/useAuth'
import { useNavigate, useParams } from 'react-router-dom'

const categories = ['análisis', 'tutorial', 'experiencia', 'pregunta']

export default function PostForm({ mode }) {
  const { token, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = mode === 'edit'
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true, state: { from: { pathname: isEdit ? `/foro/editar/${id}` : '/foro/nuevo' } } })
  }, [isAuthenticated, navigate, isEdit, id])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!isEdit || !id) return
      setLoading(true)
      try {
        const data = await getPost(id)
        if (active && data.post) {
          setTitle(data.post.title || '')
          setContent(data.post.content || '')
          setCategory(data.post.category || categories[0])
          if (data.post.image) setImagePreview(data.post.image)
        }
      } catch (e) {
        if (active) setError(e.message || 'Error')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [isEdit, id])

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0]
    setImageFile(file || null)
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setImagePreview('')
    }
  }

  const disabled = loading || title.trim().length < 5 || content.trim().length < 10

  const submit = async (e) => {
    e.preventDefault()
    if (disabled) return
    setLoading(true)
    setError('')
    const form = new FormData()
    form.append('title', title.trim())
    form.append('content', content.trim())
    form.append('category', category)
    if (imageFile) form.append('image', imageFile)
    try {
      let result
      if (isEdit) {
        result = await updatePost(token, id, form)
      } else {
        result = await createPost(token, form)
      }
      const postId = result.post ? result.post._id : null
      navigate(postId ? `/foro/${postId}` : '/foro')
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem' }}>
      <h2>{isEdit ? 'Editar post' : 'Nuevo post'}</h2>
      {error && <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
          <small style={{ color: '#666' }}>{title.length}/200</small>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Categoría</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Contenido</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={10} />
          <small style={{ color: '#666' }}>{content.length} caracteres</small>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Imagen (opcional)</label>
          <input type="file" accept="image/*" onChange={onFile} />
          {imagePreview && <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }} />}
        </div>
        <button type="submit" disabled={disabled}>{loading ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear')}</button>
      </form>
    </div>
  )
}
