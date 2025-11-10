import { useState, useEffect, useMemo, useCallback } from 'react'
import PortfolioContext from './PortfolioContext'

const STORAGE_KEY = 'portfolio_v1'

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch (err) {
    console.warn('No se pudo leer el portfolio desde localStorage:', err)
    return []
  }
}

function writeStorage(portfolio) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio))
  } catch (err) {
    console.warn('No se pudo guardar el portfolio en localStorage:', err)
  }
}

function sanitizeCoin(coin) {
  const {
    id,
    symbol,
    name,
    image,
    currentPrice,
    marketCap,
    marketCapRank,
    priceChangePercentage24h,
    totalVolume,
    cantidad
  } = coin

  return {
    id,
    symbol,
    name,
    image,
    currentPrice,
    marketCap,
    marketCapRank,
    priceChangePercentage24h,
    totalVolume,
    cantidad: cantidad || 1,
    addedAt: Date.now()
  }
}

function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(() => readStorage())

  useEffect(() => {
    writeStorage(portfolio)
  }, [portfolio])

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
