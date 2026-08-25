// Self-healing for stale-deploy clients: when an open PWA tab survives a
// deployment, its in-memory chunks may no longer exist on the server. Failed
// lazy loads then leave blank routes with a live shell. We detect those
// failures, purge the stale service-worker caches once, and reload into the
// fresh build.

const RECOVERY_FLAG = "deriva-chunk-recovery"

function recoverFromStaleDeploy(reason: string) {
  try {
    if (!navigator.onLine) return
    if (sessionStorage.getItem(RECOVERY_FLAG)) return
    sessionStorage.setItem(RECOVERY_FLAG, String(Date.now()))
    if ("caches" in window) {
      caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key))))
    }
    console.warn(`[deriva] stale deploy detected (${reason}) — reloading into fresh build`)
    window.location.reload()
  } catch {
    window.location.reload()
  }
}

export function installRecoveryGuards() {
  if (typeof window === "undefined") return

  // <script>/asset elements that fail to load (chunk 404s bubble here)
  window.addEventListener("error", event => {
    const target = event.target as HTMLElement | null
    const src = (target as HTMLScriptElement | null)?.src ?? ""
    if (typeof src === "string" && src.includes("/_next/static")) {
      recoverFromStaleDeploy("asset load failure")
    }
  }, true)

  // Router-level lazy import failures surface as unhandled rejections
  window.addEventListener("unhandledrejection", event => {
    const reason = String(event.reason ?? "")
    if (/Loading chunk|dynamically imported module|Failed to fetch|ChunkLoadError|missing required error components/i.test(reason)) {
      recoverFromStaleDeploy(`router rejection: ${reason.slice(0, 120)}`)
    }
  })

  // When the service worker takes over mid-session, do NOT force a reload —
  // controllerchange fires on every legitimate deploy/update, and surprise
  // reloads mid-interaction read as "the whole site is glitchy". Chunk-failure
  // recovery above handles the genuinely stale case.
  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    try { sessionStorage.removeItem(RECOVERY_FLAG) } catch {}
  })
}
