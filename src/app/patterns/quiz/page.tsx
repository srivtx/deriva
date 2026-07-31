"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PATTERN_DIRECTORY, PATTERN_QUIZ, type PatternQuestionKind } from "@/data/patterns"
import { loadPatternQuizProgress, resetPatternQuizProgress, savePatternQuizProgress } from "@/persistence/pattern-quiz"

const KIND_LABEL: Record<PatternQuestionKind, string> = {
  recognize: "Recognize the situation",
  invariant: "Protect the rule",
  state: "Design the memory",
  contrast: "Explain the tradeoff",
  transfer: "Transfer the move",
}

export default function PatternQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const progress = loadPatternQuizProgress()
    if (progress.completed) {
      setCurrentIndex(PATTERN_QUIZ.length)
    } else {
      setCurrentIndex(Math.min(progress.currentIndex, PATTERN_QUIZ.length - 1))
      setScore(Math.min(progress.score, PATTERN_QUIZ.length))
      setAnswered(Math.min(progress.answered, PATTERN_QUIZ.length))
    }
    setReady(true)
  }, [])

  const finished = ready && currentIndex >= PATTERN_QUIZ.length
  const question = PATTERN_QUIZ[currentIndex]
  const pattern = question ? PATTERN_DIRECTORY.find(item => item.id === question.patternId) : undefined

  const submit = () => {
    if (selected === null || submitted || !question) return
    const correct = selected === question.answer
    const nextScore = score + (correct ? 1 : 0)
    const nextAnswered = answered + 1
    setSubmitted(true)
    setScore(nextScore)
    setAnswered(nextAnswered)
    savePatternQuizProgress({ currentIndex, score: nextScore, answered: nextAnswered, completed: false })
  }

  const next = () => {
    if (!submitted) return
    const nextIndex = currentIndex + 1
    setSelected(null)
    setSubmitted(false)
    setCurrentIndex(nextIndex)
    savePatternQuizProgress({ currentIndex: nextIndex, score, answered, completed: nextIndex >= PATTERN_QUIZ.length })
  }

  const restart = () => {
    resetPatternQuizProgress()
    setCurrentIndex(0)
    setScore(0)
    setAnswered(0)
    setSelected(null)
    setSubmitted(false)
  }

  if (!ready) return <main className="pattern-quiz-page"><p className="narrative">Loading the pattern deck...</p></main>

  if (finished) {
    const percentage = Math.round((score / PATTERN_QUIZ.length) * 100)
    return (
      <main className="pattern-quiz-page">
        <div className="pattern-quiz-top"><Link href="/patterns" className="expedition-back">← Pattern Directory</Link><span>Quiz complete</span></div>
        <section className="pattern-quiz-finished">
          <span className="discovery-kicker">✦ Retrieval run complete</span>
          <h1 className="stage-title">You recognized {score} of {PATTERN_QUIZ.length} moves.</h1>
          <p className="narrative">{percentage >= 80 ? "The names are becoming handles. Keep testing the cue that makes each move necessary." : "The misses are useful: revisit the directory, then make another pass while the contrasts are still warm."}</p>
          <div className="pattern-score"><b>{percentage}%</b><span>{score} correct · {PATTERN_QUIZ.length - score} to revisit</span></div>
          <div className="pattern-quiz-actions"><button className="btn-primary" onClick={restart}>Run the quiz again →</button><Link href="/patterns" className="btn-ghost as-link">Review the directory</Link></div>
        </section>
      </main>
    )
  }

  const progressPercent = (currentIndex / PATTERN_QUIZ.length) * 100
  const isCorrect = selected === question.answer

  return (
    <main className="pattern-quiz-page">
      <div className="pattern-quiz-top"><Link href="/patterns" className="expedition-back">← Pattern Directory</Link><span>{currentIndex + 1} of {PATTERN_QUIZ.length}</span></div>
      <div className="pattern-quiz-progress" aria-label={`${currentIndex} of ${PATTERN_QUIZ.length} questions viewed`}><span style={{ width: `${progressPercent}%` }} /></div>
      <section className="pattern-quiz-act">
        <div className="pattern-quiz-meta"><span className="stage-kicker">{KIND_LABEL[question.kind]}</span><span className="pattern-quiz-score">{score} correct</span></div>
        <h1 className="stage-title">{question.prompt}</h1>
        <p className="pattern-quiz-context">{question.context}</p>
        <div className="pattern-quiz-options">
          {question.options.map((option, index) => {
            const optionClass = submitted ? index === question.answer ? "correct" : index === selected ? "wrong" : "" : selected === index ? "selected" : ""
            return <button key={option} className={`pattern-quiz-option ${optionClass}`} onClick={() => !submitted && setSelected(index)} disabled={submitted}><span>{String.fromCharCode(65 + index)}</span>{option}</button>
          })}
        </div>
        {submitted && pattern && <div className={`pattern-quiz-feedback ${isCorrect ? "correct" : "wrong"}`}><b>{isCorrect ? "That is the right mental move." : `The stronger fit is ${pattern.name}.`}</b><p>{question.explanation}</p><div className="pattern-quiz-recap"><span>Use it when</span><b>{pattern.cue}</b><span>The move</span><b>{pattern.move}</b></div></div>}
        {!submitted ? <button className="btn-primary" onClick={submit} disabled={selected === null}>Lock in my answer →</button> : <button className="btn-primary" onClick={next}>{currentIndex + 1 === PATTERN_QUIZ.length ? "See my result →" : "Next question →"}</button>}
      </section>
    </main>
  )
}
