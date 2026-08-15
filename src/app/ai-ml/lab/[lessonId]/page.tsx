"use client"

// /ai-ml/lab/[lessonId] — lab page: artifact, constraints, attached questions,
// prerequisite, and Start/Resume (docs/13 §surfacing rules).

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { getLessonByRoute } from "@/curriculum"
import { aiQuestions } from "@/curriculum/topics/ai-ml/questions"
import { plannedLabs } from "@/curriculum/topics/ai-ml/topic"
import { loadLessonProgress } from "@/persistence/lesson-progress"
import { ArtifactCard } from "@/learning/stages/ai/artifact-card"

export default function LabPage() {
  const params = useParams()
  const slug = params.lessonId as string
  const lesson = useMemo(() => getLessonByRoute("ai-ml", slug), [slug])
  const plannedKey = Object.keys(plannedLabs).find(id => id.endsWith(slug))
  const planned = plannedKey ? plannedLabs[plannedKey] : undefined

  const questions = aiQuestions.filter(question => question.lessonId.endsWith(slug))
  const [progress, setProgress] = useState<ReturnType<typeof loadLessonProgress>>(undefined)

  useEffect(() => {
    setProgress(lesson ? loadLessonProgress(lesson.id) : undefined)
  }, [lesson])

  if (!lesson && !planned) {
    return (
      <div className="lesson-missing">
        <h2>Lab not found</h2>
        <Link href="/ai-ml">← Back to the AI/ML hub</Link>
      </div>
    )
  }

  const meta = lesson
    ? { title: lesson.title, kind: lesson.ai!.kind, move: lesson.thinkingMove, authored: true }
    : { title: planned?.title ?? "Lab", kind: planned?.kind ?? "lab", move: planned?.thinkingMove ?? "", authored: false }

  return (
    <div className="lab-page ai-lab-page">
      <header className="landing-header">
        <span className="home-eyebrow"><span>{meta.kind}{meta.authored ? "" : " · coming next"}</span></span>
        <h1 className="lab-title">{meta.title}</h1>
        <p className="narrative">one move: <b>{meta.move}</b></p>
      </header>

      {lesson && lesson.ai && (
        <>
          <ArtifactCard ai={lesson.ai} />
          <div className="lab-actions">
            <Link href={`/lab/${lesson.routeSlug}`} className="btn-primary as-link">
              {progress && !progress.finishedAt ? "Resume the lab →" : "Start the lab →"}
            </Link>
          </div>
        </>
      )}
      {!lesson && (
        <div className="lab-coming-next">
          <p className="narrative">This lab is authored next in the plan. Its questions below are ready to practice now.</p>
        </div>
      )}

      {questions.length > 0 && (
        <section className="ai-hub-section">
          <span className="experiment-kicker">{questions.length} practice questions attached</span>
          <ol className="track-question-list">
            {questions.map(question => (
              <li key={question.id}>
                <Link href={`/ai-ml/question/${question.id}`} className="track-question-row">
                  <span className="track-q-id">{question.id}</span>
                  <span className="track-q-main">
                    <b>{question.prompt}</b>
                    <span className="track-q-meta">{question.kind} · {question.pattern}</span>
                  </span>
                  <span className="track-q-status">practice →</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!lesson && (
        <div className="artifact-chain">
          <span className="experiment-kicker">Prerequisite chain</span>
          <p className="chain-note">This lab loads the previous artifact and asks you to keep, revise, or reject it — the artifact chain is the spine.</p>
        </div>
      )}
    </div>
  )
}
