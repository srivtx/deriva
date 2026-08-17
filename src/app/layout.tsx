import type { Metadata, Viewport } from "next"
import "./globals.css"
import AppShell from "@/components/app-shell"
import ServiceWorkerRegister from "@/components/sw-register"
import PwaBranding from "@/components/pwa-branding"

export const metadata: Metadata = {
  title: "Deriva — Derive the Algorithm",
  description: "Learn DSA, System Design (HLD), and Low-Level Design through first-principles reasoning. Nine-stage derivations, in-browser Python.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Deriva",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192.png",
    apple: "/icons/icon-180.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-180.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Newsreader:ital,wght@0,400;0,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell />
        <div className="app-content">{children}</div>
        <ServiceWorkerRegister />
        <PwaBranding />
      </body>
    </html>
  )
}
