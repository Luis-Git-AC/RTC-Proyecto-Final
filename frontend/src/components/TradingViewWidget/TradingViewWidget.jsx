import { useEffect, useRef } from 'react'

export default function TradingViewWidget({ symbol = 'BTCUSDT', theme = 'light', height = 400 }) {
  const container = useRef(null)

  useEffect(() => {
    if (!container.current) return
    const el = container.current
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbols: [[symbol]],
      chartOnly: false,
      width: '100%',
      height,
      locale: 'es',
      colorTheme: theme,
      autosize: false,
      showVolume: true,
      showMA: true
    })
    el.appendChild(script)
    return () => { el.innerHTML = '' }
  }, [symbol, theme, height])

  return (
    <div className="tradingview-widget-container">
      <div ref={container} className="tradingview-widget-container__widget" />
    </div>
  )
}
