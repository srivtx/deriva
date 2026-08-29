"use client"

import { useEffect, useMemo, useState } from "react"
import { RES_PIPELINE, RES_METHOD, RES_QUESTIONS, RES_DOMAINS, type ResQuestion, type ResSteps } from "@/data/res"
import ProgressRing from "@/components/progress-ring"

const DIFF_CLASS: Record<string, string> = {
  "Warm-up": "icpc-diff-easy",
  Core: "icpc-diff-medium",
  Hard: "icpc-diff-hard",
}

const STEP_ORDER: (keyof ResSteps)[] = ["frame", "hypothesize", "design", "predict", "attack", "iterate"]

const DRILL_SECONDS = 15 * 60

export default function ResPage() {
  const [practiced, setPracticed] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [domain, setDomain] = useState<string>("All")
  const [open, setOpen] = useState<string | null>(null)
  const [mode, setMode] = useState<"learn" | "drill">("learn")
  const [drillId, setDrillId] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(DRILL_SECONDS)
  const [running, setRunning] = useState(false)
  const [touched, setTouched] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const raw = localStorage.getItem("deriva-res-v1")
      if (raw) setPracticed(new Set(JSON.parse(raw) as string[]))
    } catch {}
    const params = new URLSearchParams(window.location.search)
    const drillParam = params.get("drill")
    const qParam = params.get("q")
    if (drillParam) {
      const q = RES_QUESTIONS.find(x => x.id === drillParam)
      if (q) { setDrillId(q.id); setMode("drill"); setSecondsLeft(DRILL_SECONDS); setRunning(false) }
    } else if (qParam) {
      setOpen(qParam)
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [running, secondsLeft])

  const drill = useMemo(() => RES_QUESTIONS.find(q => q.id === drillId) ?? null, [drillId])
  const visible = domain === "All" ? RES_QUESTIONS : RES_QUESTIONS.filter(q => q.domain === domain)
  const doneCount = practiced.size
  const pct = RES_QUESTIONS.length ? (doneCount / RES_QUESTIONS.length) * 100 : 0
  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`

  const startDrill = (id: string | null) => {
    const pick = id ?? (RES_QUESTIONS[Math.floor(Math.random() * RES_QUESTIONS.length)]?.id ?? null)
    setDrillId(pick)
    setMode("drill")
    setSecondsLeft(DRILL_SECONDS)
    setRunning(true)
    setTouched(new Set())
    setOpen(null)
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const markPracticed = (id: string) => {
    setPracticed(prev => {
      const next = new Set(prev)
      next.add(id)
      try { localStorage.setItem("deriva-res-v1", JSON.stringify([...next])) } catch {}
      return next
    })
    setMode("learn")
    setRunning(false)
  }

  const toggleTouched = (key: string) => {
    setTouched(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <main className="icpc-page">
      <section className="icpc-hero">
        <div className="icpc-hero-copy">
          <span className="icpc-kicker one-kicker">RES / RESEARCH BRAINSTORM TRAINER &middot; {RES_QUESTIONS.length} QUESTIONS</span>
          <h1>Think out loud. Under fire.</h1>
          <p>
            Prep for short open-ended research interviews — the kind where you get a problem, think aloud,
            get challenged, and adapt. No correct answers exist; what is scored is the loop:
            frame &rarr; hypothesize &rarr; design &rarr; predict &rarr; attack &rarr; iterate.
            Learn the method, study model brainstorms, then run a 15-minute drill.
          </p>
          <div className="icpc-hero-actions">
            <button className="icpc-primary" type="button" onClick={() => startDrill(null)}>
              Start a 15-minute drill <span aria-hidden="true">-&gt;</span>
            </button>
            <button className="res-ghost-btn" type="button" onClick={() => setMode(mode === "drill" ? "learn" : "drill")}>
              {mode === "drill" ? "Back to the bank" : "Browse the bank"}
            </button>
            <span className="icpc-hero-meta">Progress saves locally on this device.</span>
          </div>
        </div>
        <div className="icpc-hero-signal" aria-label="Practice progress">
          <span>PRACTICED</span>
          <ProgressRing value={hydrated ? pct : 0} size={80} stroke={8} label={hydrated ? `${doneCount}` : "0"} sub={`of ${RES_QUESTIONS.length}`} />
        </div>
      </section>

      {mode === "drill" && drill && (
        <section className="res-drill">
          <div className="res-drill-head">
            <span className="res-drill-clock" data-low={secondsLeft <= 300}>{clock}</span>
            <div className="res-drill-actions">
              <button type="button" onClick={() => setRunning(r => !r)}>{running ? "Pause" : "Resume"}</button>
              <button type="button" onClick={() => { setSecondsLeft(DRILL_SECONDS); setRunning(true); setTouched(new Set()) }}>Reset</button>
              <button type="button" onClick={() => startDrill(null)}>New question</button>
              <button type="button" className="res-drill-done" onClick={() => markPracticed(drill.id)}>Mark practiced ✓</button>
            </div>
          </div>
          <span className="res-drill-meta">{drill.domain} &middot; {drill.difficulty} &middot; {drill.id}</span>
          {drill.source && <p className="res-q-source">{drill.source}</p>}
          <p className="res-drill-setup">{drill.setup}</p>
          <h2 className="res-drill-q">&ldquo;{drill.question}&rdquo;</h2>
          <ol className="res-drill-steps">
            {RES_METHOD.map(m => (
              <li key={m.key} className={touched.has(m.key) ? "touched" : ""}>
                <button type="button" onClick={() => toggleTouched(m.key)} aria-pressed={touched.has(m.key)}>
                  <b>{m.name}</b>
                  <span>{m.say}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="res-drill-reveals">
            <details>
              <summary>Reveal model brainstorm</summary>
              <div className="res-steps">
                {STEP_ORDER.map(key => (
                  <div key={key} className="res-step">
                    <b>{RES_METHOD.find(m => m.key === key)!.name}</b>
                    <p>{drill.steps[key]}</p>
                  </div>
                ))}
              </div>
            </details>
            <details>
              <summary>Reveal follow-up challenges</summary>
              <div className="res-followups">
                {drill.followups.map(f => (
                  <div key={f.q} className="res-followup">
                    <b>{f.q}</b>
                    <p>{f.a}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <p className="res-drill-note">
            Talk through all six moves before revealing anything. Getting stuck, then saying
            &ldquo;that assumption does not hold — let me change the experiment&rdquo; is a strong signal, not a failure.
          </p>
        </section>
      )}

      <div className="res-pipeline">
        {RES_PIPELINE.map((s, i) => (
          <div key={s.stage} className="res-pipe-card">
            <span className="res-pipe-num">{String(i + 1).padStart(2, "0")}</span>
            <b>{s.stage}</b>
            <p>{s.what}</p>
            <small>{s.signal}</small>
          </div>
        ))}
      </div>
      <p className="res-pipeline-note">
        Reported format, varies by cohort — treat this as orientation, not gospel. The last stage is the one this app trains:
        two open-ended questions, fifteen minutes, no slides, no code.
      </p>

      <section className="res-method">
        <h2 className="res-h2">The loop — six moves, every question</h2>
        <div className="res-method-grid">
          {RES_METHOD.map((m, i) => (
            <div key={m.key} className="res-method-card">
              <span className="res-method-num">{i + 1}</span>
              <b>{m.name}</b>
              <p>{m.what}</p>
              <blockquote>&ldquo;{m.say}&rdquo;</blockquote>
            </div>
          ))}
        </div>
      </section>

      <section className="res-bank">
        <div className="res-bank-head">
          <h2 className="res-h2">The question bank</h2>
          <div className="res-filters">
            {["All", ...RES_DOMAINS].map(d => (
              <button key={d} type="button" className={domain === d ? "selected" : ""} onClick={() => { setDomain(d); setOpen(null) }}>{d}</button>
            ))}
          </div>
        </div>
        <ol className="res-qlist">
          {visible.map(q => {
            const isOpen = open === q.id
            const done = practiced.has(q.id)
            return (
              <li key={q.id} className={`res-q${isOpen ? " open" : ""}${done ? " done" : ""}`}>
                <button type="button" className="res-q-head" onClick={() => setOpen(isOpen ? null : q.id)} aria-expanded={isOpen}>
                  <span className="res-q-dot">{done ? "✓" : q.id.slice(1)}</span>
                  <span className="res-q-title">{q.title}</span>
                  <span className="res-q-domain">{q.domain}</span>
                  <span className={`icpc-diff ${DIFF_CLASS[q.difficulty] ?? ""}`}>{q.difficulty}</span>
                  <span className="res-q-chevron" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="res-q-body">
                    <p className="res-q-setup">{q.setup}</p>
                    <p className="res-q-prompt">&ldquo;{q.question}&rdquo;</p>
                    {q.source && <p className="res-q-source">{q.source}</p>}
                    <div className="res-steps">
                      {STEP_ORDER.map(key => (
                        <div key={key} className="res-step">
                          <b>{RES_METHOD.find(m => m.key === key)!.name}</b>
                          <p>{q.steps[key]}</p>
                        </div>
                      ))}
                    </div>
                    <div className="res-followups">
                      <b className="res-sub">Follow-up challenges — and good answers</b>
                      {q.followups.map(f => (
                        <div key={f.q} className="res-followup">
                          <b>{f.q}</b>
                          <p>{f.a}</p>
                        </div>
                      ))}
                    </div>
                    <div className="res-q-foot">
                      <div className="res-pitfalls">
                        <b className="res-sub">Common pitfalls</b>
                        <ul>{q.pitfalls.map(p => <li key={p}>{p}</li>)}</ul>
                      </div>
                      <p className="res-takeaway">{q.takeaway}</p>
                    </div>
                    <div className="res-q-actions">
                      <button className="res-drill-btn" type="button" onClick={() => startDrill(q.id)}>Drill this — 15:00</button>
                      {!done && <button className="res-mark-btn" type="button" onClick={() => markPracticed(q.id)}>Mark studied</button>}
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </section>
    </main>
  )
}
