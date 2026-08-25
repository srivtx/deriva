"use client"

import Link from "next/link"
import { ATLAS_ALGORITHMS } from "@/data/atlas"

export default function AtlasPage() {
  const families = Array.from(new Set(ATLAS_ALGORITHMS.map(algorithm => algorithm.family)))
  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">ALGORITHM ATLAS / WATCH MODE</span>
          <h1>Watch the algorithm think.</h1>
          <p>Reference algorithms, animated step by step with the line of code that caused each move. Scrub, pause, step — understanding at your own speed.</p>
        </div>
        <div className="contest-history-signal" aria-label="Algorithm count">
          <span>MOVES</span>
          <strong>{ATLAS_ALGORITHMS.length}</strong>
          <small>{families.length} families</small>
        </div>
      </section>

      {families.map(family => (
        <section key={family} className="atlas-family" aria-label={family}>
          <span className="super-kicker">{family.toUpperCase()}</span>
          <div className="atlas-grid">
            {ATLAS_ALGORITHMS.filter(algorithm => algorithm.family === family).map(algorithm => (
              <Link key={algorithm.slug} href={`/atlas/${algorithm.slug}`} className="atlas-card">
                <span className="atlas-card-glyph" aria-hidden="true">{algorithm.glyph}</span>
                <strong>{algorithm.title}</strong>
                <small>{algorithm.blurb}</small>
                <em>{algorithm.complexity}</em>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
