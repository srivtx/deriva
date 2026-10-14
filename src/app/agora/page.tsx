"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import Link from "next/link"
import {
  AGORA_TRACKS,
  AGORA_CHALLENGES,
  type AgoraChallenge,
  type AgoraTrackId,
} from "@/data/agora"
import {
  loadAgoraProgress,
  recordAgoraAttempt,
  type AgoraProgress,
} from "@/persistence/agora"
import { useAgoraSpeech } from "@/hooks/use-agora-speech"
import { AgoraChalkboard } from "@/components/agora-chalkboard"

export default function AgoraPage() {
  const [activeTrack, setActiveTrack] = useState<AgoraTrackId | "all">("all")
  const [currentChallengeId, setCurrentChallengeId] = useState<string>(AGORA_CHALLENGES[0].id)
  const [progress, setProgress] = useState<AgoraProgress | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [commuteCountdown, setCommuteCountdown] = useState<number | null>(null)

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize progress
  useEffect(() => {
    setProgress(loadAgoraProgress())
  }, [])

  const filteredChallenges = useMemo(() => {
    if (activeTrack === "all") return AGORA_CHALLENGES
    return AGORA_CHALLENGES.filter(c => c.trackId === activeTrack)
  }, [activeTrack])

  const challenge = useMemo(() => {
    return AGORA_CHALLENGES.find(c => c.id === currentChallengeId) || AGORA_CHALLENGES[0]
  }, [currentChallengeId])

  const currentAttempt = progress?.attempts[challenge.id]
  const isMastered = progress?.completedIds.includes(challenge.id)

  // Speech Hook with clause-by-clause pacing and broadcast cues
  const speech = useAgoraSpeech({
    initialPrefs: progress?.audioPrefs,
    onSpeechEnd: () => {
      // If commute mode is active and not yet answered, start countdown
      if (speech.commuteMode && !revealed) {
        startCommuteCountdown()
      }
    },
  })

  // When challenge changes, reset local state
  useEffect(() => {
    speech.stop()
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    setCommuteCountdown(null)

    if (currentAttempt) {
      setSelectedOptionId(currentAttempt.selectedOptionId)
      setRevealed(true)
    } else {
      setSelectedOptionId(null)
      setRevealed(false)
    }
  }, [challenge.id, currentAttempt])

  // Handle Commute Mode countdown
  const startCommuteCountdown = () => {
    let secondsLeft = 5
    setCommuteCountdown(secondsLeft)
    countdownTimerRef.current = setInterval(() => {
      secondsLeft -= 1
      if (secondsLeft <= 0) {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
        setCommuteCountdown(null)
        // Auto-select correct answer and speak invariant
        handleSelectOption(challenge.correctOptionId, false)
      } else {
        setCommuteCountdown(secondsLeft)
      }
    }, 1000)
  }

  // Handle user selecting an option
  const handleSelectOption = (optionId: string, spoken = false) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    setCommuteCountdown(null)

    setSelectedOptionId(optionId)
    setRevealed(true)

    const isCorrect = optionId === challenge.correctOptionId
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(isCorrect ? [25, 45, 25] : [70, 40, 70])
    }

    const updated = recordAgoraAttempt(challenge.id, optionId, isCorrect, spoken)
    setProgress(updated)

    // Narrate the result with cue sound
    const narrationText = isCorrect
      ? `Correct. ${challenge.invariantTitle}. ${challenge.audioScript.derivation}`
      : `Trap triggered. ${challenge.trapTitle}. ${challenge.audioScript.trap} ${challenge.audioScript.derivation}`

    speech.speak(
      narrationText,
      () => {
        // In commute mode, auto-advance after derivation is spoken
        if (speech.commuteMode) {
          setTimeout(handleNext, 2500)
        }
      },
      isCorrect ? "invariant" : "trap",
    )
  }

  // Mic spoken match
  useEffect(() => {
    if (!speech.transcript || revealed) return
    const text = speech.transcript.toLowerCase()
    for (const opt of challenge.options) {
      const words = opt.label.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      const matched = words.some(w => text.includes(w))
      if (matched) {
        handleSelectOption(opt.id, true)
        speech.stopListening()
        break
      }
    }
  }, [speech.transcript, revealed, challenge.options])

  const handleNext = () => {
    const currentIndex = filteredChallenges.findIndex(c => c.id === challenge.id)
    if (currentIndex < filteredChallenges.length - 1) {
      setCurrentChallengeId(filteredChallenges[currentIndex + 1].id)
    } else {
      setCurrentChallengeId(filteredChallenges[0].id)
    }
  }

  const handlePrev = () => {
    const currentIndex = filteredChallenges.findIndex(c => c.id === challenge.id)
    if (currentIndex > 0) {
      setCurrentChallengeId(filteredChallenges[currentIndex - 1].id)
    }
  }

  const handleHearSetup = () => {
    if (speech.speaking) {
      speech.stop()
      return
    }

    const fullScript = `${challenge.audioScript.setup} ${challenge.audioScript.question}`
    speech.speak(
      fullScript,
      () => {
        if (speech.commuteMode && !revealed) {
          startCommuteCountdown()
        }
      },
      "start",
    )
  }

  const cycleSpeed = () => {
    const rates = [0.8, 0.94, 1.1, 1.25]
    const curIdx = rates.indexOf(speech.speechRate)
    const nextRate = curIdx >= 0 && curIdx < rates.length - 1 ? rates[curIdx + 1] : rates[0]
    speech.setRate(nextRate)
  }

  const completedCount = progress?.completedIds.length ?? 0
  const totalStages = AGORA_CHALLENGES.length
  const progressPercent = Math.round((completedCount / totalStages) * 100)

  // Current stage index in overall 14-stage linear ladder
  const globalStageIndex = AGORA_CHALLENGES.findIndex(c => c.id === challenge.id)

  return (
    <main className="agora-page">
      {/* Top Application Bar */}
      <header className="agora-header">
        <div className="agora-header-left">
          <Link href="/" className="agora-back" aria-label="Return to launchpad">
            ←
          </Link>
          <div className="agora-brand">
            <span className="agora-tag">§ Production Defense System</span>
            <h1 className="agora-title">Agora Oral Defense</h1>
          </div>
        </div>

        {/* Global Stats & Commute Audio Controls */}
        <div className="agora-header-right">
          <div className="agora-stats">
            <span className="stats-label">Mastered</span>
            <strong className="stats-val">
              {completedCount} / {totalStages}
            </strong>
          </div>

          <div className="agora-audio-toolbar" role="toolbar" aria-label="Oral defense audio controls">
            <button
              type="button"
              onClick={speech.toggleMute}
              className={`agora-audio-btn${speech.muted ? " active-muted" : ""}`}
              title={speech.muted ? "Unmute audio" : "Mute voice"}
              aria-label={speech.muted ? "Unmute audio" : "Mute audio"}
            >
              {speech.muted ? "🔇" : "🔊"}
            </button>

            <button
              type="button"
              onClick={cycleSpeed}
              className="agora-audio-btn speed"
              title="Change speech rate"
              aria-label={`Speech rate ${speech.speechRate}x`}
            >
              {speech.speechRate}x
            </button>

            <button
              type="button"
              onClick={speech.toggleCommute}
              className={`agora-audio-btn commute${speech.commuteMode ? " active" : ""}`}
              title="Hands-free continuous commute mode"
              aria-label="Hands-free commute mode"
            >
              🎧 {speech.commuteMode ? "Hands-Free On" : "Hands-Free"}
            </button>
          </div>
        </div>
      </header>

      {/* Linear Progression Ladder Rail */}
      <section className="linear-ladder-rail" aria-label="14-stage curriculum progression">
        <div className="ladder-header">
          <div className="level-badge">
            <span className="level-num">Level {challenge.levelNumber}:</span>
            <strong className="level-name">{challenge.levelName}</strong>
          </div>
          <div className="stage-counter">
            Stage {challenge.stageNumber} of {totalStages} ({progressPercent}% complete)
          </div>
        </div>

        {/* Progress Bar */}
        <div className="ladder-progress-track">
          <div
            className="ladder-progress-fill"
            style={{ width: `${Math.max(6, progressPercent)}%` }}
          />
        </div>

        {/* 14 Stage Step Pills (Thumb-friendly mobile carousel / flex) */}
        <div className="ladder-steps" role="tablist" aria-label="Select stage">
          {AGORA_CHALLENGES.map((ch, idx) => {
            const isCompleted = progress?.completedIds.includes(ch.id)
            const isCurrent = ch.id === challenge.id
            const letter = ch.trackId === "quant" ? "Q" : ch.trackId === "systems" ? "S" : "D"

            return (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                onClick={() => {
                  setCurrentChallengeId(ch.id)
                  setActiveTrack("all")
                }}
                className={`ladder-step-pill${isCurrent ? " current" : ""}${isCompleted ? " completed" : ""}`}
                title={`Stage ${ch.stageNumber}: ${ch.title}`}
              >
                <span className="step-num">{ch.stageNumber}</span>
                <span className="step-mark">{isCompleted ? "✓" : letter}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Track Filter Chips */}
      <nav className="agora-track-nav" aria-label="Curriculum tracks">
        <button
          type="button"
          onClick={() => setActiveTrack("all")}
          className={`track-chip${activeTrack === "all" ? " active" : ""}`}
        >
          All Stages ({AGORA_CHALLENGES.length})
        </button>
        {AGORA_TRACKS.map(track => {
          const count = AGORA_CHALLENGES.filter(c => c.trackId === track.id).length
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => setActiveTrack(track.id)}
              className={`track-chip${activeTrack === track.id ? " active" : ""}`}
            >
              {track.title} ({count})
            </button>
          )
        })}
      </nav>

      {/* Main Defense Card Area */}
      <div className="agora-stage">
        {/* Meta Bar */}
        <div className="agora-meta-bar">
          <div className="meta-left">
            <span className="company-badge">{challenge.company}</span>
            <span className="track-badge">{challenge.trackId.toUpperCase()}</span>
            <span className={`diff-badge ${challenge.difficulty.toLowerCase()}`}>
              {challenge.difficulty}
            </span>
            {isMastered && <span className="mastered-pill">✓ Mastered</span>}
          </div>

          <div className="meta-pager">
            <button
              type="button"
              onClick={handlePrev}
              disabled={filteredChallenges.findIndex(c => c.id === challenge.id) === 0}
              className="pager-btn"
              aria-label="Previous challenge"
            >
              ← Prev
            </button>
            <span className="pager-num">
              Stage {challenge.stageNumber} of {totalStages}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={
                filteredChallenges.findIndex(c => c.id === challenge.id) ===
                filteredChallenges.length - 1
              }
              className="pager-btn"
              aria-label="Next challenge"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Concept Bridge Banner: Explicit Recursive Connection to Previous Stage */}
        <div className="concept-bridge-card">
          <div className="bridge-kicker">§ Concept Bridge · Recursive Invariant Link</div>
          <p className="bridge-text">{challenge.conceptBridge}</p>
        </div>

        {/* Spoken Dilemma Header */}
        <section className="dilemma-card">
          <div className="dilemma-head">
            <span className="dilemma-kicker">The Oral Dilemma</span>
            <h2 className="dilemma-title">{challenge.title}</h2>
          </div>

          <div className="dilemma-prompt-box">
            <p className="dilemma-prompt">{challenge.prompt}</p>
            {speech.speaking && speech.activePhrase && (
              <div className="active-spoken-phrase-pill">
                <span className="phrase-indicator">Speaking</span>
                <span className="phrase-text">&ldquo;{speech.activePhrase}&rdquo;</span>
              </div>
            )}
          </div>

          {/* Audio Player Strip */}
          <div className="audio-player-bar">
            <button
              type="button"
              onClick={handleHearSetup}
              className={`hear-btn${speech.speaking ? " speaking" : ""}`}
              aria-label={speech.speaking ? "Stop narration" : "Hear examiner speak dilemma"}
            >
              <span className="play-icon">{speech.speaking ? "⏹" : "▶"}</span>
              <span>{speech.speaking ? "Stop Examiner" : "Hear Examiner Speak Dilemma"}</span>
            </button>

            {speech.speaking && (
              <div className="sound-wave" aria-hidden="true">
                <span className="bar b1" />
                <span className="bar b2" />
                <span className="bar b3" />
                <span className="bar b4" />
              </div>
            )}

            {commuteCountdown !== null && (
              <div className="countdown-pill" aria-live="polite">
                <span>Commute Timer: </span>
                <strong>{commuteCountdown}s</strong>
              </div>
            )}
          </div>
        </section>

        {/* Visual Invariant Chalkboard */}
        <AgoraChalkboard
          spec={challenge.chalkboard}
          revealed={revealed}
          isCorrect={selectedOptionId === challenge.correctOptionId}
        />

        {/* Socratic Defense Phase (Choices & Mic) */}
        <section className="defense-section">
          <div className="defense-head">
            <span className="defense-kicker">Your Oral Response</span>
            <h3 className="defense-title">
              State your hypothesis before the examiner reveals the trap.
            </h3>
          </div>

          {/* Voice Input Strip */}
          {speech.micSupported && (
            <div className="mic-container">
              <button
                type="button"
                onClick={speech.listening ? speech.stopListening : speech.startListening}
                className={`mic-btn${speech.listening ? " listening" : ""}`}
                aria-label={speech.listening ? "Stop recording speech" : "Speak your response"}
              >
                <span className="mic-icon">🎙</span>
                <span>{speech.listening ? "Listening... (Speak Now)" : "Speak Your Response"}</span>
              </button>
              {speech.transcript && (
                <p className="mic-transcript">
                  Heard: <em>&ldquo;{speech.transcript}&rdquo;</em>
                </p>
              )}
            </div>
          )}

          {/* Options Grid (Mobile-friendly large tap targets with letters A, B, C, D) */}
          <div className="options-grid" role="radiogroup" aria-label="Defense options">
            {challenge.options.map((option, optIdx) => {
              const letter = ["A", "B", "C", "D"][optIdx] || String(optIdx + 1)
              const isSelected = selectedOptionId === option.id
              const isCorrect = option.id === challenge.correctOptionId
              let optionClass = "option-card"
              if (revealed) {
                if (isCorrect) optionClass += " correct"
                else if (isSelected && !isCorrect) optionClass += " trap-selected"
                else optionClass += " muted"
              }

              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => handleSelectOption(option.id)}
                  className={optionClass}
                >
                  <span className="option-letter">{letter}</span>
                  <div className="option-content">
                    <span className="option-label">{option.label}</span>
                    {revealed && isSelected && option.trapExplanation && (
                      <span className="option-trap-note">{option.trapExplanation}</span>
                    )}
                  </div>
                  <span className="option-indicator">
                    {revealed && isCorrect ? "✓" : revealed && isSelected ? "✗" : "○"}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* The Teardown (Revealed after defense) */}
        {revealed && (
          <section className="teardown-section stagger">
            {/* Trap Teardown Card */}
            <div
              className={`teardown-card trap${selectedOptionId === challenge.correctOptionId ? " bypassed" : ""}`}
            >
              <div className="teardown-head">
                <span className="teardown-badge">⚠ THE TRAP EXPOSED</span>
                <h4>{challenge.trapTitle}</h4>
              </div>
              <p className="teardown-body">{challenge.trapBreakdown}</p>
            </div>

            {/* Invariant Derivation Card */}
            <div className="teardown-card invariant">
              <div className="teardown-head">
                <span className="teardown-badge invariant-badge">§ FIRST-PRINCIPLES INVARIANT</span>
                <h4>{challenge.invariantTitle}</h4>
              </div>
              <p className="teardown-body">{challenge.invariantDerivation}</p>

              {/* Whiteboard Notes */}
              <div className="whiteboard-notes">
                <span className="wb-kicker">Whiteboard Invariant Proof</span>
                <div className="wb-grid">
                  {challenge.whiteboardNotes.map((note, i) => (
                    <div key={i} className="wb-row">
                      <span className="wb-lbl">{note.label}:</span>
                      <strong className="wb-val">{note.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interview Law */}
              <div className="takeaway-box">
                <span className="takeaway-icon">§</span>
                <p>
                  <strong>Interview Invariant Law: </strong>
                  {challenge.interviewTakeaway}
                </p>
              </div>
            </div>

            {/* Next Action Button */}
            <div className="teardown-nav">
              <button type="button" onClick={handleNext} className="btn-next-defense">
                Advance to Stage{" "}
                {globalStageIndex < totalStages - 1
                  ? AGORA_CHALLENGES[globalStageIndex + 1].stageNumber
                  : 1}{" "}
                →
              </button>
            </div>
          </section>
        )}

        {/* Bottom Mobile Floating Navigation Bar */}
        <div className="mobile-bottom-nav">
          <button
            type="button"
            onClick={handlePrev}
            disabled={globalStageIndex === 0}
            className="mobile-nav-btn prev"
          >
            ← Prev Stage
          </button>
          <div className="mobile-nav-indicator">
            Stage {challenge.stageNumber} / {totalStages}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="mobile-nav-btn next"
          >
            Next Stage →
          </button>
        </div>
      </div>

      <style jsx>{`
        .agora-page {
          min-height: calc(100vh - 52px);
          background: var(--paper);
          color: var(--ink);
          padding: var(--sp-3) var(--sp-4) calc(var(--sp-8) + 60px);
          max-width: 860px;
          margin: 0 auto;
          font-family: var(--font-ui);
        }

        .agora-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--sp-3);
          padding-bottom: var(--sp-3);
          border-bottom: 1px solid var(--line);
        }

        .agora-header-left {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
        }

        .agora-back {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: var(--paper-raised);
          color: var(--ink);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          transition: background 0.15s ease, border-color 0.15s ease;
        }

        .agora-back:hover {
          background: var(--accent-soft);
          border-color: var(--accent);
        }

        .agora-tag {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
          display: block;
        }

        .agora-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        .agora-header-right {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          flex-wrap: wrap;
        }

        .agora-stats {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.2;
        }

        .stats-label {
          font-size: 10px;
          color: var(--ink-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stats-val {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
          color: var(--accent);
        }

        .agora-audio-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .agora-audio-btn {
          height: 34px;
          padding: 0 10px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--paper-raised);
          color: var(--ink);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }

        .agora-audio-btn:hover {
          background: var(--paper-hover);
          border-color: var(--ink-soft);
        }

        .agora-audio-btn.active {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        .agora-audio-btn.active-muted {
          background: var(--viz-pruned-soft, rgba(255, 100, 100, 0.1));
          border-color: var(--viz-pruned);
          color: var(--viz-pruned);
        }

        .agora-audio-btn.speed {
          font-family: var(--font-mono);
          min-width: 44px;
          justify-content: center;
        }

        /* Linear Progression Ladder Rail */
        .linear-ladder-rail {
          margin-top: var(--sp-3);
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: var(--sp-3);
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .ladder-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--sp-2);
        }

        .level-badge {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .level-num {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--accent);
          letter-spacing: 0.04em;
        }

        .level-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
        }

        .stage-counter {
          font-size: 11px;
          color: var(--ink-soft);
          font-family: var(--font-mono);
        }

        .ladder-progress-track {
          width: 100%;
          height: 6px;
          background: var(--line);
          border-radius: 999px;
          overflow: hidden;
        }

        .ladder-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .ladder-steps {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: thin;
        }

        .ladder-step-pill {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--ink-soft);
          font-size: 11px;
          font-family: var(--font-mono);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ladder-step-pill:hover {
          border-color: var(--ink);
          color: var(--ink);
        }

        .ladder-step-pill.completed {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        .ladder-step-pill.current {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--paper);
          box-shadow: 0 0 0 2px var(--accent);
        }

        .step-mark {
          font-size: 9px;
          font-weight: 800;
          opacity: 0.8;
        }

        /* Track Filter Navigation */
        .agora-track-nav {
          display: flex;
          gap: var(--sp-2);
          overflow-x: auto;
          padding: var(--sp-2) 0;
          scrollbar-width: none;
        }

        .track-chip {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: var(--paper-raised);
          color: var(--ink-soft);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease;
        }

        .track-chip:hover {
          border-color: var(--ink);
          color: var(--ink);
        }

        .track-chip.active {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--paper);
        }

        /* Stage Area */
        .agora-stage {
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
          margin-top: var(--sp-2);
        }

        .agora-meta-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--sp-2);
        }

        .meta-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .company-badge {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 11px;
          font-weight: 700;
          color: var(--ink);
        }

        .track-badge {
          background: var(--accent-soft);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--accent);
        }

        .diff-badge {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .diff-badge.hard {
          background: var(--viz-active-soft, rgba(0, 150, 255, 0.1));
          color: var(--viz-active);
        }

        .diff-badge.elite {
          background: var(--accent-soft);
          color: var(--accent);
        }

        .mastered-pill {
          background: var(--accent-soft);
          border: 1px solid var(--accent);
          color: var(--accent);
          border-radius: 4px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 800;
        }

        .meta-pager {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pager-btn {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--paper-raised);
          color: var(--ink);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .pager-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .pager-num {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--ink-soft);
        }

        /* Concept Bridge Card */
        .concept-bridge-card {
          background: var(--paper-raised);
          border-left: 3px solid var(--accent);
          border-top: 1px solid var(--line);
          border-right: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          border-radius: 6px;
          padding: var(--sp-3);
        }

        .bridge-kicker {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--accent);
          margin-bottom: 4px;
        }

        .bridge-text {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--ink);
        }

        /* Dilemma Card */
        .dilemma-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: var(--sp-4);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .dilemma-kicker {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--ink-soft);
        }

        .dilemma-title {
          margin: 4px 0 0;
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        .dilemma-prompt-box {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .dilemma-prompt {
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
          color: var(--ink);
        }

        .active-spoken-phrase-pill {
          background: var(--accent-soft);
          border: 1px solid var(--accent);
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12px;
          color: var(--ink);
          display: flex;
          align-items: flex-start;
          gap: 6px;
          animation: pulseFade 1.2s infinite alternate ease-in-out;
        }

        @keyframes pulseFade {
          from {
            opacity: 0.85;
          }
          to {
            opacity: 1;
          }
        }

        .phrase-indicator {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
          padding: 2px 4px;
          background: var(--paper);
          border-radius: 4px;
          white-space: nowrap;
        }

        .phrase-text {
          font-style: italic;
          color: var(--ink);
          line-height: 1.4;
        }

        .audio-player-bar {
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          flex-wrap: wrap;
          padding-top: var(--sp-2);
          border-top: 1px solid var(--line);
        }

        .hear-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 8px;
          border: 1px solid var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.15s ease;
        }

        .hear-btn:hover {
          background: var(--accent);
          color: var(--paper);
        }

        .hear-btn.speaking {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--paper);
        }

        .sound-wave {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 18px;
        }

        .sound-wave .bar {
          width: 3px;
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          animation: wave 1s infinite ease-in-out;
        }

        .sound-wave .b1 {
          animation-delay: 0.1s;
        }
        .sound-wave .b2 {
          animation-delay: 0.25s;
        }
        .sound-wave .b3 {
          animation-delay: 0.4s;
        }
        .sound-wave .b4 {
          animation-delay: 0.55s;
        }

        @keyframes wave {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 18px;
          }
        }

        .countdown-pill {
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--accent-soft);
          border: 1px solid var(--accent);
          color: var(--accent);
        }

        /* Defense Section */
        .defense-section {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: var(--sp-4);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .defense-kicker {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
        }

        .defense-title {
          margin: 4px 0 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }

        .mic-container {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .mic-btn {
          height: 40px;
          padding: 0 16px;
          border-radius: 8px;
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--ink);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          transition: all 0.15s ease;
        }

        .mic-btn.listening {
          background: var(--viz-pruned-soft, rgba(255, 100, 100, 0.1));
          border-color: var(--viz-pruned);
          color: var(--viz-pruned);
          animation: micPulse 1.2s infinite alternate;
        }

        @keyframes micPulse {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.02);
          }
        }

        .mic-transcript {
          margin: 0;
          font-size: 12px;
          color: var(--ink-soft);
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .option-card {
          min-height: 54px;
          padding: 12px 16px;
          border-radius: 8px;
          border: 1.5px solid var(--line);
          background: var(--paper);
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: var(--sp-3);
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
        }

        .option-card:hover {
          background: var(--paper-hover);
          border-color: var(--ink-soft);
        }

        .option-letter {
          width: 26px;
          height: 26px;
          border-radius: 6px;
          background: var(--paper-raised);
          border: 1px solid var(--line);
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .option-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .option-label {
          font-size: 14px;
          line-height: 1.4;
          font-weight: 500;
        }

        .option-trap-note {
          font-size: 12px;
          color: var(--viz-pruned);
          font-weight: 600;
        }

        .option-indicator {
          font-size: 15px;
          font-family: var(--font-mono);
          color: var(--ink-soft);
        }

        .option-card.correct {
          background: var(--accent-soft);
          border-color: var(--accent);
          color: var(--accent);
        }

        .option-card.correct .option-letter {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--paper);
        }

        .option-card.correct .option-indicator {
          color: var(--accent);
          font-weight: 800;
        }

        .option-card.trap-selected {
          background: var(--viz-pruned-soft, rgba(255, 100, 100, 0.1));
          border-color: var(--viz-pruned);
          color: var(--viz-pruned);
        }

        .option-card.trap-selected .option-letter {
          background: var(--viz-pruned);
          border-color: var(--viz-pruned);
          color: var(--paper);
        }

        .option-card.trap-selected .option-indicator {
          color: var(--viz-pruned);
          font-weight: 800;
        }

        .option-card.muted {
          opacity: 0.55;
        }

        /* Teardown Section */
        .teardown-section {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .teardown-card {
          border-radius: var(--radius);
          padding: var(--sp-4);
          border: 1px solid var(--line);
          background: var(--paper-raised);
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .teardown-card.trap {
          border-left: 4px solid var(--viz-pruned);
        }

        .teardown-card.trap.bypassed {
          opacity: 0.85;
          border-left-color: var(--ink-soft);
        }

        .teardown-card.invariant {
          border-left: 4px solid var(--accent);
        }

        .teardown-head h4 {
          margin: 4px 0 0;
          font-size: 15px;
          font-weight: 800;
          color: var(--ink);
        }

        .teardown-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--viz-pruned);
        }

        .invariant-badge {
          color: var(--accent);
        }

        .teardown-body {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--ink);
        }

        .whiteboard-notes {
          margin-top: var(--sp-2);
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: var(--sp-3);
        }

        .wb-kicker {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--accent);
          display: block;
          margin-bottom: 6px;
        }

        .wb-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .wb-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          font-size: 12px;
          border-bottom: 1px dotted var(--line);
          padding-bottom: 2px;
        }

        .wb-lbl {
          color: var(--ink-soft);
        }

        .wb-val {
          font-family: var(--font-mono);
          color: var(--ink);
        }

        .takeaway-box {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          background: var(--accent-soft);
          border-radius: 6px;
          padding: 10px 12px;
          margin-top: var(--sp-2);
        }

        .takeaway-icon {
          font-size: 14px;
          font-weight: 800;
          color: var(--accent);
          line-height: 1;
        }

        .takeaway-box p {
          margin: 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--ink);
        }

        .teardown-nav {
          display: flex;
          justify-content: flex-end;
          margin-top: var(--sp-2);
        }

        .btn-next-defense {
          height: 44px;
          padding: 0 20px;
          border-radius: 8px;
          border: none;
          background: var(--accent);
          color: var(--paper);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }

        .btn-next-defense:hover {
          opacity: 0.9;
        }

        /* Mobile Bottom Floating Navigation Bar */
        .mobile-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: var(--paper-raised);
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--sp-4);
          z-index: 100;
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
        }

        .mobile-nav-btn {
          height: 38px;
          padding: 0 14px;
          border-radius: 6px;
          border: 1px solid var(--line);
          background: var(--paper);
          color: var(--ink);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mobile-nav-btn:hover {
          background: var(--paper-hover);
        }

        .mobile-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .mobile-nav-btn.next {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--paper);
        }

        .mobile-nav-indicator {
          font-size: 12px;
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--ink-soft);
        }

        @media (min-width: 860px) {
          .mobile-bottom-nav {
            display: none;
          }
          .agora-page {
            padding-bottom: var(--sp-8);
          }
        }
      `}</style>
    </main>
  )
}
