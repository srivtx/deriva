"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { PROBCRAFT_WORLDS, type ProbWorld, type VoxelCoord } from "@/data/probcraft-worlds"
import { ProbCraftEngine } from "@/components/probcraft/probcraft-engine"
import { ProbCraftHUD } from "@/components/probcraft/probcraft-hud"
import { probAudio, loadSoundPreference } from "@/components/probcraft/probcraft-audio"

const STORAGE_KEY = "deriva-probcraft-v1"
const SHARDS_STORAGE_KEY = "deriva-probcraft-shards"

// Strictly adhere to Deriva Design Tokens (docs/09 §4)
const C_ACCENT = "#2F8F5B"  // var(--accent)
const C_SETTLED = "#2F8F5B" // var(--viz-settled)
const C_ACTIVE = "#2E5AAC"  // var(--viz-active)
const C_CACHED = "#B07C24"  // var(--viz-cached)
const C_PRUNED = "#C34A3D"  // var(--viz-pruned)
const C_MUTED = "#9AA3AD"   // var(--viz-untouched)

export default function ProbCraftPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<ProbCraftEngine | null>(null)

  const [currentWorldIndex, setCurrentWorldIndex] = useState(0)
  const [trialsCount, setTrialsCount] = useState(0)
  const [empiricalMean, setEmpiricalMean] = useState(0)
  const [history, setHistory] = useState<number[]>([])
  const [currentTarget, setCurrentTarget] = useState<{ id: string; name: string; oddsDesc: string; expectedValue: number } | null>(null)
  const [activeSlot, setActiveSlot] = useState(0)
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [isPortraitNoticeDismissed, setIsPortraitNoticeDismissed] = useState(false)
  const [isPointerLocked, setIsPointerLocked] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [microstateCounts, setMicrostateCounts] = useState<Record<string, number>>({})
  const [lastMicrostateId, setLastMicrostateId] = useState<string | null>(null)
  const [isHudHidden, setIsHudHidden] = useState(false)
  const [discoveriesFound, setDiscoveriesFound] = useState<string[]>([])
  const [showCodex, setShowCodex] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [showKeybindings, setShowKeybindings] = useState(false)

  const handleToggleHud = useCallback(() => {
    setIsHudHidden(prev => !prev)
  }, [])

  const handleBlockInteractionRef = useRef<(coord: VoxelCoord) => void>(() => {})
  const toggleSoundRef = useRef<() => void>(() => {})
  const handleFastSimulateRef = useRef<(rounds?: number) => void>(() => {})

  const currentWorld: ProbWorld = PROBCRAFT_WORLDS[currentWorldIndex] || PROBCRAFT_WORLDS[0]

  // Switch world when index changes
  const switchWorld = useCallback((index: number) => {
    if (index < 0 || index >= PROBCRAFT_WORLDS.length) return
    setCurrentWorldIndex(index)
    setTrialsCount(0)
    setEmpiricalMean(0)
    setHistory([])
    setSelectedAnswerId(null)
    setIsAnswerSubmitted(false)
    setMicrostateCounts({})
    setLastMicrostateId(null)
    setShowCodex(false)

    if (engineRef.current) {
      engineRef.current.loadWorld(PROBCRAFT_WORLDS[index])
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ worldIndex: index }))
    } catch {}
  }, [])

  const toggleSound = useCallback(() => {
    setIsSoundEnabled(prev => {
      const next = !prev
      probAudio.setEnabled(next)
      if (next) {
        probAudio.playDing(true)
        engineRef.current?.spawnFloatingNotice("🔊 Audio: ON", [currentWorld.playerSpawn[0], currentWorld.playerSpawn[1] + 1.2, currentWorld.playerSpawn[2]], C_SETTLED)
      } else {
        engineRef.current?.spawnFloatingNotice("🔇 Audio: MUTED", [currentWorld.playerSpawn[0], currentWorld.playerSpawn[1] + 1.2, currentWorld.playerSpawn[2]], C_MUTED)
      }
      return next
    })
  }, [currentWorld.playerSpawn])
  toggleSoundRef.current = toggleSound

  // Initialize Engine
  useEffect(() => {
    if (!containerRef.current) return

    const engine = new ProbCraftEngine(containerRef.current, currentWorld, {
      onTargetChange: target => {
        setCurrentTarget(target)
      },
      onBlockMine: coord => {
        handleBlockInteractionRef.current(coord)
      },
      onToggleHud: () => {
        handleToggleHud()
      },
      onToggleKeybindings: () => {
        setShowKeybindings(prev => !prev)
      },
      onToggleJournal: () => {
        setShowJournal(prev => !prev)
      },
      onToggleCodex: () => {
        setShowCodex(prev => !prev)
      },
      onToggleSound: () => {
        toggleSoundRef.current()
      },
      onTeleportWorld: (worldNum: number) => {
        switchWorld(worldNum - 1)
      },
      onSelectHotbarSlot: (slot: number) => {
        setActiveSlot(slot)
        if (slot === 0) {
          engineRef.current?.interactCurrentTarget()
        } else if (slot === 1) {
          probAudio.playDing()
          engineRef.current?.spawnFloatingNotice("⌕ Odds Scanner Equipped", [currentWorld.playerSpawn[0], currentWorld.playerSpawn[1] + 1.2, currentWorld.playerSpawn[2]], C_ACTIVE)
        } else if (slot === 2) {
          handleFastSimulateRef.current(25)
        } else if (slot === 3) {
          setShowCodex(true)
        }
      },
    })
    engineRef.current = engine

    const onLockChange = () => {
      const locked = document.pointerLockElement === containerRef.current?.querySelector("canvas")
      setIsPointerLocked(locked)
      if (locked) setHasStarted(true)
    }
    document.addEventListener("pointerlockchange", onLockChange)

    return () => {
      document.removeEventListener("pointerlockchange", onLockChange)
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  // Load Saved Progress & Sound Preference
  useEffect(() => {
    setIsSoundEnabled(loadSoundPreference())
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.worldIndex === "number" && parsed.worldIndex >= 0 && parsed.worldIndex < PROBCRAFT_WORLDS.length) {
          setCurrentWorldIndex(parsed.worldIndex)
          engineRef.current?.loadWorld(PROBCRAFT_WORLDS[parsed.worldIndex])
        }
      }
      const savedShards = localStorage.getItem(SHARDS_STORAGE_KEY)
      if (savedShards) {
        const parsedShards = JSON.parse(savedShards)
        if (Array.isArray(parsedShards)) {
          setDiscoveriesFound(parsedShards)
        }
      }
    } catch {}
  }, [])

  // Handle interacting / mining with targeted voxel block
  const handleBlockInteraction = (coord: VoxelCoord) => {
    // Check if targeted voxel is an exploration discovery shrine
    const shrineTarget = currentWorld.interactiveTargets.find(
      t => Math.round(t.x) === Math.round(coord.x) && Math.round(t.y) === Math.round(coord.y) && Math.round(t.z) === Math.round(coord.z) &&
        t.id.startsWith("shrine-")
    )

    if (shrineTarget) {
      if (!discoveriesFound.includes(shrineTarget.id)) {
        setDiscoveriesFound(prev => {
          if (prev.includes(shrineTarget.id)) return prev
          const next = [...prev, shrineTarget.id]
          try { localStorage.setItem(SHARDS_STORAGE_KEY, JSON.stringify(next)) } catch {}
          return next
        })
        probAudio.playFanfare()
        engineRef.current?.spawnFloatingNotice(`📜 Shard Unsealed: ${shrineTarget.name}`, [coord.x, coord.y + 0.9, coord.z], C_SETTLED)
      } else {
        probAudio.playDing()
        engineRef.current?.spawnFloatingNotice(`📜 Inscription: ${shrineTarget.name}`, [coord.x, coord.y + 0.9, coord.z], C_ACTIVE)
      }
      return
    }

    const worldNum = currentWorld.worldNumber

    let value = 0
    let pathId = ""
    let noticeText = ""
    let noticeColor = C_CACHED

    if (worldNum === 1) {
      // World 1: Bertrand's Box
      if (coord.x === -3) {
        // Vault A (Gold + Gold): 50% G1, 50% G2
        pathId = Math.random() < 0.5 ? "path-g1" : "path-g2"
        value = 1
        noticeText = `+1 Gold! [${pathId === "path-g1" ? "Path G1" : "Path G2"}: Vault A]`
        noticeColor = C_CACHED
        probAudio.playDing(true)
      } else if (coord.x === 3) {
        // Vault C (Gold + Coal): Gold path G3, but other is Coal
        pathId = "path-g3"
        value = 0
        noticeText = "+1 Gold! [Path G3: Vault C (Other is Coal)]"
        noticeColor = C_ACTIVE
        probAudio.playDing()
      } else {
        // Vault B (Coal + Coal): Ruled out by observing gold
        pathId = "path-g3"
        value = 0
        noticeText = "0 Coal [Vault B Ruled Out]"
        noticeColor = C_MUTED
        probAudio.playMine()
      }
    } else if (worldNum === 2) {
      // World 2: Vein of Large Numbers
      if (coord.x === -3) {
        pathId = "path-iron"
        value = 1.0
        noticeText = "+1 Gold (Iron EV = 1.0)"
        noticeColor = C_CACHED
        probAudio.playDing()
      } else if (coord.x === 0 || coord.type === "diamond_ore") {
        pathId = "path-diamond"
        const jackpot = Math.random() < 0.1
        value = jackpot ? 14 : 0
        noticeText = jackpot ? "+14 Diamond Jackpot! (EV = 1.4)" : "0 Diamond (Variance)"
        noticeColor = jackpot ? C_ACTIVE : C_MUTED
        if (jackpot) probAudio.playDing(true)
        else probAudio.playMine()
      } else {
        pathId = "path-cursed"
        const jackpot = Math.random() < 0.01
        value = jackpot ? 80 : 0
        noticeText = jackpot ? "+80 Nether Gold Jackpot!" : "0 Gold (99% Miss Rate)"
        noticeColor = jackpot ? C_PRUNED : C_MUTED
        if (jackpot) probAudio.playDing(true)
        else probAudio.playMine()
      }
    } else if (worldNum === 3) {
      // World 3: Monty Hall
      if (coord.x === 0) {
        // Switching to Portal 2 (Wins with 2/3 probability)
        pathId = "path-switch"
        const win = Math.random() < 0.667
        value = win ? 1 : 0
        noticeText = win ? "Citadel Diamond! (Switch Won 2/3)" : "Sheep Void! (Switch Lost 1/3)"
        noticeColor = win ? C_ACTIVE : C_PRUNED
        if (win) probAudio.playDing(true)
        else probAudio.playMine()
      } else if (coord.x === -4) {
        // Staying at Portal 1 (Wins with 1/3 probability)
        pathId = "path-stay"
        const win = Math.random() < 0.333
        value = win ? 1 : 0
        noticeText = win ? "Citadel Diamond! (Stay Won 1/3)" : "Sheep Void! (Stay Lost 2/3)"
        noticeColor = win ? C_ACTIVE : C_MUTED
        if (win) probAudio.playDing(true)
        else probAudio.playMine()
      } else {
        // Host sheep portal
        pathId = "path-goat"
        value = 0
        noticeText = "Host Revealed Sheep (0% Win)"
        noticeColor = C_PRUNED
        probAudio.playMine()
      }
    } else if (worldNum === 4) {
      // World 4: Drunkard's Walk
      const isPos = Math.random() < 0.5
      pathId = isPos ? "path-step-pos" : "path-step-neg"
      value = 1.0 // 1D recurrence
      noticeText = isPos ? "+1 Step Forward" : "-1 Step Backward"
      noticeColor = isPos ? C_SETTLED : C_PRUNED
      probAudio.playStep()
    } else if (worldNum === 5) {
      // World 5: Martingale
      const isRuin = Math.random() < 1 / 64
      pathId = isRuin ? "path-loss-catastrophic" : "path-win-small"
      value = isRuin ? -63 : 1
      noticeText = isRuin ? "RUIN: -63 Gold Wipeout!" : "+1 Gold Profit"
      noticeColor = isRuin ? C_PRUNED : C_SETTLED
      if (isRuin) probAudio.playTrapBuzzer()
      else probAudio.playDing()
    } else if (worldNum === 6) {
      // World 6: Markov Chain
      const r = Math.random()
      if (r < 0.318) {
        pathId = "path-forest"
        noticeText = "Transitioned -> Forest (31.8%)"
        noticeColor = C_SETTLED
      } else if (r < 0.591) {
        pathId = "path-desert"
        noticeText = "Transitioned -> Desert (27.3%)"
        noticeColor = C_CACHED
      } else if (r < 0.841) {
        pathId = "path-nether"
        noticeText = "Transitioned -> Nether (25.0%)"
        noticeColor = C_PRUNED
      } else {
        pathId = "path-tundra"
        noticeText = "Transitioned -> Tundra (15.9%)"
        noticeColor = C_ACTIVE
      }
      value = 1
      probAudio.playPortal()
    } else if (worldNum === 7) {
      // World 7: Poisson Spawner
      const u = Math.random()
      const dt = -Math.log(1 - u) * 30
      pathId = dt < 15 ? "path-short-wait" : dt <= 45 ? "path-avg-wait" : "path-long-wait"
      value = dt
      noticeText = `Arrival: Δt = ${dt.toFixed(1)}s (λ = 2/min)`
      noticeColor = C_CACHED
      probAudio.playDing()
    } else {
      // World 8: Shannon Entropy
      const queryIdx = 1 + (trialsCount % 4)
      pathId = `path-query-${queryIdx}`
      value = 1
      noticeText = `Query ${queryIdx}/4: 1 Bit Extracted!`
      noticeColor = queryIdx === 4 ? C_SETTLED : C_ACTIVE
      probAudio.playDing(true)
    }

    if (noticeText) {
      engineRef.current?.spawnFloatingNotice(noticeText, [coord.x, coord.y + 0.8, coord.z], noticeColor)
    }

    if (pathId) {
      setMicrostateCounts(prev => ({
        ...prev,
        [pathId]: (prev[pathId] || 0) + 1,
      }))
      setLastMicrostateId(pathId)
    }

    const nextCount = trialsCount + 1
    const nextHist = [...history, value]
    const sum = nextHist.reduce((a, b) => a + b, 0)
    setTrialsCount(nextCount)
    setHistory(nextHist)
    setEmpiricalMean(sum / nextCount)
  }
  handleBlockInteractionRef.current = handleBlockInteraction

  // Fast Monte Carlo Wand: Simulates N rounds instantly with microstate distribution
  const handleFastSimulate = (rounds = 25) => {
    probAudio.playFanfare()
    const worldNum = currentWorld.worldNumber
    const newValues: number[] = []
    const newCounts: Record<string, number> = { ...microstateCounts }

    for (let i = 0; i < rounds; i++) {
      let val = 0
      let path = ""

      if (worldNum === 1) {
        val = Math.random() < 0.667 ? 1 : 0
        const r = Math.random()
        path = r < 0.333 ? "path-g1" : r < 0.667 ? "path-g2" : "path-g3"
      } else if (worldNum === 2) {
        const jackpot = Math.random() < 0.1
        val = jackpot ? 14 : 0
        path = "path-diamond"
      } else if (worldNum === 3) {
        val = Math.random() < 0.667 ? 1 : 0
        path = val === 1 ? "path-switch" : "path-stay"
      } else if (worldNum === 4) {
        val = 1.0 // 1D recurrence
        path = Math.random() < 0.5 ? "path-step-pos" : "path-step-neg"
      } else if (worldNum === 5) {
        const ruin = Math.random() < 1 / 64
        val = ruin ? -63 : 1
        path = ruin ? "path-loss-catastrophic" : "path-win-small"
      } else if (worldNum === 6) {
        val = 1
        const r = Math.random()
        path = r < 0.318 ? "path-forest" : r < 0.591 ? "path-desert" : r < 0.841 ? "path-nether" : "path-tundra"
      } else if (worldNum === 7) {
        val = -Math.log(1 - Math.random()) * 30
        path = val < 15 ? "path-short-wait" : val <= 45 ? "path-avg-wait" : "path-long-wait"
      } else {
        val = 1
        path = `path-query-${1 + (i % 4)}`
      }

      newValues.push(val)
      if (path) {
        newCounts[path] = (newCounts[path] || 0) + 1
      }
    }

    setMicrostateCounts(newCounts)
    const nextCount = trialsCount + rounds
    const nextHist = [...history, ...newValues]
    const sum = nextHist.reduce((a, b) => a + b, 0)
    setTrialsCount(nextCount)
    setHistory(nextHist)
    setEmpiricalMean(sum / nextCount)
  }
  handleFastSimulateRef.current = handleFastSimulate

  return (
    <main className="probcraft-container" aria-label="ProbCraft 3D Voxel Probability Game">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="voxel-canvas-host"
        onClick={() => {
          if (hasStarted && !isPointerLocked) {
            const canvas = containerRef.current?.querySelector("canvas")
            canvas?.requestPointerLock()
          }
        }}
      />

      {/* Floating HUD & Socratic Invariant Slate */}
      <ProbCraftHUD
        world={currentWorld}
        trialsCount={trialsCount}
        empiricalMean={empiricalMean}
        history={history}
        currentTarget={currentTarget}
        activeHotbarSlot={activeSlot}
        onSelectSlot={setActiveSlot}
        onMineClick={() => engineRef.current?.interactCurrentTarget()}
        onFastSimulate={handleFastSimulate}
        onAnswerSubmit={optionId => {
          setSelectedAnswerId(optionId)
          setIsAnswerSubmitted(true)
        }}
        selectedAnswerId={selectedAnswerId}
        isAnswerSubmitted={isAnswerSubmitted}
        onNextWorld={() => switchWorld(currentWorldIndex + 1)}
        onPrevWorld={() => switchWorld(currentWorldIndex - 1)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={toggleSound}
        onTeleportSelect={worldNum => switchWorld(worldNum - 1)}
        allWorlds={PROBCRAFT_WORLDS}
        microstateCounts={microstateCounts}
        lastMicrostateId={lastMicrostateId}
        isHudHidden={isHudHidden}
        onToggleHud={handleToggleHud}
        discoveriesFound={discoveriesFound}
        showCodex={showCodex}
        onToggleCodex={setShowCodex}
        showJournal={showJournal}
        onToggleJournal={setShowJournal}
        showKeybindings={showKeybindings}
        onToggleKeybindings={setShowKeybindings}
      />

      {/* Mobile Landscape Virtual Touch D-Pad */}
      <div className="mobile-touch-dpad" aria-hidden="true">
        <button
          type="button"
          className="dpad-btn up"
          onTouchStart={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ forward: true }) }}
          onTouchEnd={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ forward: false }) }}
        >▲</button>
        <div className="dpad-row">
          <button
            type="button"
            className="dpad-btn left"
            onTouchStart={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ left: true }) }}
            onTouchEnd={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ left: false }) }}
          >◀</button>
          <button
            type="button"
            className="dpad-btn jump"
            onTouchStart={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ jump: true }) }}
          >⤒</button>
          <button
            type="button"
            className="dpad-btn right"
            onTouchStart={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ right: true }) }}
            onTouchEnd={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ right: false }) }}
          >▶</button>
        </div>
        <button
          type="button"
          className="dpad-btn down"
          onTouchStart={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ backward: true }) }}
          onTouchEnd={e => { e.preventDefault(); engineRef.current?.setVirtualControls({ backward: false }) }}
        >▼</button>
      </div>

      {/* Mobile Landscape Virtual Touch Action Buttons */}
      <div className="mobile-touch-actions" aria-hidden="true">
        <button
          type="button"
          className="action-touch-btn mine"
          onTouchStart={e => {
            e.preventDefault()
            engineRef.current?.interactCurrentTarget()
          }}
          title="Mine or Probe Voxel"
        >
          ⛏ MINE
        </button>
        <button
          type="button"
          className="action-touch-btn codex"
          onClick={() => setShowCodex(true)}
          title="Open Invariant Codex"
        >
          § CODEX
        </button>
        <button
          type="button"
          className="action-touch-btn journal"
          onClick={() => setShowJournal(true)}
          title="Open Discovery Journal"
        >
          📜 SHARDS
        </button>
      </div>

      {/* Initial Click-to-Play Overlay (Only before first interaction) */}
      {!hasStarted && (
        <div
          className="pointer-lock-prompt"
          onClick={() => {
            setHasStarted(true)
            const canvas = containerRef.current?.querySelector("canvas")
            canvas?.requestPointerLock()
          }}
        >
          <div className="prompt-card">
            <span className="prompt-glyph">⛏</span>
            <h2>Enter ProbCraft 3D</h2>
            <p>Look with mouse · Walk with [W][A][S][D] · Space to jump · Mine with Left-Click</p>
            <span className="prompt-btn">Click to Start Exploring</span>
          </div>
        </div>
      )}

      {/* Subtle Re-Lock Reminder Pill (Non-blocking, clicks pass through) */}
      {hasStarted && !isPointerLocked && (
        <div className="re-lock-pill" aria-hidden="true">
          <span>Click 3D world to capture mouse · [Esc] to free</span>
        </div>
      )}

      {/* Mobile Portrait Notice Banner */}
      {!isPortraitNoticeDismissed && (
        <div className="mobile-orientation-banner">
          <div className="banner-content">
            <span className="banner-icon">📱 ⇄ 🖥</span>
            <div>
              <strong>Desktop View Recommended</strong>
              <p>For authentic 3D Minecraft controls, play on desktop or rotate your phone to Landscape.</p>
            </div>
            <button
              type="button"
              className="btn-dismiss-banner"
              onClick={() => setIsPortraitNoticeDismissed(true)}
            >
              Continue in 3D ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Left Return to Deriva Home Link */}
      <Link href="/games" className="btn-back-home" title="Return to Deriva Games">
        ← Deriva Games
      </Link>

      <style jsx>{`
        .probcraft-container {
          position: relative;
          width: 100vw;
          height: calc(100vh - 52px);
          overflow: hidden;
          background: var(--paper);
          color: var(--ink);
          font-family: var(--font-ui);
        }

        .voxel-canvas-host {
          width: 100%;
          height: 100%;
          display: block;
          cursor: crosshair;
        }

        .btn-back-home {
          position: absolute;
          top: 16px;
          left: 16px;
          background: rgba(20, 22, 26, 0.85);
          backdrop-filter: blur(6px);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--paper-raised);
          text-decoration: none;
          z-index: 20;
          transition: border-color var(--dur-fast);
        }

        .btn-back-home:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .pointer-lock-prompt {
          position: absolute;
          inset: 0;
          background: rgba(20, 22, 26, 0.55);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 15;
          cursor: pointer;
        }

        .prompt-card {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: calc(var(--radius) + 4px);
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          box-shadow: var(--shadow-raised);
          text-align: center;
          max-width: 440px;
        }

        .prompt-glyph {
          font-size: 36px;
          color: var(--accent);
        }

        .prompt-card h2 {
          margin: 0;
          font-size: 20px;
          font-family: var(--font-narrative);
          font-weight: 800;
          color: var(--ink);
        }

        .prompt-card p {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--ink-soft);
        }

        .prompt-btn {
          margin-top: 6px;
          background: var(--accent);
          color: var(--paper-raised);
          padding: 8px 18px;
          border-radius: var(--radius);
          font-size: 12px;
          font-weight: 800;
        }

        .mobile-orientation-banner {
          position: absolute;
          top: 60px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 520px;
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 10px 14px;
          box-shadow: var(--shadow-raised);
          z-index: 25;
          display: none;
        }

        .banner-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .banner-icon {
          font-size: 24px;
        }

        .banner-content strong {
          font-size: 12px;
          color: var(--ink);
          display: block;
        }

        .banner-content p {
          margin: 0;
          font-size: 11px;
          color: var(--ink-soft);
        }

        .btn-dismiss-banner {
          margin-left: auto;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 10px;
          cursor: pointer;
        }

        .re-lock-pill {
          position: absolute;
          top: 72px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(20, 22, 26, 0.82);
          backdrop-filter: blur(4px);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 6px 14px;
          font-size: 11px;
          color: var(--ink-soft);
          pointer-events: none;
          z-index: 12;
        }

        .mobile-touch-dpad {
          position: absolute;
          bottom: 24px;
          left: 20px;
          display: none;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          z-index: 22;
          user-select: none;
        }

        .dpad-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .dpad-btn {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          background: rgba(20, 22, 26, 0.75);
          backdrop-filter: blur(6px);
          border: 1px solid var(--line);
          color: var(--paper-raised);
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          touch-action: none;
        }

        .dpad-btn.jump {
          background: var(--accent);
          color: var(--paper);
          font-size: 18px;
          font-weight: 800;
        }

        .mobile-touch-actions {
          position: absolute;
          bottom: 24px;
          right: 20px;
          display: none;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          z-index: 22;
          user-select: none;
        }

        .action-touch-btn {
          height: 40px;
          padding: 0 14px;
          border-radius: var(--radius);
          background: rgba(20, 22, 26, 0.75);
          backdrop-filter: blur(6px);
          border: 1px solid var(--line);
          color: var(--paper-raised);
          font-size: 11px;
          font-family: var(--font-mono);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          touch-action: none;
        }

        .action-touch-btn.mine {
          background: var(--accent);
          color: var(--paper);
          border-color: var(--accent);
          height: 44px;
          font-size: 12px;
          font-weight: 800;
        }

        .action-touch-btn:hover {
          border-color: var(--accent);
        }

        @media (max-width: 1024px) {
          .mobile-touch-dpad {
            display: flex;
          }
          .mobile-touch-actions {
            display: flex;
          }
        }

        @media (max-width: 768px) and (orientation: portrait) {
          .mobile-orientation-banner {
            display: block;
          }
        }
      `}</style>
    </main>
  )
}
