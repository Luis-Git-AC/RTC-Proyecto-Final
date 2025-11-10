import { useState, useEffect, useCallback } from 'react'
import { fetchCryptoPanicNews } from '../services/cryptoPanic'

const CACHE_KEY = 'cryptopanic_news_cache_v1'
const CACHE_TTL_MS = 30 * 60 * 1000

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.timestamp || !parsed?.data) return null
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL_MS
    return isExpired ? null : parsed
  } catch (err) {
    console.warn('No se pudo leer la cache de noticias:', err)
    return null
  }
}

function writeCache(data) {
  try {
    const payload = JSON.stringify({ data, timestamp: Date.now() })
    sessionStorage.setItem(CACHE_KEY, payload)
  } catch (err) {
    console.warn('No se pudo guardar la cache de noticias:', err)
  }
}

function useNoticias() {
  const [noticias, setNoticias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroMoneda, setFiltroMoneda] = useState('todas')
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadNews = useCallback(async ({ ignoreCache = false } = {}) => {
    const cached = !ignoreCache ? readCache() : null

    if (cached) {
      setNoticias(cached.data)
      setLastUpdated(cached.timestamp)
      return
    }

    const controller = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const data = await fetchCryptoPanicNews({ signal: controller.signal })
      setNoticias(data)
      const timestamp = Date.now()
      setLastUpdated(timestamp)
      writeCache(data)
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Error al obtener noticias:', err)
      setError(err.message ?? 'Error al obtener noticias')
    } finally {
      setLoading(false)
    }

    return () => controller.abort()
  }, [])

  useEffect(() => {
    loadNews()
  }, [loadNews])

  const refresh = useCallback(() => {
    loadNews({ ignoreCache: true })
  }, [loadNews])

  const noticiasFiltradas = noticias.filter(noticia => {
    if (filtroMoneda === 'todas') return true
    return noticia.moneda.toLowerCase() === filtroMoneda.toLowerCase()
  })

  const obtenerNoticiaPorId = (id) => {
    return noticias.find(noticia => noticia.id === parseInt(id))
  }

  const cambiarFiltroMoneda = (nuevaMoneda) => {
    setFiltroMoneda(nuevaMoneda)
  }

  const monedasDisponibles = [...new Set(noticias.map(n => n.moneda))]

  return {
    noticias: noticiasFiltradas,
    loading,
    error,
    filtroMoneda,
    obtenerNoticiaPorId,
    cambiarFiltroMoneda,
    monedasDisponibles,
    totalNoticias: noticias.length,
    refresh,
    lastUpdated
  }
}

export default useNoticias