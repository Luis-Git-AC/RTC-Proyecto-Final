import styles from './ResourceCard.module.css'

export default function ResourceCard({ resource, canManage, busy, onEdit, onDelete }) {
  const ownerName = resource.userId && (resource.userId.username || '')
  const category = resource.category || 'otro'
  const type = resource.type || ''

  const categoryClass =
    category === 'análisis-técnico' ? styles.chipAnalisis :
    category === 'fundamentos' ? styles.chipFundamentos :
    category === 'trading' ? styles.chipTrading :
    category === 'seguridad' ? styles.chipSeguridad :
    category === 'defi' ? styles.chipDefi :
    styles.chipOtro

  const typeClass =
    type === 'pdf' ? styles.chipPdf :
    type === 'image' ? styles.chipImage :
    type === 'guide' ? styles.chipGuide :
    styles.chipOtro

  return (
    <article className={styles.card}>

      <h3 className={styles.title}>
        <a href={resource.fileUrl} target="_blank" rel="noreferrer">{resource.title}</a>
      </h3>

      <div className={styles.meta}>
        <span className={`${styles.chip} ${categoryClass}`}>{category}</span>
        <span className={`${styles.chip} ${typeClass}`}>{type}</span>
      </div>

      <p className={styles.description}>{resource.description}</p>

      <div className={styles.footer}>
        <span className={styles.owner}>{ownerName && `por ${ownerName}`}</span>
        <div className={styles.actions}>
          {canManage && (
            <>
              <button className={styles.smallBtn} onClick={onEdit}>Editar</button>
              <button className={styles.smallBtn} onClick={onDelete} disabled={busy}>{busy ? '…' : 'Eliminar'}</button>
            </>
          )}
          <a className={styles.openBtn} href={resource.fileUrl} target="_blank" rel="noreferrer" aria-label={`Abrir recurso: ${resource.title}`}>Abrir</a>
        </div>
      </div>
    </article>
  )
}

