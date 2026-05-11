import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyAppTheme, getAppTheme } from './utils/theme'
import ErrorBoundary from './components/ErrorBoundary'
import { setupGlobalErrorTelemetry } from './utils/telemetry'

applyAppTheme(getAppTheme())
setupGlobalErrorTelemetry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
