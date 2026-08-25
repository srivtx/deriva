"use client"

import { useEffect } from "react"

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <main className="error-boundary">
      <span>DERIVA / SOMETHING BROKE</span>
      <h1>This surface hit an error.</h1>
      <p>Your saved progress is safe on this device. Try again, or reload the whole workspace.</p>
      <div className="error-boundary-actions">
        <button type="button" onClick={reset}>Try again</button>
        <button type="button" className="error-boundary-reload" onClick={() => window.location.reload()}>Reload workspace</button>
      </div>
    </main>
  )
}
