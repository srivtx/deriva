"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { RELEASES } from "@/data/releases"

const SEEN_KEY = "deriva-releases-seen-v1"

export default function ReleasesPage() {
  const [latestSeen, setLatestSeen] = useState<string | null>(null)

  useEffect(() => {
    try {
      setLatestSeen(localStorage.getItem(SEEN_KEY))
      localStorage.setItem(SEEN_KEY, RELEASES[0].version)
    } catch {}
  }, [])

  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">RELEASES / WHAT&apos;S NEW</span>
          <h1>Everything Deriva has become.</h1>
          <p>Every drop, newest first — what shipped, why it exists, and what it changes about your day.</p>
        </div>
        <div className="contest-history-signal" aria-label="Latest version">
          <span>LATEST</span>
          <strong>{RELEASES[0].version}</strong>
          <small>{RELEASES[0].title}</small>
        </div>
      </section>

      <ol className="releases-timeline stagger">
        {RELEASES.map((release, index) => (
          <li key={release.version} className={`release-entry${index === 0 ? " latest" : ""}${latestSeen && release.version === latestSeen ? " seen" : ""}`}>
            <div className="release-rail">
              <span className="release-version">{release.version}</span>
              <span className="release-date">{release.date}</span>
            </div>
            <div className="release-body">
              <div className="release-head">
                <h2>{release.title}</h2>
                {index === 0 && <span className="release-badge">NEW</span>}
              </div>
              <p className="release-tagline">{release.tagline}</p>
              <ul className="release-highlights">
                {release.highlights.map(highlight => (
                  <li key={highlight.title}>
                    <strong>{highlight.title}</strong>
                    <span>{highlight.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>

      <section className="release-footer">
        <Link className="super-primary" href="/">Back to today <span aria-hidden="true">-&gt;</span></Link>
      </section>
    </main>
  )
}
