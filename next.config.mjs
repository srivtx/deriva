/** @type {import('next').NextConfig} */

// COOP + COEP:credentialless enable SharedArrayBuffer → crossOriginIsolated
// → wllama runs multi-threaded (big Ghost inference speedup on Chrome).
// credentialless (not require-corp) so cross-origin no-CORS subresources like
// Google Fonts keep loading; Safari without support simply stays single-thread.
const securityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
]

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
}

export default nextConfig
