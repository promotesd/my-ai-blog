import { Component, type ErrorInfo, type ReactNode } from "react"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render failed", error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="min-h-screen bg-baseBackground text-black dark:text-white flex items-center justify-center p-6">
        <div className="max-w-lg rounded-lg border border-red-500/30 bg-red-500/10 p-5">
          <h1 className="text-lg font-semibold">Application failed to render</h1>
          <p className="mt-2 text-sm opacity-80">{this.state.error.message}</p>
        </div>
      </main>
    )
  }
}
