"use client"

import Link from "next/link"
import { useState } from "react"
import { CHEATSHEETS, type Cheatsheet } from "@/data/cheatsheets"

function CopyButton({ code, id, setCopied }: { code: string; id: string; setCopied: (id: string) => void }) {
  return (
    <button
      type="button"
      className="cheatsheet-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code)
          setCopied(id)
          setTimeout(() => setCopied(""), 1600)
        } catch {}
      }}
    >
      Copy
    </button>
  )
}

function SheetCard({ sheet, copiedId, setCopied }: { sheet: Cheatsheet; copiedId: string; setCopied: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="cheatsheet-card">
      <div className="cheatsheet-head">
        <div>
          <span className="cheatsheet-family">{sheet.family}</span>
          <h2>{sheet.title}</h2>
        </div>
        <div className="cheatsheet-head-actions">
          <CopyButton code={sheet.code} id={sheet.id} setCopied={setCopied} />
          <button type="button" className="cheatsheet-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open}>{open ? "Hide" : "View"}</button>
        </div>
      </div>
      <p className="cheatsheet-when">{sheet.when}</p>
      <p className="cheatsheet-complexity">{sheet.complexity}</p>
      {open && <pre className="cheatsheet-code">{sheet.code}</pre>}
      <div className="cheatsheet-foot">
        {copiedId === sheet.id && <span className="cheatsheet-copied" role="status">Copied ✓</span>}
        <Link className="cheatsheet-practice" href={`/practice?topic=${sheet.practiceTopic}`}>Practice this family <span aria-hidden="true">-&gt;</span></Link>
      </div>
    </section>
  )
}

export default function CheatsheetsPage() {
  const [copiedId, setCopied] = useState("")
  const families = Array.from(new Set(CHEATSHEETS.map(sheet => sheet.family)))
  return (
    <main className="super-page">
      <section className="contest-hero">
        <div>
          <span className="super-kicker">CHEATSHEET HUB / CONTEST TEMPLATES</span>
          <h1>Ten templates you should never retype.</h1>
          <p>The moves that win rounds — binary search on the answer, DSU, Dijkstra, KMP — written clean, with the moment to reach for each one.</p>
        </div>
        <div className="contest-history-signal" aria-label="Template count">
          <span>SHEETS</span>
          <strong>{CHEATSHEETS.length}</strong>
          <small>{families.length} families</small>
        </div>
      </section>
      <div className="cheatsheet-grid">
        {CHEATSHEETS.map(sheet => <SheetCard key={sheet.id} sheet={sheet} copiedId={copiedId} setCopied={setCopied} />)}
      </div>
    </main>
  )
}
