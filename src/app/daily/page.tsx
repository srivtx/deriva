"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { TOPICS } from "@/data"
import { currentStreak, dailyPickForDate, loadDailyHistory, markDailySolved, todayKey } from "@/persistence/daily"
import { loadPracticeCompletion } from "@/persistence/practice-progress"

function lastNDays(n: number): string[] {
  const days: string[] = []
  const cursor = new Date()
  for (let i = 0; i < n; i++) {
    days.unshift(todayKey(cursor))
    cursor.setDate(cursor.getDate() - 1)
  }
  return days
}

export default function DailyPage() {
  const [history, setHistory] = useState<Record<string, { problemId: number; topicId: string; solvedAt: number }>>({})
  const [completed, setCompleted] = useState<Record<string, number[]>>({})
  const [hydrated, setHydrated] = useState(false)
  const [shareState, setShareState] = useState("")

  const dateKey = todayKey()
  const pick = useMemo(() => dailyPickForDate(dateKey), [dateKey])
  const topic = TOPICS[pick.topicId]
  const solvedToday = Boolean(history[dateKey])
  const alsoSolvedInPractice = (completed[pick.topicId] || []).includes(pick.problem.id)
  const isDone = solvedToday || alsoSolvedInPractice
  const streak = useMemo(() => currentStreak(history), [history])
  const days = useMemo(() => lastNDays(14), [])

  useEffect(() => {
    setHistory(loadDailyHistory())
    setCompleted(loadPracticeCompletion())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && !solvedToday && alsoSolvedInPractice) {
      markDailySolved(dateKey, pick.topicId, pick.problem.id)
      setHistory(loadDailyHistory())
    }
  }, [hydrated, solvedToday, alsoSolvedInPractice, dateKey, pick.topicId, pick.problem.id])

  const share = async () => {
    const text = `My Deriva daily for ${dateKey}: "${pick.problem.title}" (${pick.topicName}). Derive it before midnight.`
    try {
      if (navigator.share) await navigator.share({ title: "Deriva Daily", text, url: `${window.location.origin}/daily` })
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.origin}/daily`)
        setShareState("Copied to clipboard")
        setTimeout(() => setShareState(""), 2000)
      }
    } catch {}
  }

  const celebrate = () => {
    markDailySolved(dateKey, pick.topicId, pick.problem.id)
    setHistory(loadDailyHistory())
    if ("vibrate" in navigator) navigator.vibrate([20, 40, 20])
  }

  return (
    <main className="super-page">
      <section className="daily-hero">
        <div className="daily-hero-main">
          <span className="super-kicker">DAILY CHALLENGE / {dateKey}</span>
          <h1>Today&apos;s problem, everyone&apos;s problem.</h1>
          <p>One pick per day, identical for every user, chosen by the date itself. Solve it in the drill room and the day is yours.</p>
        </div>
        <div className="daily-streak" aria-label="Daily streak">
          <span>DAY STREAK</span>
          <strong>{hydrated ? streak : 0}</strong>
          <small>{streak === 1 ? "day and counting" : streak > 0 ? "days and counting" : "start today"}</small>
        </div>
      </section>

      <section className={`daily-card${isDone ? " done" : ""}`}>
        <div className="daily-card-head">
          <span className="daily-topic">{pick.topicName} · P{pick.problem.id}</span>
          {pick.problem.difficulty && <span className={`icpc-diff icpc-diff-${String(pick.problem.difficulty).toLowerCase()}`}>{pick.problem.difficulty}</span>}
        </div>
        <h2>{pick.problem.title}</h2>
        <p className="daily-pattern">{pick.problem.pattern} · {pick.problem.skill}</p>
        <div className="daily-actions">
          <Link className="super-primary" href={`/practice?topic=${pick.topicId}&problem=${pick.problem.id}`} onClick={celebrate}>
            {isDone ? "Re-solve it clean" : "Enter the drill room"} <span aria-hidden="true">-&gt;</span>
          </Link>
          <button type="button" className="super-ghost" onClick={share}>Share today</button>
        </div>
        {shareState && <p className="daily-share-note" role="status">{shareState}</p>}
        {isDone && <p className="daily-done-note">✓ Day complete. Come back tomorrow for the next pick.</p>}
      </section>

      <section className="daily-history" aria-label="Last fourteen days">
        <span className="super-kicker">LAST 14 DAYS</span>
        <div className="daily-calendar">
          {days.map(day => {
            const done = Boolean(history[day]) || day === dateKey && isDone
            return (
              <div key={day} className={`daily-cell${done ? " done" : ""}${day === dateKey ? " today" : ""}`} title={day}>
                <span>{Number(day.slice(8))}</span>
              </div>
            )
          })}
        </div>
        <p className="daily-history-note">{Object.keys(history).length} days solved all-time. No streak pressure — the calendar just keeps the evidence.</p>
      </section>
    </main>
  )
}
