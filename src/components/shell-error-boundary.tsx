"use client"

import { Component, type ReactNode } from "react"

type Props = { children: ReactNode }
type State = { failed: boolean }

export default class ShellErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    try {
      const raw = localStorage.getItem("deriva-error-log")
      const log = raw ? (JSON.parse(raw) as { at: number; message: string; source: string }[]) : []
      log.unshift({ at: Date.now(), message: String((error as Error)?.message ?? error).slice(0, 240), source: "react-boundary" })
      localStorage.setItem("deriva-error-log", JSON.stringify(log.slice(0, 6)))
    } catch {}
  }

  render() {
    if (this.state.failed) {
      return (
        <div style={{ minHeight: "60dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <p style={{ fontWeight: 700, marginBottom: 10 }}>Something interrupted this view.</p>
            <button type="button" className="super-primary" onClick={() => window.location.reload()}>Reload Deriva</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
