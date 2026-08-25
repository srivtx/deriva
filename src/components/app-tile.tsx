import Link from "next/link"

export type AppTileDef = {
  href: string
  name: string
  glyph: string
  gradient: string
}

export default function AppTile({ app }: { app: AppTileDef }) {
  return (
    <Link href={app.href} className="app-tile" title={app.name}>
      <span className="app-tile-icon" style={{ background: app.gradient }} aria-hidden="true">{app.glyph}</span>
      <span className="app-tile-name">{app.name}</span>
    </Link>
  )
}
