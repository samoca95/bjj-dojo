import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyAppTheme, getAppTheme } from './utils/theme'
import ErrorBoundary from './components/ErrorBoundary'
import { setupGlobalErrorTelemetry } from './utils/telemetry'

applyAppTheme(getAppTheme())
setupGlobalErrorTelemetry()

// Ask the browser to mark our origin as persistent so IndexedDB is not
// evicted under storage pressure. Best-effort; safe to ignore the promise.
if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
  void navigator.storage.persist()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
