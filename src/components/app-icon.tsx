import type { ReactNode } from "react"

export type AppIconName = "home" | "practice" | "progress" | "design" | "settings" | "more" | "search"

export default function AppIcon({ name, size = 20 }: { name: AppIconName; size?: number }) {
  const paths: Record<AppIconName, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></>,
    practice: <><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    progress: <><path d="M4 19V9M10 19V5M16 19v-7M22 19H2" /></>,
    design: <><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" /><circle cx="12" cy="18" r="3" /><path d="m8.5 8.3 2.1 6.8M15.5 8.3l-2.1 6.8" /></>,
    more: <><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.2" /><path d="m16 16 4.5 4.5" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.08 2.08-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.12A1.7 1.7 0 0 0 10.76 18.6a1.7 1.7 0 0 0-1.88.34l-.06.06-2.08-2.08.06-.06A1.7 1.7 0 0 0 7.14 15a1.7 1.7 0 0 0-1.56-1.03H5.5v-3h.08A1.7 1.7 0 0 0 7.14 9.94a1.7 1.7 0 0 0-.34-1.88L6.74 8 8.82 5.92l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06L19.84 8l-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.08v3H21a1.7 1.7 0 0 0-1.6 1.03Z" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
