"use client"

// /ai-ml/track/[trackId] — one question track with status/kind filters
// (docs/13 §surfacing rules: filter by status, type, prerequisite, review date).

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { aiQuestionTracks, listQuestionsByTrack } from "@/curriculum/topics/ai-ml/questions"
import { loadAllQuestionProgress, type QuestionStatus } from "@/persistence/ai-question-progress"

const kindLabels: Record<string, string> = {
  derivation: "derive", prediction: "predict", construction: "construct",
  implementation: "implement", debugging: "debug", counterexample: "counterexample",
  comparison: "compare", operations: "operate", communication: "communicate", transfer: "transfer",
}

export default function TrackPage() {
  const params = useParams()
  const trackId = params.trackId as string
  const track = aiQuestionTracks.find(t => t.id === trackId)

  const [progress, setProgress] = useState<ReturnType<typeof loadAllQuestionProgress>>({})
  const allQuestions = useMemo(() => listQuestionsByTrack(trackId), [trackId])

  useEffect(() => {
    setProgress(loadAllQuestionProgress())
  }, [])

  const [statusFilter, setStatusFilter] = useState<"all" | QuestionStatus>("all")
  const [kindFilter, setKindFilter] = useState<string>("all")

  const statusOf = (id: string) => progress[id]?.status ?? "new"

  const filtered = allQuestions.filter(question =>
    (statusFilter === "all" || statusOf(question.id) === statusFilter) &&
    (kindFilter === "all" || question.kind === kindFilter),
  )

  if (!track) {
    return (
      <div className="lesson-missing">
        <h2>Track not found</h2>
        <Link href="/ai-ml">← Back to the AI/ML hub</Link>
      </div>
    )
  }

  const doneCount = allQuestions.filter(question => statusOf(question.id) === "done").length
  const dueCount = allQuestions.filter(question => {
    const p = progress[question.id]
    if (!p || p.status === "done") return false
    return p.nextReview ? new Date(p.nextReview) <= new Date() : false
  }).length
  const kinds = [...new Set(allQuestions.map(question => question.kind))]

  return (
    <div className="lab-page ai-track-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>{track.from} – {track.to}</span></span>
        <h1 className="lab-title">{track.name}</h1>
        <p className="narrative">
          {doneCount} of {allQuestions.length} done · {dueCount} due for review.
        </p>
      </header>

      <div className="track-filters">
        <div className="track-filter-group">
          {(["all", "new", "started", "attempted", "done"] as const).map(status => (
            <button key={status} className={`track-filter-chip${statusFilter === status ? " active" : ""}`} onClick={() => setStatusFilter(status)}>
              {status}
            </button>
          ))}
        </div>
        <div className="track-filter-group">
          <button className={`track-filter-chip${kindFilter === "all" ? " active" : ""}`} onClick={() => setKindFilter("all")}>all kinds</button>
          {kinds.map(kind => (
            <button key={kind} className={`track-filter-chip${kindFilter === kind ? " active" : ""}`} onClick={() => setKindFilter(kind)}>
              {kindLabels[kind] ?? kind}
            </button>
          ))}
        </div>
      </div>

      <ol className="track-question-list">
        {filtered.map(question => {
          const status = statusOf(question.id)
          return (
            <li key={question.id}>
              <Link href={`/ai-ml/question/${question.id}`} className={`track-question-row ${status}`}>
                <span className="track-q-id">{question.id}</span>
                <span className="track-q-main">
                  <b>{question.prompt}</b>
                  <span className="track-q-meta">{kindLabels[question.kind] ?? question.kind} · {question.lessonId.split("/").pop()}</span>
                </span>
                <span className="track-q-status">{status}</span>
              </Link>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
