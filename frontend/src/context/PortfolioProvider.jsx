import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import PortfolioContext from './PortfolioContext'
import { useAuth } from './useAuth'
import { getPortfolio as apiGetPortfolio, savePortfolio as apiSavePortfolio } from '../services/portfolio'

const STORAGE_KEY = 'portfolio_v1'

function storageKeyFor(userId) {
  return `${STORAGE_KEY}:${userId || 'guest'}`
}

function readStorage(userId) {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (err) {
    console.warn('No se pudo leer el portfolio desde localStorage:', err)
    return []
  }
}

function writeStorage(userId, portfolio) {
  try {
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(portfolio))
  } catch (err) {
    console.warn('No se pudo guardar el portfolio en localStorage:', err)
  }
}

function sanitizeCoin(coin) {
  const { id, cantidad } = coin
  return {
    id,
    cantidad: cantidad || 1,
    addedAt: Date.now()
  }
}

function PortfolioProvider({ children }) {
  const { user, token, isAuthenticated } = useAuth()
  const [portfolio, setPortfolio] = useState([])
  const syncingRef = useRef(false)
  const lastSyncedSnapshotRef = useRef('')

  useEffect(() => {
    const uid = user?._id || null
    const localItems = readStorage(uid)
    setPortfolio(localItems)
  }, [user?._id])

  useEffect(() => {
    let cancelled = false
    if (!isAuthenticated || !token) return
    ;(async () => {
      try {
        const data = await apiGetPortfolio(token)
        if (cancelled) return
        const mapped = (data?.items || []).map(({ coinId, amount, addedAt }) => ({
          id: String(coinId),
          cantidad: Number(amount) || 0,
          addedAt: addedAt ? new Date(addedAt).getTime() : Date.now(),
        }))
        setPortfolio(mapped)
        writeStorage(user?._id, mapped)
        lastSyncedSnapshotRef.current = JSON.stringify(
          mapped.map(({ id, cantidad }) => ({ coinId: id, amount: cantidad || 0 }))
        )
      } catch (err) {
        console.warn('No se pudo obtener el portfolio del servidor:', err?.message || err)
      }
    })()
    return () => { cancelled = true }
  }, [isAuthenticated, token, user?._id])

  useEffect(() => {
    writeStorage(user?._id, portfolio)
  }, [portfolio, user?._id])

  useEffect(() => {
    if (!isAuthenticated || !token) return
    const payloadItems = portfolio.map(({ id, cantidad }) => ({ coinId: id, amount: cantidad || 0 }))
    const snapshot = JSON.stringify(payloadItems)
    if (snapshot === lastSyncedSnapshotRef.current) return

    const timer = setTimeout(async () => {
      if (syncingRef.current) return
      try {
        syncingRef.current = true
        await apiSavePortfolio(token, payloadItems)
        lastSyncedSnapshotRef.current = snapshot
      } catch (err) {
        console.warn('No se pudo sincronizar el portfolio con el servidor:', err?.message || err)
      } finally {
        syncingRef.current = false
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [portfolio, isAuthenticated, token])

  const isInPortfolio = useCallback(
    (coinId) => portfolio.some((item) => item.id === coinId),
    [portfolio]
  )

  const addCoin = useCallback((coin) => {
    setPortfolio((prev) => {
      if (prev.some((item) => item.id === coin.id)) {
        return prev
      }
      return [...prev, sanitizeCoin(coin)]
    })
  }, [])

  const removeCoin = useCallback((coinId) => {
    setPortfolio((prev) => prev.filter((item) => item.id !== coinId))
  }, [])

  const toggleCoin = useCallback(
    (coin) => {
      setPortfolio((prev) => {
        const exists = prev.some((item) => item.id === coin.id)
        if (exists) {
          return prev.filter((item) => item.id !== coin.id)
        }
        return [...prev, sanitizeCoin(coin)]
      })
    },
    []
  )

  const clearPortfolio = useCallback(() => {
    setPortfolio([])
  }, [])

  const updateCoinQuantity = useCallback((coinId, newQuantity) => {
    setPortfolio((prev) =>
      prev.map((coin) => {
        if (coin.id === coinId) {
          const parsedValue = parseFloat(newQuantity)
          const cantidad = isNaN(parsedValue) ? 0 : Math.max(0, parsedValue)
          return { ...coin, cantidad }
        }
        return coin
      })
    )
  }, [])

  const value = useMemo(
    () => ({
      portfolio,
      addCoin,
      removeCoin,
      toggleCoin,
      clearPortfolio,
      updateCoinQuantity,
      isInPortfolio
    }),
    [portfolio, addCoin, removeCoin, toggleCoin, clearPortfolio, updateCoinQuantity, isInPortfolio]
  )

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  )
}

export default PortfolioProvider
