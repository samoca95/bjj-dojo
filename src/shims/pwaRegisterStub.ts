// Stub for `virtual:pwa-register/react` used when building for native
// (Capacitor) where vite-plugin-pwa is disabled. Returns a no-op hook so
// PwaUpdatePrompt renders nothing on native.

export function useRegisterSW() {
  return {
    needRefresh: [false, () => {}] as const,
    offlineReady: [false, () => {}] as const,
    updateServiceWorker: async (_reloadPage?: boolean) => {},
  }
}
