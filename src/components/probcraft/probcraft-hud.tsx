// In-Game 3D Voxel HUD & Probability Analysis Slate for ProbCraft
// Conforms strictly to design tokens, zero arbitrary hex, zero AI icons.

import { useState, useMemo, useEffect } from "react"
import { type ProbWorld, type ProbOption } from "@/data/probcraft-worlds"
import { probAudio } from "./probcraft-audio"

export interface ProbCraftHUDProps {
  world: ProbWorld
  trialsCount: number
  empiricalMean: number
  history: number[]
  currentTarget: { id: string; name: string; oddsDesc: string; expectedValue: number } | null
  activeHotbarSlot: number
  onSelectSlot: (slot: number) => void
  onMineClick: () => void
  onFastSimulate: (rounds: number) => void
  onAnswerSubmit: (optionId: string) => void
  selectedAnswerId: string | null
  isAnswerSubmitted: boolean
  onNextWorld: () => void
  onPrevWorld: () => void
  isSoundEnabled: boolean
  onToggleSound: () => void
  onTeleportSelect: (worldNumber: number) => void
  allWorlds: ProbWorld[]
  microstateCounts?: Record<string, number>
  lastMicrostateId?: string | null
  isHudHidden?: boolean
  onToggleHud?: () => void
  discoveriesFound?: string[]
  // Controlled modal props
  showCodex?: boolean
  onToggleCodex?: (val: boolean) => void
  showJournal?: boolean
  onToggleJournal?: (val: boolean) => void
  showKeybindings?: boolean
  onToggleKeybindings?: (val: boolean) => void
}

export function ProbCraftHUD({
  world,
  trialsCount,
  empiricalMean,
  history,
  currentTarget,
  activeHotbarSlot,
  onSelectSlot,
  onMineClick,
  onFastSimulate,
  onAnswerSubmit,
  selectedAnswerId,
  isAnswerSubmitted,
  onNextWorld,
  onPrevWorld,
  isSoundEnabled,
  onToggleSound,
  onTeleportSelect,
  allWorlds,
  microstateCounts = {},
  lastMicrostateId = null,
  isHudHidden = false,
  onToggleHud = () => {},
  discoveriesFound = [],
  showCodex: propShowCodex,
  onToggleCodex,
  showJournal: propShowJournal,
  onToggleJournal,
  showKeybindings: propShowKeybindings,
  onToggleKeybindings,
}: ProbCraftHUDProps) {
  const [internalModalOpen, setInternalModalOpen] = useState(false)
  const [activeModalTab, setActiveModalTab] = useState<"codex" | "journal" | "keys">("codex")
  const [journalFilter, setJournalFilter] = useState<"all" | "current" | "unsealed">("all")
  const [showTeleportMenu, setShowTeleportMenu] = useState(false)
  const [activeQuestStep, setActiveQuestStep] = useState(0)
  const [isQuestCollapsed, setIsQuestCollapsed] = useState(false)
  const [isMicrostateCollapsed, setIsMicrostateCollapsed] = useState(false)
  const [isTrackerCollapsed, setIsTrackerCollapsed] = useState(false)

  // Extract all 17 Discovery Shards across the 8 curriculum realms
  const allDiscoveryShards = useMemo(() => {
    return allWorlds.flatMap(w =>
      w.interactiveTargets
        .filter(t => t.id.startsWith("shrine-"))
        .map(t => ({
          ...t,
          worldNumber: w.worldNumber,
          worldTitle: w.title,
          worldConcept: w.concept,
          worldTheorem: w.theorem,
        }))
    )
  }, [allWorlds])

  // Sync prop triggers with modal state
  useEffect(() => {
    if (propShowCodex) {
      setActiveModalTab("codex")
      setInternalModalOpen(true)
    }
  }, [propShowCodex])

  useEffect(() => {
    if (propShowJournal) {
      setActiveModalTab("journal")
      setInternalModalOpen(true)
    }
  }, [propShowJournal])

  useEffect(() => {
    if (propShowKeybindings) {
      setActiveModalTab("keys")
      setInternalModalOpen(true)
    }
  }, [propShowKeybindings])

  const isModalOpen = internalModalOpen || Boolean(propShowCodex) || Boolean(propShowJournal) || Boolean(propShowKeybindings)

  const closeModal = () => {
    setInternalModalOpen(false)
    onToggleCodex?.(false)
    onToggleJournal?.(false)
    onToggleKeybindings?.(false)
  }

  const openTab = (tab: "codex" | "journal" | "keys") => {
    setActiveModalTab(tab)
    setInternalModalOpen(true)
    onToggleCodex?.(tab === "codex")
    onToggleJournal?.(tab === "journal")
    onToggleKeybindings?.(tab === "keys")
  }

  // Close modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        closeModal()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isModalOpen])

  const currentQuestStage = world.questStages[activeQuestStep] || world.questStages[0]
  const progressPercent = Math.min(100, Math.round((trialsCount / world.targetTrials) * 100))
  const isGoalReached = trialsCount >= world.targetTrials

  // Check if targeted voxel is an ancient discovery shrine
  const isTargetShrine = Boolean(currentTarget && currentTarget.id.startsWith("shrine-"))
  const isTargetShrineFound = Boolean(currentTarget && isTargetShrine && discoveriesFound.includes(currentTarget.id))

  const handleSelectOption = (opt: ProbOption) => {
    if (isAnswerSubmitted) return
    if (opt.id === world.correctOptionId) {
      probAudio.playFanfare()
    } else {
      probAudio.playTrapBuzzer()
    }
    onAnswerSubmit(opt.id)
  }

  // Filtered discovery shards for journal
  const filteredShards = useMemo(() => {
    if (journalFilter === "current") {
      return allDiscoveryShards.filter(s => s.worldNumber === world.worldNumber)
    }
    if (journalFilter === "unsealed") {
      return allDiscoveryShards.filter(s => discoveriesFound.includes(s.id))
    }
    return allDiscoveryShards
  }, [allDiscoveryShards, journalFilter, world.worldNumber, discoveriesFound])

  return (
    <div className="probcraft-hud" aria-label="3D Voxel Simulation HUD">
      {/* 1. Center Crosshair Reticle with Adaptive Lock Ticks */}
      <div className="hud-crosshair" aria-hidden="true">
        <div className={`crosshair-reticle${currentTarget ? " target-locked" : ""}${isTargetShrine ? " shrine-locked" : ""}`}>
          <div className="crosshair-dot" />
          <span className="reticle-tick top-left" />
          <span className="reticle-tick top-right" />
          <span className="reticle-tick bottom-left" />
          <span className="reticle-tick bottom-right" />
        </div>
        {currentTarget && (
          <div className="crosshair-target-tooltip">
            {isTargetShrine ? (
              <span className={`target-badge shard${isTargetShrineFound ? " unsealed" : ""}`}>
                {isTargetShrineFound ? "📜 SHARD UNSEALED" : "📜 ANCIENT INSCRIPTION SHARD"}
              </span>
            ) : currentTarget.oddsDesc.toLowerCase().includes("vault") ? (
              <span className="target-badge vault">COIN VAULT</span>
            ) : currentTarget.oddsDesc.toLowerCase().includes("portal") ? (
              <span className="target-badge portal">PORTAL GATEWAY</span>
            ) : (
              <span className="target-badge">PROBABILITY TARGET</span>
            )}
            <strong className="target-name">{currentTarget.name}</strong>
            <span className="target-odds">{currentTarget.oddsDesc}</span>
            <span className="target-hint">
              {isTargetShrine
                ? isTargetShrineFound
                  ? "[Already Unsealed · Left Click or E to Re-read]"
                  : "[Left Click or E to Unseal Shard & Play Fanfare]"
                : "[Left Click or E to Mine & Probe Microstate]"}
            </span>
          </div>
        )}
      </div>

      {/* Floating Restore Pill when HUD is Hidden */}
      {isHudHidden && (
        <button
          type="button"
          className="hud-unhide-pill"
          onClick={onToggleHud}
          title="Show HUD [Press H]"
        >
          👁 Show HUD (H)
        </button>
      )}

      {/* Full Minimalist Translucent HUD Overlay */}
      {!isHudHidden && (
        <>
          {/* 2. Top Banner: World Info & Progress */}
          <header className="hud-top-bar">
            <div className="world-badge-group">
              <button
                type="button"
                className="hud-btn-teleport"
                onClick={() => setShowTeleportMenu(!showTeleportMenu)}
                title="Teleport to any world [1-8]"
              >
                World {world.worldNumber}/8 ▾
              </button>
              <div className="world-titles">
                <h1 className="world-h1">{world.title}</h1>
                <span className="world-subtitle">{world.subtitle}</span>
              </div>
            </div>

            <div className="hud-stats-pill">
              <button
                type="button"
                className={`hud-tab-trigger-btn${discoveriesFound.length > 0 ? " active-shards" : ""}`}
                onClick={() => openTab("journal")}
                title="Open Discovery Shards Journal [Press J]"
              >
                📜 Shards: <strong>{discoveriesFound.length}/{allDiscoveryShards.length}</strong>
              </button>
              <div className="stat-col">
                <span className="stat-label">Trials (N)</span>
                <strong className="stat-val">{trialsCount} / {world.targetTrials}</strong>
              </div>
              <div className="stat-col">
                <span className="stat-label">Sample Mean</span>
                <strong className="stat-val accent">{empiricalMean.toFixed(3)}</strong>
              </div>
              <div className="stat-col">
                <span className="stat-label">Theoretical E[X]</span>
                <strong className="stat-val settled">
                  {world.interactiveTargets[0]?.expectedValue.toFixed(3) ?? "—"}
                </strong>
              </div>
              <button
                type="button"
                className="hud-action-pill-btn"
                onClick={() => openTab("codex")}
                title="Open Invariant Codex [Press C]"
              >
                § Codex
              </button>
              <button
                type="button"
                className="hud-action-pill-btn"
                onClick={() => openTab("keys")}
                title="Open Keybindings Guide [Press K or ?]"
              >
                ⌨ Keys
              </button>
              <button
                type="button"
                onClick={onToggleSound}
                className={`hud-icon-btn${isSoundEnabled ? " active" : ""}`}
                title={`Audio: ${isSoundEnabled ? "Mute" : "Unmute"} [Press M]`}
              >
                {isSoundEnabled ? "🔊" : "🔇"}
              </button>
              <button
                type="button"
                onClick={onToggleHud}
                className="hud-hide-pill-btn"
                title="Hide all HUD overlays [Press H]"
              >
                👁 Hide (H)
              </button>
            </div>
          </header>

          {/* Teleport World Dropdown Menu */}
          {showTeleportMenu && (
            <div className="teleport-modal">
              <span className="teleport-kicker">PROBCRAFT 8-WORLD LADDER</span>
              <div className="teleport-grid">
                {allWorlds.map(w => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      onTeleportSelect(w.worldNumber)
                      setShowTeleportMenu(false)
                    }}
                    className={`teleport-cell${w.worldNumber === world.worldNumber ? " active" : ""}`}
                  >
                    <span className="tele-num">W{w.worldNumber}</span>
                    <span className="tele-title">{w.title}</span>
                    <span className="tele-diff">{w.difficulty}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Left Telemetry & Quest Guide Stack */}
          <div className="hud-left-panel">
            {/* Active Quest & Inquiry Card */}
            <section className="hud-quest-card" aria-label="Current Probability Quest">
              <div className="quest-header">
                <div className="quest-pills-row">
                  {world.questStages.map((stage, idx) => (
                    <button
                      key={stage.stageNumber}
                      type="button"
                      onClick={() => {
                        setActiveQuestStep(idx)
                        setIsQuestCollapsed(false)
                      }}
                      className={`quest-pill${activeQuestStep === idx ? " active" : ""}`}
                    >
                      Act {stage.stageNumber}
                    </button>
                  ))}
                </div>
                <div className="card-header-actions">
                  <span className="quest-diff-badge">{world.difficulty}</span>
                  <button
                    type="button"
                    className="hud-card-toggle"
                    onClick={() => setIsQuestCollapsed(!isQuestCollapsed)}
                    title={isQuestCollapsed ? "Expand Quest" : "Minimize Quest"}
                  >
                    {isQuestCollapsed ? "+" : "—"}
                  </button>
                </div>
              </div>

              {!isQuestCollapsed ? (
                <>
                  <div className="quest-content">
                    <h2 className="quest-step-title">{currentQuestStage.title}</h2>
                    <p className="quest-step-obj">{currentQuestStage.objective}</p>

                    {activeQuestStep === 1 && (
                      <div className="quest-experiment-status">
                        <div className="experiment-meter-labels">
                          <span>Experiment Trials</span>
                          <strong>{trialsCount} / {world.targetTrials}</strong>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="quest-hint-box">
                      <span className="quest-hint-kicker">Thinking Move</span>
                      <p className="quest-hint-text">{currentQuestStage.hint}</p>
                    </div>
                  </div>

                  <div className="quest-footer">
                    <button
                      type="button"
                      className="quest-nav-btn"
                      disabled={activeQuestStep === 0}
                      onClick={() => setActiveQuestStep(prev => Math.max(0, prev - 1))}
                    >
                      ← Prev
                    </button>
                    {activeQuestStep === 2 ? (
                      <button
                        type="button"
                        className="quest-nav-btn action"
                        onClick={() => openTab("codex")}
                      >
                        Open Invariant Proof →
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="quest-nav-btn next"
                        onClick={() => setActiveQuestStep(prev => Math.min(world.questStages.length - 1, prev + 1))}
                      >
                        Next Act →
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="card-collapsed-row" onClick={() => setIsQuestCollapsed(false)}>
                  <span className="card-collapsed-title">📖 Act {activeQuestStep + 1}: {currentQuestStage.title}</span>
                  <span className="card-collapsed-action">Expand ▾</span>
                </div>
              )}
            </section>

            {/* Live Microstate Sample Space Inspector Card */}
            <section className="hud-microstate-card" aria-label="Microstate Inspector">
              <div className="microstate-card-header">
                <span className="microstate-card-kicker">Sample Space Microstates</span>
                <div className="card-header-actions">
                  <span className="microstate-total">N = {trialsCount}</span>
                  <button
                    type="button"
                    className="hud-card-toggle"
                    onClick={() => setIsMicrostateCollapsed(!isMicrostateCollapsed)}
                    title={isMicrostateCollapsed ? "Expand Microstates" : "Minimize Microstates"}
                  >
                    {isMicrostateCollapsed ? "+" : "—"}
                  </button>
                </div>
              </div>

              {!isMicrostateCollapsed ? (
                <div className="microstate-list">
                  {world.microstatePaths.map(path => {
                    const count = microstateCounts[path.id] || 0
                    const pct = trialsCount > 0 ? Math.round((count / trialsCount) * 100) : 0
                    const isPulse = lastMicrostateId === path.id

                    return (
                      <div key={path.id} className={`microstate-row${isPulse ? " pulse" : ""}`}>
                        <div className="microstate-top">
                          <span className="micro-indicator" style={{ backgroundColor: path.color }} />
                          <span className="micro-label">{path.label}</span>
                          <strong className="micro-val">{pct}% ({count})</strong>
                        </div>
                        <div className="micro-bar">
                          <div className="micro-bar-fill" style={{ width: `${pct}%`, backgroundColor: path.color }} />
                        </div>
                        <span className="micro-sub">{path.probDesc}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="card-collapsed-row" onClick={() => setIsMicrostateCollapsed(false)}>
                  <span className="card-collapsed-title">📊 Microstates ({world.microstatePaths.length} Paths)</span>
                  <span className="card-collapsed-action">Expand ▾</span>
                </div>
              )}
            </section>
          </div>

          {/* 4. Live Convergence Real-Time Mini Graph (Top Right HUD) */}
          <div className="hud-convergence-card">
            <div className="card-header">
              <span className="kicker">Convergence Tracker</span>
              <div className="card-header-actions">
                <span className="indicator">{progressPercent}%</span>
                <button
                  type="button"
                  className="hud-card-toggle"
                  onClick={() => setIsTrackerCollapsed(!isTrackerCollapsed)}
                  title={isTrackerCollapsed ? "Expand Tracker" : "Minimize Tracker"}
                >
                  {isTrackerCollapsed ? "+" : "—"}
                </button>
              </div>
            </div>

            {!isTrackerCollapsed ? (
              <>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>

                {/* Mini SVG Sparkline of the Sample Mean History */}
                <div className="sparkline-wrap">
                  <svg className="sparkline" viewBox="0 0 200 60" preserveAspectRatio="none">
                    {/* Target Expectation Center Line */}
                    <line x1="0" y1="30" x2="200" y2="30" stroke="var(--ink-soft)" strokeDasharray="3 3" opacity="0.4" />

                    {/* Empirical History Polyline */}
                    {history.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="2"
                        points={history
                          .slice(-30)
                          .map((val, idx, arr) => {
                            const x = (idx / (arr.length - 1)) * 200
                            const expected = world.interactiveTargets[0]?.expectedValue ?? 1
                            const deviation = (val - expected) * 20
                            const y = Math.max(5, Math.min(55, 30 - deviation))
                            return `${x},${y}`
                          })
                          .join(" ")}
                      />
                    )}
                  </svg>
                </div>

                <div className="convergence-footer">
                  <button
                    type="button"
                    className="btn-quick-sim"
                    onClick={() => onFastSimulate(25)}
                    title="Simulate 25 trials instantly"
                  >
                    ⚡ Fast Run +25 Trials
                  </button>
                </div>
              </>
            ) : (
              <div className="card-collapsed-row" onClick={() => setIsTrackerCollapsed(false)}>
                <span className="card-collapsed-title">⚡ Convergence ({progressPercent}%)</span>
                <span className="card-collapsed-action">Expand ▾</span>
              </div>
            )}
          </div>

      {/* 4. Controls Guidance Overlay (Bottom Left) */}
      <div className="hud-controls-hint">
        <span className="key-badge">W A S D</span> Walk &nbsp;
        <span className="key-badge">Mouse</span> Look &nbsp;
        <span className="key-badge">Space</span> Jump &nbsp;
        <span className="key-badge">L-Click / E</span> Mine Block &nbsp;
        <span className="key-badge">1 - 4</span> Hotbar &nbsp;
        <span className="key-badge">[ / ]</span> Realm &nbsp;
        <span className="key-badge">Alt+1-8</span> Teleport
      </div>

      {/* 5. Voxel Hotbar (Bottom Center) */}
      <div className="hud-hotbar" role="toolbar" aria-label="Tool slots">
        {[
          { icon: "⛏", name: "Iron Pick", desc: "Mine & Probe Voxel Odds" },
          { icon: "⌕", name: "Odds Scanner", desc: "Inspect Microstate Paths" },
          { icon: "Ω", name: "Monte Carlo", desc: "Run Fast 25 Samples" },
          { icon: "§", name: "Invariant Codex", desc: "Open Mathematical Proof" },
        ].map((tool, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectSlot(idx)
              if (idx === 0) onMineClick()
              if (idx === 2) onFastSimulate(25)
              if (idx === 3) openTab("codex")
            }}
            className={`hotbar-slot${activeHotbarSlot === idx ? " selected" : ""}`}
            title={`${tool.name} — ${tool.desc}`}
          >
            <span className="slot-num">{idx + 1}</span>
            <span className="slot-icon">{tool.icon}</span>
          </button>
        ))}
      </div>

      {/* 6. Navigation Buttons (Bottom Right) */}
      <div className="hud-nav-buttons">
        <button
          type="button"
          onClick={onPrevWorld}
          disabled={world.worldNumber === 1}
          className="hud-nav-btn"
        >
          ← Prev World
        </button>
        <button
          type="button"
          onClick={() => openTab("codex")}
          className={`hud-nav-btn codex${isGoalReached ? " highlight" : ""}`}
        >
          Invariant Codex {isGoalReached ? "✓" : "§"}
        </button>
        <button
          type="button"
          onClick={onNextWorld}
          disabled={world.worldNumber === allWorlds.length}
          className="hud-nav-btn next"
        >
          Next World →
        </button>
      </div>
      </>
      )}

      {/* 7. Comprehensive Modal: Invariant Codex, Discovery Journal & Keybindings Guide */}
      {isModalOpen && (
        <div className="codex-overlay" role="dialog" aria-modal="true" aria-label="Deriva ProbCraft Codex">
          <div className="codex-modal">
            {/* Modal Tab Bar Header */}
            <header className="modal-tab-bar">
              <div className="modal-tabs">
                <button
                  type="button"
                  className={`modal-tab-btn${activeModalTab === "codex" ? " active" : ""}`}
                  onClick={() => openTab("codex")}
                >
                  § Invariant Codex (World {world.worldNumber})
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn${activeModalTab === "journal" ? " active" : ""}`}
                  onClick={() => openTab("journal")}
                >
                  📜 Discovery Journal ({discoveriesFound.length}/{allDiscoveryShards.length})
                </button>
                <button
                  type="button"
                  className={`modal-tab-btn${activeModalTab === "keys" ? " active" : ""}`}
                  onClick={() => openTab("keys")}
                >
                  ⌨ Keybindings Guide
                </button>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={closeModal}
                title="Close modal [Esc]"
              >
                ✕
              </button>
            </header>

            {/* TAB 1: CODEX */}
            {activeModalTab === "codex" && (
              <div className="tab-pane codex-pane">
                <div className="codex-header">
                  <span className="codex-kicker">PROBCRAFT MATHEMATICAL DERIVATION · WORLD {world.worldNumber}</span>
                  <h2 className="codex-title">{world.title}</h2>
                  <span className="codex-theorem">{world.theorem}</span>
                </div>

                {/* Formula Block */}
                <div className="codex-formula-box">
                  <span className="formula-kicker">The Governing Invariant</span>
                  <code className="formula-code">{world.formulaKatex}</code>
                </div>

                {/* Naive Trap vs Invariant Leap */}
                <div className="codex-comparison-grid">
                  <div className="comparison-card trap">
                    <span className="card-kicker">The Naive Intuition Trap</span>
                    <strong>{world.trapTitle}</strong>
                    <p>{world.naiveTrap}</p>
                  </div>

                  <div className="comparison-card leap">
                    <span className="card-kicker">The Mathematical Invariant</span>
                    <strong>First-Principles Proof</strong>
                    <p>{world.invariantProof}</p>
                  </div>
                </div>

                {/* Socratic Interactive Challenge */}
                <section className="codex-challenge-section">
                  <span className="challenge-kicker">Prove the Invariant to Unlock World Portal</span>
                  <h3 className="challenge-prompt">{world.missionPrompt}</h3>

                  <div className="options-grid">
                    {world.options.map(opt => {
                      const isSelected = selectedAnswerId === opt.id
                      const isCorrect = opt.id === world.correctOptionId
                      let btnStateClass = ""
                      if (isAnswerSubmitted) {
                        if (isCorrect) btnStateClass = " correct"
                        else if (isSelected) btnStateClass = " wrong"
                      } else if (isSelected) {
                        btnStateClass = " selected"
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt)}
                          disabled={isAnswerSubmitted}
                          className={`option-btn${btnStateClass}`}
                        >
                          <span className="option-mark">{isCorrect && isAnswerSubmitted ? "✓" : "○"}</span>
                          <span className="option-label">{opt.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Teardown Feedback after Answer */}
                  {isAnswerSubmitted && (
                    <div className="answer-teardown-box">
                      {selectedAnswerId === world.correctOptionId ? (
                        <div className="teardown-success">
                          <strong>Invariant Conquered ✓</strong>
                          <p>{world.options.find(o => o.id === selectedAnswerId)?.explanation}</p>
                          <div className="rule-box">
                            <strong>Rule of Thumb: </strong> {world.theoryTakeaway}
                          </div>
                          {world.worldNumber < allWorlds.length && (
                            <button
                              type="button"
                              className="btn-portal-advance"
                              onClick={() => {
                                closeModal()
                                onNextWorld()
                              }}
                            >
                              Step Through Portal to World {world.worldNumber + 1} →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="teardown-failure">
                          <strong>Intuition Trap Identified</strong>
                          <p>{world.options.find(o => o.id === selectedAnswerId)?.explanation}</p>
                          <button
                            type="button"
                            className="btn-retry"
                            onClick={() => onAnswerSubmit("")}
                          >
                            Try Re-deriving Again
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* TAB 2: DISCOVERY JOURNAL */}
            {activeModalTab === "journal" && (
              <div className="tab-pane journal-pane">
                <div className="journal-header">
                  <div>
                    <span className="codex-kicker">EXPLORATION & ARCHAEOLOGY</span>
                    <h2 className="codex-title">The Discovery Codex</h2>
                    <span className="codex-theorem">
                      Ancient probability steles, shrines, and monuments scattered across the 8 realms.
                    </span>
                  </div>
                  <div className="journal-progress-summary">
                    <span className="journal-stat-label">Codex Completion</span>
                    <strong className="journal-stat-val">
                      {discoveriesFound.length} / {allDiscoveryShards.length} Shards Unsealed ({Math.round((discoveriesFound.length / Math.max(1, allDiscoveryShards.length)) * 100)}%)
                    </strong>
                    <div className="journal-progress-track">
                      <div
                        className="journal-progress-fill"
                        style={{ width: `${(discoveriesFound.length / Math.max(1, allDiscoveryShards.length)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Controls */}
                <div className="journal-filters">
                  <button
                    type="button"
                    className={`filter-pill${journalFilter === "all" ? " active" : ""}`}
                    onClick={() => setJournalFilter("all")}
                  >
                    All Shards ({allDiscoveryShards.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill${journalFilter === "current" ? " active" : ""}`}
                    onClick={() => setJournalFilter("current")}
                  >
                    Current World: W{world.worldNumber} ({allDiscoveryShards.filter(s => s.worldNumber === world.worldNumber).length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill${journalFilter === "unsealed" ? " active" : ""}`}
                    onClick={() => setJournalFilter("unsealed")}
                  >
                    Unsealed ({discoveriesFound.length})
                  </button>
                </div>

                {/* Shard Cards List */}
                <div className="journal-cards-grid">
                  {filteredShards.map(shard => {
                    const isFound = discoveriesFound.includes(shard.id)
                    const isCurrentWorld = shard.worldNumber === world.worldNumber

                    return (
                      <div
                        key={shard.id}
                        className={`journal-shard-card${isFound ? " unsealed" : " sealed"}${isCurrentWorld ? " current-realm" : ""}`}
                      >
                        <div className="shard-card-header">
                          <div className="shard-realm-tag">
                            <span className="shard-realm-badge">World {shard.worldNumber}</span>
                            <span className="shard-realm-name">{shard.worldTitle}</span>
                          </div>
                          <span className={`shard-status-pill${isFound ? " unsealed" : " sealed"}`}>
                            {isFound ? "Unsealed ✓" : "Undiscovered 🔒"}
                          </span>
                        </div>

                        <div className="shard-card-body">
                          <h4 className="shard-card-name">{shard.name}</h4>
                          <p className="shard-inscription">
                            {isFound ? shard.oddsDesc : "An ancient stele waiting to be found in the voxel terrain. Mine or probe the block to decipher its inscription."}
                          </p>

                          {isFound && (
                            <div className="shard-takeaway-box">
                              <span className="shard-takeaway-kicker">Theorem Insight</span>
                              <span className="shard-takeaway-text">{shard.worldTheorem}</span>
                            </div>
                          )}

                          <div className="shard-footer-info">
                            <span className="shard-coord">Location: ({Math.round(shard.x)}, {Math.round(shard.y)}, {Math.round(shard.z)})</span>
                            <span className="shard-ev">E[X] = {shard.expectedValue.toFixed(2)}</span>
                          </div>
                        </div>

                        {!isCurrentWorld && (
                          <div className="shard-card-actions">
                            <button
                              type="button"
                              className="btn-shard-teleport"
                              onClick={() => {
                                onTeleportSelect(shard.worldNumber)
                                closeModal()
                              }}
                            >
                              Teleport to World {shard.worldNumber} →
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: KEYBINDINGS */}
            {activeModalTab === "keys" && (
              <div className="tab-pane keys-pane">
                <div className="codex-header">
                  <span className="codex-kicker">CONTROL SCHEME & SHORTCUTS</span>
                  <h2 className="codex-title">Keyboard & Mouse Controls</h2>
                  <span className="codex-theorem">
                    Crafted for seamless navigation, rapid Monte Carlo simulation, and deep derivation.
                  </span>
                </div>

                <div className="keybindings-sections">
                  <div className="keybinding-category">
                    <h3 className="key-cat-title">Locomotion & Camera</h3>
                    <div className="key-table">
                      <div className="key-row">
                        <span className="key-badge">W A S D</span>
                        <span className="key-desc">Walk forward, left, backward, right</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">Space</span>
                        <span className="key-desc">Jump impulse (grounded only)</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">Mouse</span>
                        <span className="key-desc">Look around in full 3D when pointer locked</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">Esc</span>
                        <span className="key-desc">Free pointer lock / close open modals</span>
                      </div>
                    </div>
                  </div>

                  <div className="keybinding-category">
                    <h3 className="key-cat-title">Mining & Probing</h3>
                    <div className="key-table">
                      <div className="key-row">
                        <span className="key-badge">Left Click / E</span>
                        <span className="key-desc">Mine targeted voxel / probe microstate trial / unseal shard</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">1 - 4 (Hotbar)</span>
                        <span className="key-desc">Pick tool, Odds Scanner, Fast Monte Carlo (+25), Codex</span>
                      </div>
                    </div>
                  </div>

                  <div className="keybinding-category">
                    <h3 className="key-cat-title">Curriculum Navigation & World Portals</h3>
                    <div className="key-table">
                      <div className="key-row">
                        <span className="key-badge">Alt + 1-8 (or 5-8)</span>
                        <span className="key-desc">Instant teleport to World 1 through World 8</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">[ and ]</span>
                        <span className="key-desc">Step backward or forward one world</span>
                      </div>
                    </div>
                  </div>

                  <div className="keybinding-category">
                    <h3 className="key-cat-title">Interface & Audio</h3>
                    <div className="key-table">
                      <div className="key-row">
                        <span className="key-badge">C</span>
                        <span className="key-desc">Open Mathematical Invariant Codex & Socratic Proof</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">J</span>
                        <span className="key-desc">Open Discovery Shards Journal & Archaeology Record</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">K or ?</span>
                        <span className="key-desc">Toggle this Keybindings & Controls Guide</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">M</span>
                        <span className="key-desc">Toggle Audio Synthesizer (persistent preference)</span>
                      </div>
                      <div className="key-row">
                        <span className="key-badge">H</span>
                        <span className="key-desc">Hide / show all HUD telemetry overlays</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <footer className="codex-footer">
              <button
                type="button"
                className="btn-close-codex"
                onClick={closeModal}
              >
                Close & Return to Voxel World [ESC]
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Scoped CSS using strictly design system tokens */}
      <style jsx>{`
        .probcraft-hud {
          position: absolute;
          inset: 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: var(--sp-4);
          font-family: var(--font-ui);
          user-select: none;
          z-index: 20;
        }

        /* Center Crosshair */
        .hud-crosshair {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        }

        .crosshair-reticle {
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--dur-fast);
        }

        .crosshair-dot {
          width: 6px;
          height: 6px;
          background: var(--paper-raised);
          box-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
          border-radius: 50%;
          transition: transform var(--dur-fast), background-color var(--dur-fast);
        }

        .reticle-tick {
          position: absolute;
          width: 6px;
          height: 6px;
          border-color: rgba(255, 255, 255, 0.4);
          border-style: solid;
          opacity: 0.5;
          transition: all var(--dur-fast);
        }

        .reticle-tick.top-left {
          top: 0;
          left: 0;
          border-width: 1.5px 0 0 1.5px;
        }

        .reticle-tick.top-right {
          top: 0;
          right: 0;
          border-width: 1.5px 1.5px 0 0;
        }

        .reticle-tick.bottom-left {
          bottom: 0;
          left: 0;
          border-width: 0 0 1.5px 1.5px;
        }

        .reticle-tick.bottom-right {
          bottom: 0;
          right: 0;
          border-width: 0 1.5px 1.5px 0;
        }

        .crosshair-reticle.target-locked {
          transform: scale(1.15);
        }

        .crosshair-reticle.target-locked .crosshair-dot {
          background: var(--accent);
          transform: scale(1.3);
        }

        .crosshair-reticle.target-locked .reticle-tick {
          border-color: var(--accent);
          opacity: 1;
        }

        .crosshair-reticle.shrine-locked .crosshair-dot {
          background: var(--viz-cached);
          transform: scale(1.5);
        }

        .crosshair-reticle.shrine-locked .reticle-tick {
          border-color: var(--viz-cached);
          opacity: 1;
        }

        .crosshair-target-tooltip {
          margin-top: 14px;
          background: rgba(14, 17, 23, 0.85);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius);
          padding: 8px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          text-align: center;
        }

        .target-badge {
          font-size: 9px;
          font-family: var(--font-mono);
          text-transform: uppercase;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--paper);
          color: var(--ink-soft);
          border: 1px solid var(--line);
        }

        .target-badge.shard {
          background: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
        }

        .target-badge.shard.unsealed {
          background: var(--success-soft);
          color: var(--viz-settled);
          border-color: var(--viz-settled);
        }

        .target-badge.vault {
          background: var(--accent-soft);
          color: var(--viz-cached);
          border-color: var(--viz-cached);
        }

        .target-badge.portal {
          background: var(--paper);
          color: var(--viz-active);
          border-color: var(--viz-active);
        }

        .target-name {
          font-size: 13px;
          color: var(--accent);
          font-weight: 700;
        }

        .target-odds {
          font-size: 11px;
          color: var(--ink-soft);
        }

        .target-hint {
          font-size: 9px;
          color: var(--paper-raised);
          opacity: 0.7;
          margin-top: 4px;
          font-family: var(--font-mono);
        }

        /* Floating Restore Pill when HUD is Hidden */
        .hud-unhide-pill {
          position: absolute;
          top: var(--sp-4);
          left: var(--sp-4);
          background: rgba(14, 17, 23, 0.55);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: var(--paper-raised);
          border-radius: var(--radius);
          padding: 6px 14px;
          font-size: 11px;
          font-family: var(--font-mono);
          font-weight: 700;
          cursor: pointer;
          pointer-events: auto;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          transition: all var(--dur-fast);
          z-index: 30;
        }

        .hud-unhide-pill:hover {
          background: var(--accent);
          color: var(--paper);
          border-color: var(--accent);
        }

        /* Top Bar */
        .hud-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--sp-3);
          pointer-events: auto;
        }

        .world-badge-group {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(14, 17, 23, 0.42);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: calc(var(--radius) + 2px);
          padding: 8px 16px;
        }

        .hud-btn-teleport {
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--accent);
          border-radius: var(--radius);
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          font-family: var(--font-mono);
          transition: background var(--dur-fast);
        }

        .hud-btn-teleport:hover {
          background: var(--accent);
          color: var(--paper-raised);
        }

        .world-titles {
          display: flex;
          flex-direction: column;
        }

        .world-h1 {
          margin: 0;
          font-size: 16px;
          font-family: var(--font-narrative);
          font-weight: 800;
          color: var(--paper-raised);
        }

        .world-subtitle {
          font-size: 11px;
          color: var(--ink-soft);
        }

        .hud-stats-pill {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(14, 17, 23, 0.42);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: calc(var(--radius) + 2px);
          padding: 6px 14px;
        }

        .stat-col {
          display: flex;
          flex-direction: column;
        }

        .discovery-shard-stat {
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          padding-right: 14px;
        }

        .stat-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-soft);
        }

        .stat-val {
          font-size: 13px;
          font-family: var(--font-mono);
          color: var(--paper-raised);
        }

        .stat-val.accent {
          color: var(--accent);
        }

        .stat-val.settled {
          color: var(--viz-settled);
        }

        .hud-icon-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 14px;
        }

        .hud-hide-pill-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--ink-soft);
          border-radius: 6px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 11px;
          font-family: var(--font-mono);
          transition: all var(--dur-fast);
        }

        .hud-hide-pill-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--paper-raised);
        }

        /* Left Panel: Quests & Microstate Inspector */
        .hud-left-panel {
          position: absolute;
          top: 76px;
          left: var(--sp-4);
          width: 320px;
          max-width: calc(100vw - 32px);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          pointer-events: auto;
          z-index: 10;
          max-height: calc(100vh - 180px);
          overflow-y: auto;
        }

        .hud-quest-card,
        .hud-microstate-card {
          background: rgba(14, 17, 23, 0.42);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius);
          padding: var(--sp-3);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          gap: var(--sp-2);
        }

        .card-header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .hud-card-toggle {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--ink-soft);
          border-radius: 4px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 11px;
          line-height: 1;
          transition: all var(--dur-fast);
        }

        .hud-card-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--paper-raised);
        }

        .card-collapsed-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 6px;
          border-radius: var(--radius);
          cursor: pointer;
          background: rgba(255, 255, 255, 0.04);
          transition: background var(--dur-fast);
        }

        .card-collapsed-row:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .card-collapsed-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--paper-raised);
        }

        .card-collapsed-action {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--accent);
        }

        .quest-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--line);
          padding-bottom: 6px;
        }

        .quest-pills-row {
          display: flex;
          gap: 4px;
        }

        .quest-pill {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--ink-soft);
          font-size: 10px;
          font-family: var(--font-mono);
          padding: 2px 7px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .quest-pill.active {
          background: var(--accent);
          color: var(--paper);
          border-color: var(--accent);
          font-weight: 700;
        }

        .quest-diff-badge {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .quest-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .quest-step-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--paper-raised);
          margin: 0;
          line-height: 1.3;
        }

        .quest-step-obj {
          font-size: 11px;
          color: var(--ink-soft);
          line-height: 1.4;
          margin: 0;
        }

        .quest-experiment-status {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 4px;
        }

        .experiment-meter-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--paper-raised);
        }

        .quest-hint-box {
          background: rgba(0, 0, 0, 0.3);
          border-left: 2px solid var(--accent);
          padding: 6px 8px;
          border-radius: 0 var(--radius) var(--radius) 0;
          margin-top: 2px;
        }

        .quest-hint-kicker {
          display: block;
          font-size: 9px;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--accent);
          margin-bottom: 2px;
        }

        .quest-hint-text {
          font-size: 10px;
          color: var(--paper-raised);
          line-height: 1.35;
          margin: 0;
        }

        .quest-footer {
          display: flex;
          justify-content: space-between;
          gap: var(--sp-2);
          margin-top: 4px;
          padding-top: 6px;
          border-top: 1px solid var(--line);
        }

        .quest-nav-btn {
          flex: 1;
          background: transparent;
          border: 1px solid var(--line);
          color: var(--ink-soft);
          font-size: 11px;
          font-family: var(--font-ui);
          padding: 4px 8px;
          border-radius: var(--radius);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .quest-nav-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          color: var(--paper-raised);
        }

        .quest-nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .quest-nav-btn.next,
        .quest-nav-btn.action {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--paper);
          font-weight: 600;
        }

        .quest-nav-btn.next:hover,
        .quest-nav-btn.action:hover {
          background: var(--accent-hover);
        }

        /* Microstate Inspector Card */
        .microstate-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--line);
          padding-bottom: 4px;
        }

        .microstate-card-kicker {
          font-size: 10px;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--paper-raised);
          font-weight: 700;
        }

        .microstate-total {
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--accent);
        }

        .microstate-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .microstate-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 4px;
          border-radius: var(--radius);
          transition: background 0.2s ease;
        }

        .microstate-row.pulse {
          background: rgba(47, 143, 91, 0.18);
        }

        .microstate-top {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .micro-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .micro-label {
          color: var(--paper-raised);
          font-weight: 600;
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .micro-val {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
        }

        .micro-bar {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .micro-bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .micro-sub {
          font-size: 9px;
          color: var(--ink-soft);
          line-height: 1.25;
        }

        /* Convergence Tracker Top Right */
        .hud-convergence-card {
          position: absolute;
          top: 76px;
          right: var(--sp-4);
          width: 220px;
          background: rgba(14, 17, 23, 0.42);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: var(--radius);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: auto;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
        }

        .kicker {
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
        }

        .indicator {
          color: var(--ink-soft);
          font-family: var(--font-mono);
        }

        .progress-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.3s;
        }

        .sparkline-wrap {
          height: 48px;
          background: rgba(0, 0, 0, 0.25);
          border-radius: 4px;
          overflow: hidden;
        }

        .sparkline {
          width: 100%;
          height: 100%;
        }

        .btn-quick-sim {
          width: 100%;
          padding: 6px;
          border-radius: 6px;
          background: var(--accent-soft);
          color: var(--accent);
          border: 1px solid var(--accent);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .btn-quick-sim:hover {
          background: var(--accent);
          color: var(--paper-raised);
        }

        /* Controls Hint */
        .hud-controls-hint {
          align-self: flex-start;
          background: rgba(14, 17, 23, 0.42);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          color: var(--ink-soft);
          pointer-events: auto;
        }

        .key-badge {
          background: rgba(255, 255, 255, 0.1);
          color: var(--paper-raised);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
        }

        /* Hotbar */
        .hud-hotbar {
          position: absolute;
          bottom: var(--sp-4);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          background: rgba(14, 17, 23, 0.45);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: calc(var(--radius) + 2px);
          padding: 4px;
          pointer-events: auto;
        }

        .hotbar-slot {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          color: var(--paper-raised);
          transition: all var(--dur-fast);
        }

        .hotbar-slot.selected {
          border-color: var(--accent);
          background: var(--accent-soft);
          color: var(--accent);
          transform: translateY(-4px);
        }

        .slot-num {
          position: absolute;
          top: 3px;
          left: 5px;
          font-size: 9px;
          font-family: var(--font-mono);
          color: var(--ink-soft);
        }

        .slot-icon {
          font-size: 20px;
        }

        /* Nav Buttons Bottom Right */
        .hud-nav-buttons {
          position: absolute;
          bottom: var(--sp-4);
          right: var(--sp-4);
          display: flex;
          gap: 8px;
          pointer-events: auto;
        }

        .hud-nav-btn {
          background: rgba(14, 17, 23, 0.45);
          backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--paper-raised);
          padding: 8px 14px;
          border-radius: var(--radius);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .hud-nav-btn:hover:not(:disabled) {
          border-color: var(--accent);
          background: rgba(255, 255, 255, 0.1);
        }

        .hud-nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .hud-nav-btn.codex.highlight {
          border-color: var(--viz-settled);
          background: var(--success-soft);
          color: var(--viz-settled);
        }

        .hud-nav-btn.next {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--paper-raised);
        }

        /* Teleport Modal */
        .teleport-modal {
          position: absolute;
          top: 68px;
          left: var(--sp-4);
          background: rgba(14, 17, 23, 0.88);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: var(--radius);
          padding: 14px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 50;
          pointer-events: auto;
          max-width: 380px;
        }

        .teleport-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--accent);
        }

        .teleport-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 6px;
        }

        .teleport-cell {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          cursor: pointer;
          text-align: left;
        }

        .teleport-cell.active {
          border-color: var(--accent);
          background: var(--accent-soft);
        }

        .tele-num {
          font-size: 10px;
          font-weight: 800;
          color: var(--accent);
        }

        .tele-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }

        .tele-diff {
          font-size: 9px;
          color: var(--ink-soft);
        }

        /* Mathematical Codex Modal */
        .codex-overlay {
          position: fixed;
          inset: 0;
          background: rgba(20, 22, 26, 0.8);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--sp-4);
          z-index: 100;
          pointer-events: auto;
        }

        .codex-modal {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: calc(var(--radius) + 4px);
          padding: clamp(20px, 3vw, 32px);
          max-width: 680px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-raised);
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
        }

        .codex-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--accent);
        }

        .codex-title {
          margin: 2px 0 0;
          font-size: 22px;
          font-family: var(--font-narrative);
          font-weight: 800;
          color: var(--ink);
        }

        .codex-theorem {
          font-size: 12px;
          color: var(--ink-soft);
        }

        .codex-formula-box {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .formula-kicker {
          font-size: 10px;
          font-weight: 700;
          color: var(--ink-soft);
          text-transform: uppercase;
        }

        .formula-code {
          font-size: 14px;
          font-family: var(--font-mono);
          color: var(--accent);
          white-space: pre-wrap;
        }

        .codex-comparison-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--sp-3);
        }

        .comparison-card {
          border-radius: var(--radius);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .comparison-card.trap {
          background: var(--paper);
          border: 1px solid var(--line);
        }

        .comparison-card.leap {
          background: var(--accent-soft);
          border: 1px solid var(--accent);
        }

        .card-kicker {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--ink-soft);
        }

        .comparison-card.leap .card-kicker {
          color: var(--accent);
        }

        .comparison-card p {
          margin: 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--ink);
        }

        .codex-challenge-section {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .challenge-kicker {
          font-size: 10px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
        }

        .challenge-prompt {
          margin: 0;
          font-size: 14px;
          font-family: var(--font-narrative);
          line-height: 1.6;
          color: var(--ink);
        }

        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .option-btn {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 10px 14px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--ink);
          transition: all var(--dur-fast);
        }

        .option-btn:hover:not(:disabled) {
          border-color: var(--accent);
        }

        .option-btn.selected {
          border-color: var(--accent);
          background: var(--accent-soft);
        }

        .option-btn.correct {
          border-color: var(--viz-settled);
          background: var(--success-soft);
          color: var(--viz-settled);
          font-weight: 700;
        }

        .option-btn.wrong {
          border-color: var(--viz-pruned);
          opacity: 0.6;
        }

        .answer-teardown-box {
          margin-top: 10px;
          padding: 12px;
          border-radius: var(--radius);
          background: var(--paper-raised);
          border: 1px solid var(--line);
        }

        .teardown-success {
          display: flex;
          flex-direction: column;
          gap: 8px;
          color: var(--viz-settled);
        }

        .teardown-success p {
          margin: 0;
          font-size: 13px;
          color: var(--ink);
        }

        .rule-box {
          background: var(--accent-soft);
          border: 1px solid var(--accent);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          color: var(--ink);
        }

        .btn-portal-advance {
          background: var(--accent);
          color: var(--paper-raised);
          border: none;
          padding: 10px 16px;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          margin-top: 6px;
          transition: opacity var(--dur-fast);
        }

        .btn-portal-advance:hover {
          opacity: 0.9;
        }

        .btn-retry {
          background: var(--paper);
          border: 1px solid var(--line);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          margin-top: 6px;
        }

        .codex-footer {
          display: flex;
          justify-content: flex-end;
        }

        .btn-close-codex {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          color: var(--ink-soft);
        }

        .btn-close-codex:hover {
          color: var(--ink);
          border-color: var(--accent);
        }

        /* Modal Tabs */
        .modal-tab-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--line);
          padding-bottom: var(--sp-2);
          gap: var(--sp-2);
          flex-wrap: wrap;
        }

        .modal-tabs {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
          flex-wrap: wrap;
        }

        .modal-tab-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius);
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 700;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .modal-tab-btn:hover {
          color: var(--ink);
          background: var(--paper);
        }

        .modal-tab-btn.active {
          color: var(--accent);
          background: var(--paper);
          border-color: var(--line);
        }

        .modal-close-icon-btn {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .modal-close-icon-btn:hover {
          color: var(--ink);
          border-color: var(--accent);
        }

        .tab-pane {
          display: flex;
          flex-direction: column;
          gap: var(--sp-4);
        }

        /* Journal Tab */
        .journal-header {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .journal-progress-summary {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .journal-stat-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--ink-soft);
          text-transform: uppercase;
        }

        .journal-stat-val {
          font-size: 13px;
          color: var(--accent);
        }

        .journal-progress-track {
          width: 100%;
          height: 6px;
          background: var(--paper-raised);
          border-radius: 3px;
          overflow: hidden;
        }

        .journal-progress-fill {
          height: 100%;
          background: var(--accent);
          transition: width var(--dur-normal);
        }

        .journal-filters {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .filter-pill {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          color: var(--ink-soft);
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .filter-pill:hover {
          color: var(--ink);
          border-color: var(--accent);
        }

        .filter-pill.active {
          background: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
        }

        .journal-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          max-height: 440px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .journal-shard-card {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color var(--dur-fast);
        }

        .journal-shard-card.unsealed {
          border-color: var(--accent);
          background: var(--paper-raised);
        }

        .journal-shard-card.current-realm {
          box-shadow: 0 0 0 1px var(--accent);
        }

        .shard-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .shard-realm-tag {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shard-realm-badge {
          font-size: 9px;
          font-family: var(--font-mono);
          font-weight: 700;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .shard-realm-name {
          font-size: 11px;
          color: var(--ink-soft);
        }

        .shard-status-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .shard-status-pill.unsealed {
          background: var(--success-soft);
          color: var(--viz-settled);
        }

        .shard-status-pill.sealed {
          background: var(--paper);
          border: 1px solid var(--line);
          color: var(--ink-soft);
        }

        .shard-card-name {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--ink);
        }

        .shard-inscription {
          margin: 4px 0 0;
          font-size: 12px;
          line-height: 1.5;
          color: var(--ink-soft);
        }

        .shard-takeaway-box {
          margin-top: 6px;
          background: var(--accent-soft);
          border-radius: 4px;
          padding: 6px 10px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .shard-takeaway-kicker {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--accent);
        }

        .shard-takeaway-text {
          font-size: 11px;
          color: var(--ink);
        }

        .shard-footer-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 10px;
          font-family: var(--font-mono);
          color: var(--ink-soft);
        }

        .shard-card-actions {
          margin-top: 4px;
        }

        .btn-shard-teleport {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: var(--accent);
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .btn-shard-teleport:hover {
          background: var(--accent);
          color: var(--paper);
          border-color: var(--accent);
        }

        /* Keybindings Tab */
        .keybindings-sections {
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
        }

        .keybinding-category {
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .key-cat-title {
          margin: 0;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: var(--accent);
          letter-spacing: 0.04em;
        }

        .key-table {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .key-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .key-badge {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--ink);
          min-width: 70px;
          text-align: center;
        }

        .key-desc {
          font-size: 12px;
          color: var(--ink-soft);
        }

        /* Top Bar Tabs & Action Buttons */
        .hud-tab-trigger-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius);
          padding: 4px 8px;
          font-size: 11px;
          color: var(--paper-raised);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all var(--dur-fast);
        }

        .hud-tab-trigger-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .hud-tab-trigger-btn.active-shards {
          color: var(--accent);
        }

        .hud-action-pill-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: var(--radius);
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 700;
          color: var(--paper-raised);
          cursor: pointer;
          transition: all var(--dur-fast);
        }

        .hud-action-pill-btn:hover {
          background: var(--accent);
          border-color: var(--accent);
          color: var(--paper);
        }

        @media (max-width: 768px) {
          .hud-convergence-card {
            display: none;
          }
          .codex-comparison-grid {
            grid-template-columns: 1fr;
          }
          .world-subtitle {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
