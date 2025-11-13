import { Link } from 'react-router-dom'
import styles from './PostCard.module.css'

export default function PostCard({ post }) {
  const authorName = post.userId ? post.userId.username : 'Desconocido'
  const avatar = post.userId && post.userId.avatar ? post.userId.avatar : ''
  const likeCount = Array.isArray(post.likes) ? post.likes.length : 0
  const category = String(post.category || '').toLowerCase()
  const chipClass =
    category === 'análisis' ? styles.chipAnalisis :
    category === 'tutorial' ? styles.chipTutorial :
    category === 'experiencia' ? styles.chipExperiencia :
    category === 'pregunta' ? styles.chipPregunta : styles.chip

  return (
    <article className={styles.card}>
      <div className={styles.content}>
        <h3 className={styles.title}>
          <Link to={`/foro/${post._id}`}>{post.title}</Link>
        </h3>
        <div className={styles.meta}>
          {avatar && <img className={styles.avatar} src={avatar} alt={authorName} />}
          <span>{authorName}</span>
          <span className={`${styles.chip} ${chipClass}`}>{post.category}</span>
          <span className={styles.spacer} />
          <span className={styles.likes}><span className={styles.heart}>❤</span> {likeCount}</span>
        </div>
      </div>
    </article>
  )
}
