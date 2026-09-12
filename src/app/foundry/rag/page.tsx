"use client"

// FOUNDRY · Station 05 — Retrieval Bench.
// BM25 and hashing vectors, with every classic RAG failure authored in:
// keyword stuffing, chunk boundaries cutting answers, and the final
// composition under a token budget.

import { useMemo, useState } from "react"
import { FoundryCompletion, FoundryShell } from "@/components/foundry-shell"
import { FOUNDRIES } from "@/foundry/catalog"
import { triggerGameFeedback } from "@/games/feedback"
import { recordStationRun } from "@/foundry/progress"
import {
  BENCH_CORPUS,
  LIMITS_QUERY,
  MANUAL_DOCUMENT,
  MANUAL_KEY_SENTENCE,
  MANUAL_QUERY,
  bm25Scores,
  buildBM25,
  chunkDocument,
  chunkContainsSentence,
  hygieneFilter,
  vectorScores,
} from "@/foundry/engine-rag"

const STATION = FOUNDRIES[4]

const CHUNK_LABELS: Record<string, string> = {
  "truth-memory": "the real memory spec",
  stuffed: "the keyword-stuffed page",
  "truth-quota": "the quota policy",
  "irrelevant-auth": "the auth chapter",
  "truth-latency": "the latency spec",
  "irrelevant-billing": "the billing chapter",
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

function RankedList({ ranked, highlight }: { ranked: { id: string; score: number; text: string }[]; highlight?: string }) {
  return (
    <ol className="foundry-rank-list">
      {ranked.slice(0, 4).map((entry, rank) => (
        <li key={entry.id} className={`foundry-rank-item ${highlight === entry.id ? "is-truth" : ""} ${entry.id === "stuffed" ? "is-stuffed" : ""}`}>
          <b>#{rank + 1}</b>
          <div>
            <span>{CHUNK_LABELS[entry.id] ?? entry.id} · score {entry.score.toFixed(2)}</span>
            <p>{entry.text.length > 110 ? `${entry.text.slice(0, 110)}…` : entry.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function StuffingMission({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const [hygiene, setHygiene] = useState(false)

  const corpus = useMemo(() => (hygiene ? hygieneFilter(BENCH_CORPUS) : BENCH_CORPUS), [hygiene])
  const ranked = useMemo(() => bm25Scores(LIMITS_QUERY, buildBM25(corpus)), [corpus])
  const vectors = useMemo(() => vectorScores(LIMITS_QUERY, BENCH_CORPUS), [])

  const options = [
    { id: "stuffed", label: "The top-ranked chunk — cache memory limits, ten times over" },
    { id: "truth-memory", label: "The memory spec — 4 GB KV pool, shared, preempted when exhausted" },
    { id: "irrelevant-auth", label: "The auth chapter — tokens, keys, refresh" },
  ]

  const pick = (id: string) => {
    if (picked !== null) return
    setPicked(id)
    if (id === "truth-memory") triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 1 · The stuffing trap</span>
      <h1 className="stage-title">The ranker is gameable.</h1>
      <p className="narrative">
        Query: “{LIMITS_QUERY}”. Both retrievers run below — exact BM25 and cosine over
        feature-hashed vectors. One page in this corpus repeats “cache memory” like a mantra.
        First, call which chunk actually answers the question — not which one wins.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>BM25 ranking</span><b>{hygiene ? "corpus hygiene ON" : "raw corpus"}</b></div>
        <RankedList ranked={ranked} highlight="truth-memory" />
        <code>vector top-1: {CHUNK_LABELS[vectors[0].id] ?? vectors[0].id} (cosine {vectors[0].score.toFixed(2)}) — fooled too: L2-normalized hashing cannot see repetition</code>
        <div className="foundry-step-controls">
          <button className={`btn-ghost ${hygiene ? "on" : ""}`} onClick={() => { triggerGameFeedback("move"); setHygiene(h => !h) }}>
            {hygiene ? "hygiene filter: ON (spam chunk dropped)" : "enable corpus hygiene (drop chunks with >5 repeats of one term)"}
          </button>
        </div>
      </div>
      <div className="game-choice-box">
        {options.map(option => (
          <button key={option.id} className={`game-choice ${picked === option.id ? (option.id === "truth-memory" ? "selected" : "is-wrong") : ""}`} onClick={() => pick(option.id)}>
            {option.label}
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <div className={`game-feedback ${picked === "truth-memory" ? "correct" : "wrong"}`}>
            <b>{picked === "truth-memory" ? "Right — and the ranker disagrees with you." : "That one games the score, it does not answer."}</b>
            <p>
              BM25 rewards term frequency, and normalized vectors cannot even see the repetition.
              Rankers get gamed; quality is defended at the corpus. Flip the hygiene filter above
              and watch the true spec take the top slot — spam layers exist in every serious
              retrieval stack for exactly this reason.
            </p>
          </div>
          {hygiene && ranked[0].id === "truth-memory" && (
            <button className="btn-primary" onClick={() => { triggerGameFeedback("complete"); onDone() }}>Fix the chunking →</button>
          )}
          {!hygiene && (
            <div className="game-feedback wrong"><b>One more move.</b><p>Enable corpus hygiene above and watch the ranking flip before you continue.</p></div>
          )}
        </>
      )}
    </section>
  )
}

function BoundaryMission({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const [size, setSize] = useState(30)
  const [overlap, setOverlap] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const chunks = useMemo(() => chunkDocument(MANUAL_DOCUMENT, size, overlap), [size, overlap])
  const ranked = useMemo(() => bm25Scores(MANUAL_QUERY, buildBM25(chunks)), [chunks])
  const top = ranked[0]
  const keyIntact = top ? chunkContainsSentence(top, MANUAL_KEY_SENTENCE) : false
  const brokenChunk = chunks.find(chunk => {
    const words = MANUAL_KEY_SENTENCE.split(" ")
    return chunk.text.includes(words.slice(0, 4).join(" ")) && !chunkContainsSentence(chunk, MANUAL_KEY_SENTENCE)
  })

  const submit = () => {
    setSubmitted(true)
    if (keyIntact) triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 2 · The boundary that ate the answer</span>
      <h1 className="stage-title">The quota sentence is cut in half.</h1>
      <p className="narrative">
        The manual is chunked at 30 words with zero overlap — and the window boundary lands inside
        the sentence that answers “{MANUAL_QUERY}”. Retrieval can only find what chunking left
        whole. Tune size and overlap until the top-ranked chunk carries the full sentence.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>{chunks.length} chunks · top score {top ? top.score.toFixed(2) : "0"}</span><b className={keyIntact ? "foundry-under" : "foundry-over"}>{keyIntact ? "key sentence intact" : "key sentence split"}</b></div>
        <div className="foundry-dial-row">
          <label className="foundry-dial">
            <span className="foundry-dial-label">chunk size <b>{size} words</b></span>
            <input type="range" min={20} max={80} step={5} value={size} aria-label="chunk size in words" onChange={event => setSize(Number(event.target.value))} />
          </label>
          <label className="foundry-dial">
            <span className="foundry-dial-label">overlap <b>{overlap} words</b></span>
            <input type="range" min={0} max={30} step={5} value={overlap} aria-label="chunk overlap in words" onChange={event => setOverlap(Number(event.target.value))} />
          </label>
        </div>
        <div className="foundry-chunk-map" aria-label="chunk windows over the document">
          {chunks.map((chunk, index) => {
            const start = (index * (size - overlap)) / (chunks.length * (size - overlap) || 1)
            const width = size / (chunks.length * (size - overlap) + overlap || 1)
            return <span key={chunk.id} style={{ marginLeft: `${start * 100}%`, width: `${width * 100}%` }} title={chunk.text.slice(0, 60)}>{index + 1}</span>
          })}
        </div>
        {top && (
          <div className="foundry-top-chunk">
            <small>top-ranked chunk</small>
            <p>
              {top.text.split(MANUAL_KEY_SENTENCE).map((part, index, parts) => (
                <span key={index}>
                  {part}
                  {index < parts.length - 1 && <mark>{MANUAL_KEY_SENTENCE}</mark>}
                </span>
              ))}
            </p>
          </div>
        )}
        {!keyIntact && brokenChunk && (
          <code>“…{MANUAL_KEY_SENTENCE.split(" ").slice(0, 4).join(" ")} …” — the boundary cut the answer mid-sentence</code>
        )}
        {keyIntact && <code>size 60 / overlap 20 is the shape that keeps whole facts whole — bigger is not better, whole is better</code>}
      </div>
      <div className="foundry-step-controls">
        <button className="btn-primary" disabled={submitted && keyIntact} onClick={submit}>{keyIntact ? "Lock in the chunking →" : "Test this chunking"}</button>
        {submitted && keyIntact && <button className="btn-primary" onClick={() => { triggerGameFeedback("complete"); onDone() }}>Compose the final prompt →</button>}
      </div>
      {submitted && !keyIntact && (
        <div className="game-feedback wrong"><b>Still split.</b><p>The answer lives on a boundary. Grow the window or add overlap so no sentence straddles two chunks.</p></div>
      )}
    </section>
  )
}

function ComposeMission({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const candidates = useMemo(
    () => BENCH_CORPUS.filter(chunk => ["truth-memory", "stuffed", "truth-latency"].includes(chunk.id)),
    [],
  )
  const [kept, setKept] = useState<Record<string, boolean>>({ "truth-memory": true, stuffed: true, "truth-latency": true })
  const [submitted, setSubmitted] = useState(false)

  const budget = 140
  const keptChunks = candidates.filter(chunk => kept[chunk.id])
  const contextText = keptChunks.map(chunk => chunk.text).join("\n\n")
  const used = estimateTokens(contextText)
  const keepsTruth = kept["truth-memory"] === true
  const dropsStuffed = kept["stuffed"] !== true
  const passes = used <= budget && keepsTruth && dropsStuffed

  const answer = useMemo(() => {
    const truth = keptChunks.find(chunk => chunk.id === "truth-memory")
    return truth
      ? "Based on the retrieved context: the server allocates a KV cache memory pool of 4 GB per GPU, shared across concurrent requests, with preemption of the longest-running request when it is exhausted."
      : "Based on the retrieved context: …I cannot find the memory specification."
  }, [keptChunks])

  const submit = () => {
    setSubmitted(true)
    if (passes) triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 3 · Compose the context</span>
      <h1 className="stage-title">{budget} tokens for the whole context.</h1>
      <p className="narrative">
        Retrieval handed you three chunks. Now you are the context engineer: keep what answers the
        question, cut what games it, and stay inside the window — the model only sees what you keep.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>prompt budget</span><b className={used > budget ? "foundry-over" : "foundry-under"}>{used} / {budget} tokens</b></div>
        <div className="foundry-budget-bar"><span style={{ width: `${Math.min(100, (used / budget) * 100)}%`, background: used > budget ? "var(--viz-pruned)" : "var(--viz-settled)" }} /></div>
        <div className="foundry-sentence-list">
          {candidates.map(chunk => (
            <button key={chunk.id} className={`foundry-sentence-toggle ${kept[chunk.id] ? "on" : ""} ${chunk.id === "stuffed" ? "stuffed" : ""}`} onClick={() => setKept(k => ({ ...k, [chunk.id]: !k[chunk.id] }))}>
              <i>{kept[chunk.id] ? "◆" : "◇"}</i>
              <span>{CHUNK_LABELS[chunk.id]} — {chunk.text.slice(0, 80)}…</span>
              <code>{estimateTokens(chunk.text)} tok</code>
            </button>
          ))}
        </div>
      </div>
      {submitted && (
        <div className="concept-visual forge-panel foundry-answer-panel">
          <div className="concept-visual-top"><span>model output</span><b>{passes ? "grounded" : "degraded"}</b></div>
          <p className="narrative">{answer}</p>
          <code>{passes ? "context: clean · budget: respected · answer: grounded" : keepsTruth ? "over budget — trim the noise" : "the spec was cut — the model cannot answer from what it cannot see"}</code>
        </div>
      )}
      <div className="foundry-step-controls">
        {!passes && <button className="btn-primary" onClick={submit}>Assemble the prompt</button>}
        {passes && submitted && <button className="btn-primary" onClick={() => { triggerGameFeedback("complete"); onDone() }}>Close the bench →</button>}
      </div>
      {submitted && !passes && (
        <div className="game-feedback wrong">
          <b>{!keepsTruth ? "You cut the answer." : !dropsStuffed ? "The stuffed chunk is still aboard." : "Over budget."}</b>
          <p>Keep the memory spec, drop the stuffing — the latency spec is optional ballast if it fits.</p>
        </div>
      )}
    </section>
  )
}

export default function RetrievalBenchPage() {
  const [mission, setMission] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)

  const complete = () => {
    triggerGameFeedback("complete")
    recordStationRun(STATION.id, STATION.missions, mistakes)
    setFinished(true)
  }

  if (finished) {
    return (
      <FoundryShell station={STATION} mission={STATION.missions}>
        <FoundryCompletion
          station={STATION}
          stats={[
            { label: "Missions cleared", value: STATION.missions },
            { label: "Mistakes this run", value: mistakes },
            { label: "Retrievers operated", value: "BM25 + vectors" },
          ]}
          concepts={[
            { title: "Rankers get gamed", description: "Keyword stuffing outranks truth in BM25 — and normalized vectors cannot see it either." },
            { title: "Defense lives in the corpus", description: "Hygiene filters and dedup beat clever scoring against adversarial text." },
            { title: "Chunking decides retrievability", description: "A fact split across chunks is a fact lost — size and overlap keep facts whole." },
            { title: "Context is a budget", description: "The model sees only what you keep; stuffing costs tokens AND attention." },
          ]}
          onRestart={() => {
            setMission(1)
            setMistakes(0)
            setFinished(false)
          }}
        />
      </FoundryShell>
    )
  }

  return (
    <FoundryShell station={STATION} mission={mission}>
      {mission === 1 && <StuffingMission onDone={() => setMission(2)} onMistake={() => setMistakes(m => m + 1)} />}
      {mission === 2 && <BoundaryMission onDone={() => setMission(3)} onMistake={() => setMistakes(m => m + 1)} />}
      {mission === 3 && <ComposeMission onDone={complete} onMistake={() => setMistakes(m => m + 1)} />}
    </FoundryShell>
  )
}
