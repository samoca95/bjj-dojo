import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyAppTheme, getAppTheme } from './utils/theme'
import { logError, logEvent } from './utils/telemetry'

applyAppTheme(getAppTheme())

window.addEventListener('error', event => {
  logError('window.error', event.error ?? event.message, {
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
  })
})

window.addEventListener('unhandledrejection', event => {
  logError('window.unhandledrejection', event.reason)
})

window.addEventListener('online', () => logEvent('network.online', 'App came online'))
window.addEventListener('offline', () => logEvent('network.offline', 'App went offline'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
