"use client"

import { useState, useEffect, useRef, type TouchEvent } from "react"
import Link from "next/link"
import { PATTERN_CARDS, TOPIC_LABELS, type CardTopic, type PatternCard } from "@/data/cards"
import {
  loadCardsProgress,
  recordCardReview,
  loadTodayReviewedCount,
  type CardProgress,
  type CardRating,
} from "@/persistence/cards"

type SessionMode = "quick5" | "due" | "all"

export default function CardsPage() {
  const [topicFilter, setTopicFilter] = useState<CardTopic | "all">("all")
  const [sessionMode, setSessionMode] = useState<SessionMode>("quick5")
  const [cards, setCards] = useState<PatternCard[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [progress, setProgress] = useState<Record<string, CardProgress>>({})
  const [todayCount, setTodayCount] = useState(0)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [sessionScore, setSessionScore] = useState({ correct: 0, total: 0 })

  // Touch swipe state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const loaded = loadCardsProgress()
    setProgress(loaded)
    setTodayCount(loadTodayReviewedCount())
  }, [])

  // Build current active queue
  useEffect(() => {
    let pool = PATTERN_CARDS
    if (topicFilter !== "all") {
      pool = pool.filter(c => c.topic === topicFilter)
    }

    if (sessionMode === "quick5") {
      // Pick 5 cards prioritizing unmastered
      const sorted = [...pool].sort((a, b) => {
        const pA = progress[a.id]?.streak || 0
        const pB = progress[b.id]?.streak || 0
        return pA - pB
      })
      setCards(sorted.slice(0, 5))
    } else if (sessionMode === "due") {
      const now = Date.now()
      const due = pool.filter(c => {
        const p = progress[c.id]
        return !p || p.nextDueAt <= now
      })
      setCards(due.length > 0 ? due : pool.slice(0, 5))
    } else {
      setCards(pool)
    }

    setCurrentIndex(0)
    setIsFlipped(false)
    setSelectedOption(null)
    setSessionCompleted(false)
    setSessionScore({ correct: 0, total: 0 })
  }, [topicFilter, sessionMode, progress])

  const currentCard = cards[currentIndex]

  const triggerHaptic = (pattern: number[] = [15]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern)
      } catch {}
    }
  }

  const handleFlip = () => {
    triggerHaptic([12])
    setIsFlipped(!isFlipped)
  }

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return
    setSelectedOption(idx)

    const isCorrect = idx === currentCard.correctOption
    if (isCorrect) {
      triggerHaptic([18, 30])
      setSessionScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }))
      setTimeout(() => {
        setIsFlipped(true)
      }, 450)
    } else {
      triggerHaptic([35, 40, 35])
      setSessionScore(prev => ({ ...prev, total: prev.total + 1 }))
    }
  }

  const advanceCard = (rating: CardRating) => {
    if (!currentCard) return
    triggerHaptic([15])

    const updated = recordCardReview(currentCard.id, rating)
    setProgress(prev => ({ ...prev, [currentCard.id]: updated }))
    setTodayCount(prev => prev + 1)

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false)
      setSelectedOption(null)
      setDragOffset({ x: 0, y: 0 })
      setCurrentIndex(prev => prev + 1)
    } else {
      setSessionCompleted(true)
      triggerHaptic([20, 40, 20, 40])
    }
  }

  // Touch handlers for mobile swipe gestures
  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
    setIsDragging(true)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    setDragOffset({ x: deltaX, y: deltaY })
  }

  const onTouchEnd = () => {
    setIsDragging(false)
    const SWIPE_THRESHOLD = 90
    if (dragOffset.x > SWIPE_THRESHOLD) {
      // Swiped Right -> Mastered / Got It
      advanceCard("good")
    } else if (dragOffset.x < -SWIPE_THRESHOLD) {
      // Swiped Left -> Revisit / Still Learning
      advanceCard("again")
    }
    setDragOffset({ x: 0, y: 0 })
    touchStartRef.current = null
  }

  const restartSession = () => {
    triggerHaptic([15])
    setCurrentIndex(0)
    setIsFlipped(false)
    setSelectedOption(null)
    setSessionCompleted(false)
    setSessionScore({ correct: 0, total: 0 })
  }

  const cardProgress = currentCard ? progress[currentCard.id] : undefined
  const cardStreak = cardProgress?.streak || 0
  const isMastered = cardProgress?.mastered || false

  return (
    <div className="cards-app">
      {/* Top Header / Status bar */}
      <header className="cards-header">
        <div className="cards-kicker-row">
          <span className="cards-kicker">CARDS / PATTERN REFLEX</span>
          <div className="cards-badges">
            <span className="cards-today-badge" title="Patterns reviewed today">
              ☀ {todayCount} today
            </span>
            {cardStreak > 0 && (
              <span className="cards-streak-badge" title="Consecutive correct reviews">
                🔥 {cardStreak}
              </span>
            )}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="cards-mode-tabs" role="tablist" aria-label="Session mode">
          <button
            type="button"
            className={`cards-mode-btn${sessionMode === "quick5" ? " active" : ""}`}
            onClick={() => setSessionMode("quick5")}
          >
            ⚡ Quick 5
          </button>
          <button
            type="button"
            className={`cards-mode-btn${sessionMode === "due" ? " active" : ""}`}
            onClick={() => setSessionMode("due")}
          >
            ↻ Due Reps
          </button>
          <button
            type="button"
            className={`cards-mode-btn${sessionMode === "all" ? " active" : ""}`}
            onClick={() => setSessionMode("all")}
          >
            All 36
          </button>
        </div>

        {/* Topic Filter Chips (horizontal scroll on mobile) */}
        <div className="cards-topic-scroll" aria-label="Filter by topic">
          <button
            type="button"
            className={`topic-chip${topicFilter === "all" ? " active" : ""}`}
            onClick={() => setTopicFilter("all")}
          >
            All Decks
          </button>
          {(Object.keys(TOPIC_LABELS) as CardTopic[]).map(t => (
            <button
              key={t}
              type="button"
              className={`topic-chip${topicFilter === t ? " active" : ""}`}
              onClick={() => setTopicFilter(t)}
            >
              {TOPIC_LABELS[t].glyph} {TOPIC_LABELS[t].label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Arena */}
      <main className="cards-main">
        {!sessionCompleted && currentCard ? (
          <>
            {/* Progress rail */}
            <div className="cards-progress-bar">
              <div
                className="cards-progress-fill"
                style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
              />
              <span className="cards-progress-text">
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>

            {/* 3D Touch Card Container */}
            <div
              className={`card-stage${isDragging ? " dragging" : ""}`}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              style={{
                transform: `translate3d(${dragOffset.x}px, ${dragOffset.y * 0.4}px, 0) rotate(${dragOffset.x * 0.05}deg)`,
                transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
              }}
            >
              {/* Swipe Cue Indicators */}
              {dragOffset.x > 30 && (
                <div className="swipe-stamp right-stamp">GOT IT ✓</div>
              )}
              {dragOffset.x < -30 && (
                <div className="swipe-stamp left-stamp">REVISIT ↻</div>
              )}

              <div className={`flip-card${isFlipped ? " flipped" : ""}`}>
                {/* CARD FRONT: The Challenge & Thinking Move */}
                <div className="card-face card-front" onClick={() => !selectedOption && handleFlip()}>
                  <div className="card-top-bar">
                    <span className="card-topic-tag">
                      {TOPIC_LABELS[currentCard.topic].glyph} {TOPIC_LABELS[currentCard.topic].label}
                    </span>
                    <span className={`card-diff-tag diff-${currentCard.difficulty.toLowerCase()}`}>
                      {currentCard.difficulty}
                    </span>
                    {isMastered && <span className="card-mastered-star">★ Mastered</span>}
                  </div>

                  <h2 className="card-title">{currentCard.title}</h2>
                  <p className="card-prompt">{currentCard.prompt}</p>

                  <div className="card-options-head">
                    <span>What is the core thinking-move?</span>
                  </div>

                  <div className="card-options-list">
                    {currentCard.options.map((opt, i) => {
                      const isSelected = selectedOption === i
                      const isCorrect = i === currentCard.correctOption
                      let statusClass = ""
                      if (selectedOption !== null) {
                        if (isCorrect) statusClass = " correct"
                        else if (isSelected) statusClass = " wrong"
                      }

                      return (
                        <button
                          key={i}
                          type="button"
                          className={`card-opt-btn${statusClass}${isSelected ? " selected" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectOption(i)
                          }}
                        >
                          <span className="opt-letter">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="opt-text">{opt}</span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="card-bottom-hint">
                    <span>Tap card or answer to reveal the mathematical invariant ↴</span>
                  </div>
                </div>

                {/* CARD BACK: The Core Invariant & Physical Law */}
                <div className="card-face card-back" onClick={handleFlip}>
                  <div className="card-top-bar">
                    <span className="card-move-name">
                      ⚡ {currentCard.moveName}
                    </span>
                    <span className="card-flip-back">Tap to flip ↺</span>
                  </div>

                  <div className="card-invariant-box">
                    <span className="invariant-kicker">THE INVARIANT</span>
                    <p className="invariant-body">{currentCard.invariant}</p>
                  </div>

                  <div className="card-waste-box">
                    <span className="waste-kicker">WHY NAIVE FAILS</span>
                    <p className="waste-body">{currentCard.naiveWaste}</p>
                  </div>

                  <div className="card-cue-box">
                    <span className="cue-kicker">RECOGNITION CUE</span>
                    <p className="cue-body">{currentCard.cue}</p>
                  </div>

                  {currentCard.practiceLink && (
                    <div className="card-practice-link-wrap" onClick={e => e.stopPropagation()}>
                      <Link href={currentCard.practiceLink} className="card-practice-btn">
                        Code this pattern in Drill Mode →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Thumb Action Bar */}
            <footer className="cards-thumb-bar">
              <button
                type="button"
                className="thumb-btn btn-again"
                onClick={() => advanceCard("again")}
                title="Review again today"
              >
                <span>↻</span>
                <small>Again</small>
              </button>
              <button
                type="button"
                className="thumb-btn btn-hard"
                onClick={() => advanceCard("hard")}
                title="Struggled (+1 day)"
              >
                <span>△</span>
                <small>Hard</small>
              </button>
              <button
                type="button"
                className="thumb-btn btn-good"
                onClick={() => advanceCard("good")}
                title="Derived it (+3 days)"
              >
                <span>✓</span>
                <small>Good</small>
              </button>
              <button
                type="button"
                className="thumb-btn btn-easy"
                onClick={() => advanceCard("easy")}
                title="Automatic (+7 days)"
              >
                <span>★</span>
                <small>Master</small>
              </button>
            </footer>
          </>
        ) : (
          /* Session Completed Summary Screen */
          <div className="session-summary-card">
            <span className="summary-icon">✦</span>
            <h2>Session Complete</h2>
            <p>
              You trained your pattern reflex across {cards.length} moves.
            </p>

            <div className="summary-stats-grid">
              <div className="stat-tile">
                <b>{sessionScore.correct}</b>
                <small>First-try derivations</small>
              </div>
              <div className="stat-tile">
                <b>{todayCount}</b>
                <small>Total reps today</small>
              </div>
            </div>

            <div className="summary-actions">
              <button type="button" className="btn-primary summary-cta" onClick={restartSession}>
                Train Another 5 Cards ↺
              </button>
              <Link href="/practice" className="btn-secondary summary-cta">
                Jump to Code Drill →
              </Link>
              <Link href="/" className="btn-ghost summary-cta">
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </main>

      <style>{`
        .cards-app {
          display: flex;
          flex-direction: column;
          min-height: calc(100dvh - var(--app-header-height, 52px));
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-ui);
          overflow-x: hidden;
          padding-bottom: calc(24px + env(safe-area-inset-bottom));
        }

        .cards-header {
          padding: 12px 16px 8px;
          border-bottom: 1px solid var(--line);
          background: var(--paper-raised);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .cards-kicker-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .cards-kicker {
          font: 700 11px var(--font-ui);
          letter-spacing: 0.12em;
          color: var(--accent);
        }

        .cards-badges {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .cards-today-badge, .cards-streak-badge {
          font: 700 11px var(--font-ui);
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--paper);
        }

        .cards-streak-badge {
          color: var(--accent);
          border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
        }

        .cards-mode-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 4px;
          background: var(--paper);
          padding: 3px;
          border-radius: var(--radius);
          border: 1px solid var(--line);
        }

        .cards-mode-btn {
          border: 0;
          background: transparent;
          color: var(--ink-soft);
          font: 600 12px var(--font-ui);
          padding: 6px 0;
          border-radius: calc(var(--radius) - 2px);
          cursor: pointer;
          transition: background var(--dur-fast), color var(--dur-fast);
        }

        .cards-mode-btn.active {
          background: var(--paper-raised);
          color: var(--ink);
          font-weight: 700;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .cards-topic-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
          -webkit-overflow-scrolling: touch;
        }
        .cards-topic-scroll::-webkit-scrollbar { display: none; }

        .topic-chip {
          white-space: nowrap;
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--ink-soft);
          font: 600 11px var(--font-ui);
          padding: 4px 10px;
          border-radius: 999px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--dur-fast);
        }

        .topic-chip.active {
          background: var(--accent);
          color: var(--paper-raised);
          border-color: var(--accent);
        }

        .cards-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 14px 16px;
          max-width: 520px;
          margin: 0 auto;
          width: 100%;
        }

        .cards-progress-bar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          position: relative;
        }

        .cards-progress-bar::before {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          height: 4px;
          background: var(--line);
          border-radius: 999px;
          transform: translateY(-50%);
        }

        .cards-progress-fill {
          position: absolute;
          left: 0;
          top: 50%;
          height: 4px;
          background: var(--accent);
          border-radius: 999px;
          transform: translateY(-50%);
          transition: width 0.3s ease;
        }

        .cards-progress-text {
          position: relative;
          z-index: 1;
          margin-left: auto;
          font: 600 10px var(--font-ui);
          color: var(--ink-soft);
          background: var(--paper);
          padding-left: 6px;
        }

        /* 3D Card Stage */
        .card-stage {
          width: 100%;
          min-height: 460px;
          perspective: 1000px;
          position: relative;
          cursor: grab;
          user-select: none;
          touch-action: pan-y;
        }
        .card-stage.dragging { cursor: grabbing; }

        .swipe-stamp {
          position: absolute;
          top: 24px;
          z-index: 10;
          font: 800 16px var(--font-ui);
          letter-spacing: 0.1em;
          padding: 6px 14px;
          border-radius: var(--radius);
          border: 3px solid;
          pointer-events: none;
          transform: rotate(-10deg);
        }
        .right-stamp {
          right: 20px;
          color: var(--viz-settled);
          border-color: var(--viz-settled);
          transform: rotate(10deg);
        }
        .left-stamp {
          left: 20px;
          color: var(--accent);
          border-color: var(--accent);
        }

        .flip-card {
          width: 100%;
          height: 100%;
          min-height: 460px;
          position: relative;
          transition: transform 0.45s cubic-bezier(0.4, 0.2, 0.2, 1);
          transform-style: preserve-3d;
        }

        .flip-card.flipped {
          transform: rotateY(180deg);
        }

        .card-face {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: 1px solid var(--line);
          border-radius: calc(var(--radius) + 6px);
          background: var(--paper-raised);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
          backface-visibility: hidden;
          padding: 20px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .card-back {
          transform: rotateY(180deg);
          border-color: color-mix(in srgb, var(--accent) 30%, var(--line));
        }

        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .card-topic-tag {
          font: 700 11px var(--font-ui);
          color: var(--ink-soft);
        }

        .card-diff-tag {
          font: 700 10px var(--font-ui);
          padding: 2px 7px;
          border-radius: 999px;
        }
        .diff-easy { background: color-mix(in srgb, var(--viz-settled) 15%, transparent); color: var(--viz-settled); }
        .diff-medium { background: color-mix(in srgb, var(--accent) 15%, transparent); color: var(--accent); }
        .diff-hard { background: color-mix(in srgb, var(--viz-pruned) 15%, transparent); color: var(--viz-pruned); }

        .card-mastered-star {
          font: 700 10px var(--font-ui);
          color: var(--viz-settled);
        }

        .card-title {
          font: 700 clamp(18px, 4.5vw, 22px)/1.2 var(--font-narrative);
          margin: 0 0 8px;
          letter-spacing: -0.02em;
        }

        .card-prompt {
          font: 14px/1.45 var(--font-ui);
          color: var(--ink-soft);
          margin: 0 0 16px;
        }

        .card-options-head {
          font: 700 11px var(--font-ui);
          letter-spacing: 0.08em;
          color: var(--ink);
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .card-options-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .card-opt-btn {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px 12px;
          border: 1px solid var(--line);
          border-radius: var(--radius);
          background: var(--paper);
          color: var(--ink);
          font: 500 13px/1.35 var(--font-ui);
          text-align: left;
          cursor: pointer;
          transition: border-color var(--dur-fast), background var(--dur-fast);
        }

        .card-opt-btn:hover {
          border-color: var(--accent);
        }

        .card-opt-btn.correct {
          border-color: var(--viz-settled);
          background: color-mix(in srgb, var(--viz-settled) 12%, var(--paper));
          color: var(--ink);
          font-weight: 600;
        }

        .card-opt-btn.wrong {
          border-color: var(--viz-pruned);
          background: color-mix(in srgb, var(--viz-pruned) 10%, var(--paper));
          color: var(--viz-pruned);
        }

        .opt-letter {
          display: grid;
          place-items: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid var(--line);
          font: 700 11px var(--font-ui);
          flex-shrink: 0;
          background: var(--paper-raised);
        }

        .card-bottom-hint {
          margin-top: auto;
          text-align: center;
          font: 11px var(--font-ui);
          color: var(--ink-soft);
          opacity: 0.8;
          padding-top: 8px;
        }

        /* Card Back Details */
        .card-move-name {
          font: 700 12px var(--font-ui);
          color: var(--accent);
          letter-spacing: 0.05em;
        }
        .card-flip-back {
          font: 600 11px var(--font-ui);
          color: var(--ink-soft);
        }

        .card-invariant-box {
          border-left: 3px solid var(--accent);
          padding: 8px 12px;
          background: color-mix(in srgb, var(--accent) 8%, var(--paper));
          border-radius: 0 var(--radius) var(--radius) 0;
          margin-bottom: 12px;
        }
        .invariant-kicker, .waste-kicker, .cue-kicker {
          display: block;
          font: 800 10px var(--font-ui);
          letter-spacing: 0.12em;
          margin-bottom: 3px;
        }
        .invariant-kicker { color: var(--accent); }
        .invariant-body {
          margin: 0;
          font: 600 13px/1.45 var(--font-ui);
          color: var(--ink);
        }

        .card-waste-box {
          border-left: 3px solid var(--viz-pruned);
          padding: 8px 12px;
          background: color-mix(in srgb, var(--viz-pruned) 6%, var(--paper));
          border-radius: 0 var(--radius) var(--radius) 0;
          margin-bottom: 12px;
        }
        .waste-kicker { color: var(--viz-pruned); }
        .waste-body {
          margin: 0;
          font: 12px/1.45 var(--font-ui);
          color: var(--ink-soft);
        }

        .card-cue-box {
          border-left: 3px solid var(--viz-settled);
          padding: 8px 12px;
          background: color-mix(in srgb, var(--viz-settled) 6%, var(--paper));
          border-radius: 0 var(--radius) var(--radius) 0;
          margin-bottom: 12px;
        }
        .cue-kicker { color: var(--viz-settled); }
        .cue-body {
          margin: 0;
          font: 12px/1.45 var(--font-ui);
          color: var(--ink-soft);
        }

        .card-practice-link-wrap {
          margin-top: auto;
          padding-top: 8px;
        }
        .card-practice-btn {
          display: block;
          text-align: center;
          padding: 8px 12px;
          border-radius: var(--radius);
          background: var(--paper);
          border: 1px solid var(--line);
          color: var(--ink);
          font: 600 12px var(--font-ui);
          text-decoration: none;
          transition: border-color var(--dur-fast);
        }
        .card-practice-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Thumb Action Bar */
        .cards-thumb-bar {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 8px;
          width: 100%;
          margin-top: 14px;
        }

        .thumb-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 0;
          border-radius: var(--radius);
          border: 1px solid var(--line);
          background: var(--paper-raised);
          cursor: pointer;
          min-height: 52px;
          transition: transform var(--dur-fast), background var(--dur-fast);
        }
        .thumb-btn:active { transform: scale(0.95); }
        .thumb-btn span { font: 700 15px var(--font-ui); }
        .thumb-btn small { font: 600 10px var(--font-ui); margin-top: 2px; }

        .btn-again { color: var(--viz-pruned); }
        .btn-again:hover { background: color-mix(in srgb, var(--viz-pruned) 10%, var(--paper-raised)); }

        .btn-hard { color: var(--accent); }
        .btn-hard:hover { background: color-mix(in srgb, var(--accent) 10%, var(--paper-raised)); }

        .btn-good { color: var(--ink); border-color: color-mix(in srgb, var(--accent) 40%, var(--line)); }
        .btn-good:hover { border-color: var(--accent); }

        .btn-easy { color: var(--viz-settled); }
        .btn-easy:hover { background: color-mix(in srgb, var(--viz-settled) 10%, var(--paper-raised)); }

        /* Summary Screen */
        .session-summary-card {
          width: 100%;
          padding: 36px 20px;
          border-radius: calc(var(--radius) + 6px);
          border: 1px solid var(--line);
          background: var(--paper-raised);
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
          margin-top: 24px;
        }
        .summary-icon {
          display: inline-block;
          font-size: 32px;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .session-summary-card h2 {
          font: 700 clamp(22px, 5vw, 28px) var(--font-narrative);
          margin: 0 0 8px;
        }
        .session-summary-card p {
          color: var(--ink-soft);
          font: 14px/1.5 var(--font-ui);
          margin: 0 0 24px;
        }
        .summary-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-tile {
          padding: 14px;
          border-radius: var(--radius);
          background: var(--paper);
          border: 1px solid var(--line);
        }
        .stat-tile b {
          display: block;
          font: 700 24px var(--font-ui);
          color: var(--accent);
        }
        .stat-tile small {
          font: 600 11px var(--font-ui);
          color: var(--ink-soft);
        }
        .summary-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .summary-cta {
          padding: 12px 16px;
          border-radius: var(--radius);
          font: 700 13px var(--font-ui);
          text-decoration: none;
          text-align: center;
        }
      `}</style>
    </div>
  )
}
