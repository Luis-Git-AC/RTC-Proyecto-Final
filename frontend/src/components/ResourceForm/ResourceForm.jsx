import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { useNavigate, useParams } from 'react-router-dom'
import { createResource, getResource, updateResource } from '../../services/resources'

const categories = ['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro']
const types = ['pdf', 'image', 'guide']

export default function ResourceForm({ mode }) {
  const isEdit = mode === 'edit'
  const { id } = useParams()
  const { isAuthenticated, token, user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('pdf')
  const [category, setCategory] = useState(categories[0])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [existingUrl, setExistingUrl] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true, state: { from: { pathname: isEdit ? `/recursos/editar/${id}` : '/recursos/nuevo' } } })
  }, [isAuthenticated, navigate, isEdit, id])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!isEdit || !id) return
      setLoading(true)
      try {
        const data = await getResource(id)
        if (active && data.resource) {
          setTitle(data.resource.title || '')
          setDescription(data.resource.description || '')
          setType(data.resource.type || 'pdf')
          setCategory(data.resource.category || categories[0])
          setExistingUrl(data.resource.fileUrl || '')
          setOwnerId(data.resource.userId && (data.resource.userId._id || data.resource.userId))
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

  useEffect(() => {
    if (!isEdit) return
    if (!user || !ownerId) return
    const isOwner = String(ownerId) === String(user._id)
    const isAdmin = user.role === 'admin'
    if (!isOwner && !isAdmin) navigate('/recursos', { replace: true })
  }, [isEdit, ownerId, user, navigate])

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]
    setFile(f || null)
    if (f && (type === 'image')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(f)
    } else {
      setPreview('')
    }
  }

  const disabled = loading || !title.trim() || !description.trim() || (!isEdit && !file)

  const submit = async (e) => {
    e.preventDefault()
    if (disabled) return
    setLoading(true)
    setError('')
    const form = new FormData()
    form.append('title', title.trim())
    form.append('description', description.trim())
    form.append('type', type)
    form.append('category', category)
    if (file) form.append('file', file)
    try {
      if (isEdit) {
        await updateResource(token, id, form)
      } else {
        await createResource(token, form)
      }
      navigate('/recursos')
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const accept = type === 'image' ? 'image/*' : (type === 'pdf' ? 'application/pdf' : '*/*')

  return (
    <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem' }}>
      <h2>{isEdit ? 'Editar recurso' : 'Subir recurso'}</h2>
      {error && <div style={{ color: 'crimson', marginBottom: '0.75rem' }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Título</label>
          <input value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>Descripción</label>
          <textarea rows={6} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label>Tipo</label>
            <select value={type} onChange={e => { setType(e.target.value); setPreview('') }}>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label>Categoría</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label>{isEdit ? 'Reemplazar archivo (opcional)' : 'Archivo'}</label>
          {isEdit && existingUrl && type === 'image' && !preview && (
            <img src={existingUrl} alt="actual" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 }} />
          )}
          {isEdit && existingUrl && type !== 'image' && !preview && (
            <a href={existingUrl} target="_blank" rel="noreferrer">Ver archivo actual</a>
          )}
          <input type="file" accept={accept} onChange={onFile} />
          {preview && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 8 }} />}
        </div>
        <button type="submit" disabled={disabled}>{loading ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Subir')}</button>
      </form>
    </div>
  )
}
