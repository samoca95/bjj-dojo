import { Component, type ReactNode } from 'react'
import { telemetry } from '../utils/telemetry'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    telemetry.error('ui.error_boundary', {
      error,
      componentStack: info.componentStack,
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleTryAgain = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-zinc-900 rounded-2xl p-5 space-y-3">
          <h1 className="text-lg font-bold text-gold">Something went wrong</h1>
          <p className="text-sm text-zinc-300">The page crashed. You can retry or reload the app to recover.</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={this.handleTryAgain}
              className="rounded-xl px-3 py-2 bg-zinc-800 text-zinc-100 text-sm font-semibold"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="rounded-xl px-3 py-2 bg-gold text-black text-sm font-semibold"
            >
              Reload app
            </button>
          </div>
        </div>
      </div>
    )
  }
}
