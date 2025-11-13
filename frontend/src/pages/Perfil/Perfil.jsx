import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { getPosts } from '../../services/posts'
import { getResources } from '../../services/resources'
import { updateProfile } from '../../services/users'
import styles from './Perfil.module.css'

export default function Perfil() {
  const { user, token, loadCurrentUser, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [wallet, setWallet] = useState('')
  const [password, setPassword] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [myPosts, setMyPosts] = useState([])
  const [myResources, setMyResources] = useState([])
  const [loadingLists, setLoadingLists] = useState(false)

  useEffect(() => {
    if (!user) return
    setUsername(user.username || '')
    setEmail(user.email || '')
    setWallet(user.wallet_address || '')
    setAvatarPreview(user.avatar || '')
  }, [user])

  useEffect(() => {
    let active = true
    const load = async () => {
      if (!user) return
      setLoadingLists(true)
      try {
        const [p, r] = await Promise.all([
          getPosts({ userId: user._id, limit: 5 }),
          getResources({ userId: user._id, limit: 5 })
        ])
        if (!active) return
        setMyPosts(p.posts || [])
        setMyResources(r.resources || [])
      } catch {
        // revisar !! bloqueo UI
      } finally {
        if (active) setLoadingLists(false)
      }
    }
    load()
    return () => { active = false }
  }, [user])

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0]
    setAvatarFile(f || null)
    if (f) {
      const reader = new FileReader()
      reader.onload = () => setAvatarPreview(reader.result)
      reader.readAsDataURL(f)
    } else {
      setAvatarPreview(user?.avatar || '')
    }
  }

  const disabled = useMemo(() => {
    if (!isAuthenticated) return true
    if (saving) return true
    return !username.trim() || !email.trim()
  }, [isAuthenticated, saving, username, email])

  const submit = async (e) => {
    e.preventDefault()
    if (disabled) return
    setSaving(true)
    setError('')
    setSuccess('')
    const form = new FormData()
    form.append('username', username.trim())
    form.append('email', email.trim())
    if (wallet) form.append('wallet_address', wallet.trim())
    if (password) form.append('password', password)
    if (avatarFile) form.append('image', avatarFile)
    try {
      await updateProfile(token, form)
      await loadCurrentUser()
      setPassword('')
      setSuccess('Perfil actualizado')
    } catch (e) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <form onSubmit={submit} className={styles.profileGrid}>
        <div className={styles.avatarCard}>
          <div className={styles.avatarCircle}>
            {avatarPreview && <img src={avatarPreview} alt="avatar" />}
          </div>
          <label className={styles.fileLabel}>
            <input type="file" accept="image/*" onChange={onFile} className={styles.fileInput} />
            Seleccionar imagen
          </label>
        </div>
        <div className={styles.formCard}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <label>Wallet (opcional)</label>
              <input value={wallet} onChange={e => setWallet(e.target.value)} placeholder="0x..." />
            </div>
            <div className={styles.field}>
              <label>Contraseña (opcional)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" />
            </div>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={disabled}>{saving ? 'Guardando…' : 'Guardar perfil'}</button>
        </div>
      </form>

      <div className={styles.listsGrid}>
        <section className={styles.listCard}>
          <h3 className={styles.sectionTitle}>Mis posts</h3>
          {loadingLists && <div className={styles.muted}>Cargando…</div>}
          {!loadingLists && myPosts.length === 0 && <div className={styles.muted}>Aún no tienes posts</div>}
          <ul className={styles.items}>
            {myPosts.map(p => (
              <li key={p._id} className={styles.itemRow}>
                <a href={`/foro/${p._id}`} className={styles.itemLink}>{p.title}</a>
                <span className={styles.itemMeta}>{p.category}</span>
                <a href={`/foro/editar/${p._id}`} className={styles.itemEdit}>Editar</a>
              </li>
            ))}
          </ul>
        </section>
        <section className={styles.listCard}>
          <h3 className={styles.sectionTitle}>Mis recursos</h3>
          {loadingLists && <div className={styles.muted}>Cargando…</div>}
          {!loadingLists && myResources.length === 0 && <div className={styles.muted}>Aún no tienes recursos</div>}
          <ul className={styles.items}>
            {myResources.map(r => (
              <li key={r._id} className={styles.itemRow}>
                <a href={r.fileUrl} target="_blank" rel="noreferrer" className={styles.itemLink}>{r.title}</a>
                <span className={styles.itemMeta}>{r.category} • {r.type}</span>
                <a href={`/recursos/editar/${r._id}`} className={styles.itemEdit}>Editar</a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
