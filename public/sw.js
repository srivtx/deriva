// Deriva service worker — cache-first for static assets, network-first for pages.
const CACHE = "deriva-v28"
const STATIC = ["/", "/practice", "/design", "/lld", "/dashboard", "/patterns", "/patterns/quiz", "/settings", "/expedition", "/games", "/icpc", "/daily", "/review", "/contest", "/interview", "/cheatsheets", "/playground", "/releases", "/android", "/atlas", "/complexity", "/notebook", "/toolkit", "/vault", "/weather", "/images", "/qr", "/whiteboard", "/store", "/expenses", "/calendar", "/translate", "/manifest.webmanifest", "/favicon.svg", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable.png"]

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting()))
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (e) => {
  const { request } = e
  if (request.method !== "GET") return
  const url = new URL(request.url)

  // Next.js build assets + icons + Ghost engine files: cache-first (immutable)
  const isGhostEngine = url.pathname === "/ghost/ghost-worker.js" ||
    (url.hostname === "cdn.jsdelivr.net" && url.pathname.startsWith("/npm/@wllama/wllama/"))
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons") || isGhostEngine) {
    e.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copy))
        return res
      }))
    )
    return
  }

  // Pages: network-first, fall back to cache when offline
  if (request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copy))
        return res
      }).catch(() => caches.match(request).then((hit) => hit || caches.match("/")))
    )
  }
})

self.addEventListener("notificationclick", (e) => {
  e.notification.close()
  const href = e.notification.data?.href || "/"
  const target = new URL(href, self.location.origin).href
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      const client = clients.find((candidate) => candidate.url.startsWith(self.location.origin))
      if (client) {
        await client.focus()
        if ("navigate" in client && client.url !== target) await client.navigate(target)
        return
      }
      await self.clients.openWindow(target)
    })
  )
})
