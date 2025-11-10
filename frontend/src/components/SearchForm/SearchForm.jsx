import { useState, useRef } from 'react'
import styles from './SearchForm.module.css'

export function SearchForm({ 
  onSearch, 
  placeholder = 'Buscar...', 
  defaultValue = '',
  label = 'Buscar'
}) {
  const [query, setQuery] = useState(defaultValue)
  const inputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    onSearch(value.trim())
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="search-input" className="sr-only">
        {label}
      </label>
      <div className={styles.wrapper}>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.input}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className={styles.clear}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
        <button type="submit" className={styles.submit} aria-label="Buscar">
          🔍
        </button>
      </div>
    </form>
  )
}
