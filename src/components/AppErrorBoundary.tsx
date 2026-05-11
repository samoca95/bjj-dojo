import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logError } from '../utils/telemetry'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  message: string
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('ui.error-boundary', error, { componentStack: info.componentStack })
  }

  handleReload = () => {
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-zinc-900 rounded-2xl p-5 space-y-3">
          <h1 className="text-lg font-bold text-gold">Something went wrong</h1>
          <p className="text-sm text-zinc-300">The app hit an unexpected error. Your data should still be available locally.</p>
          {this.state.message && <p className="text-xs text-zinc-500">{this.state.message}</p>}
          <button
            onClick={this.handleReload}
            className="w-full rounded-xl bg-gold text-black text-sm font-semibold py-2.5 active:bg-gold-light"
          >
            Reload app
          </button>
        </div>
      </div>
    )
  }
}
