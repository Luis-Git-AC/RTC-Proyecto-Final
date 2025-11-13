import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { useNavigate } from 'react-router-dom'
import { createResource } from '../../services/resources'

const categories = ['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro']
const types = ['pdf', 'image', 'guide']

export default function SubirRecurso() {
  const { isAuthenticated, token } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('pdf')
  const [category, setCategory] = useState(categories[0])
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true, state: { from: { pathname: '/recursos/nuevo' } } })
  }, [isAuthenticated, navigate])

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]
    setFile(f || null)
    if (f && type === 'image') {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(f)
    } else {
      setPreview('')
    }
  }

  const disabled = loading || !title.trim() || !description.trim() || !file

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
    form.append('file', file)
    try {
      await createResource(token, form)
      navigate('/recursos', { replace: true })
    } catch (e) {
      setError(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const accept = type === 'image' ? 'image/*' : (type === 'pdf' ? 'application/pdf' : '*/*')

  return (
    <div style={{ maxWidth: 900, margin: '1.5rem auto', padding: '0 1rem' }}>
      <h2>Subir recurso</h2>
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
          <label>Archivo</label>
          <input type="file" accept={accept} onChange={onFile} />
          {preview && <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }} />}
        </div>
        <button type="submit" disabled={disabled}>{loading ? 'Subiendo…' : 'Subir'}</button>
      </form>
    </div>
  )
}
