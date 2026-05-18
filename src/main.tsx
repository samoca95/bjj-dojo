import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyAppTheme, getAppTheme } from './utils/theme'
import ErrorBoundary from './components/ErrorBoundary'
import { setupGlobalErrorTelemetry } from './utils/telemetry'
import { purgeLegacyAutoBackupKeys } from './utils/autoBackup/settings'
import { verifyFolderConnection } from './utils/autoBackup/destinations/fileSystem'

applyAppTheme(getAppTheme())
setupGlobalErrorTelemetry()
// One-shot cleanup of localStorage keys from the retired GitHub destination.
purgeLegacyAutoBackupKeys()
// Probe the saved folder handle so the Settings indicator is accurate before
// the first mutation — handles often lose permission across browser restarts.
void verifyFolderConnection().catch(() => {
  // best-effort; FS API not supported in this browser is fine.
})

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
