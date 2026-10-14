"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { PROBCRAFT_WORLDS, type ProbWorld, type VoxelCoord } from "@/data/probcraft-worlds"
import { ProbCraftEngine } from "@/components/probcraft/probcraft-engine"
import { ProbCraftHUD } from "@/components/probcraft/probcraft-hud"
import { probAudio } from "@/components/probcraft/probcraft-audio"

const STORAGE_KEY = "deriva-probcraft-v1"

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

  const currentWorld: ProbWorld = PROBCRAFT_WORLDS[currentWorldIndex] || PROBCRAFT_WORLDS[0]

  // Initialize Engine
  useEffect(() => {
    if (!containerRef.current) return

    const engine = new ProbCraftEngine(containerRef.current, currentWorld, {
      onTargetChange: target => {
        setCurrentTarget(target)
      },
      onBlockMine: coord => {
        handleBlockInteraction(coord)
      },
    })
    engineRef.current = engine

    const onLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === containerRef.current?.querySelector("canvas"))
    }
    document.addEventListener("pointerlockchange", onLockChange)

    return () => {
      document.removeEventListener("pointerlockchange", onLockChange)
      engine.dispose()
      engineRef.current = null
    }
  }, [])

  // Load Saved Unlocked Progress
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (typeof parsed.worldIndex === "number" && parsed.worldIndex >= 0 && parsed.worldIndex < PROBCRAFT_WORLDS.length) {
          // Keep current index or restore
        }
      }
    } catch {}
  }, [])

  // Switch world when index changes
  const switchWorld = useCallback((index: number) => {
    if (index < 0 || index >= PROBCRAFT_WORLDS.length) return
    setCurrentWorldIndex(index)
    setTrialsCount(0)
    setEmpiricalMean(0)
    setHistory([])
    setSelectedAnswerId(null)
    setIsAnswerSubmitted(false)

    if (engineRef.current) {
      engineRef.current.loadWorld(PROBCRAFT_WORLDS[index])
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ worldIndex: index }))
    } catch {}
  }, [])

  // Handle interacting / mining with targeted voxel block
  const handleBlockInteraction = (coord: VoxelCoord) => {
    const worldNum = currentWorld.worldNumber

    let value = 0

    if (worldNum === 1) {
      // World 1: Bertrand's Box
      // If Vault A (double gold), returns 1 gold (other is gold)
      // If Vault C (mixed), returns 0 (other is coal)
      if (coord.x === -3) {
        value = 1 // 2/3 probability path
        probAudio.playDing(true)
      } else if (coord.x === 3) {
        value = Math.random() < 0.333 ? 1 : 0
        if (value === 1) probAudio.playDing()
        else probAudio.playMine()
      } else {
        value = 0
        probAudio.playMine()
      }
    } else if (worldNum === 2) {
      // World 2: Vein of Large Numbers
      // Simulate payout based on diamond/gold ore hit
      if (coord.type === "diamond_ore") {
        value = Math.random() < 0.1 ? 14 : 0
        if (value > 0) probAudio.playDing(true)
        else probAudio.playMine()
      } else if (coord.type === "gold_ore") {
        value = 1.0
        probAudio.playDing()
      } else {
        value = 0.5
        probAudio.playMine()
      }
    } else if (worldNum === 3) {
      // World 3: Monty Hall
      // Switching yields win with 2/3 probability
      value = Math.random() < 0.667 ? 1 : 0
      if (value === 1) probAudio.playDing(true)
      else probAudio.playMine()
    } else if (worldNum === 4) {
      // World 4: Random Walk
      // Returns 1 if returned to origin within 20 steps
      value = Math.random() < 0.85 ? 1 : 0
      probAudio.playStep()
    } else if (worldNum === 5) {
      // World 5: Martingale
      // 63/64 times wins +1, 1/64 times catastrophic ruin -63
      const isRuin = Math.random() < 1 / 64
      value = isRuin ? -63 : 1
      if (isRuin) probAudio.playTrapBuzzer()
      else probAudio.playDing()
    } else if (worldNum === 6) {
      // World 6: Markov Chain
      // Biome transition simulation
      value = 1
      probAudio.playPortal()
    } else if (worldNum === 7) {
      // World 7: Poisson Spawner
      // Exponential inter-arrival time (lambda = 2 / min = 1/30 sec)
      const u = Math.random()
      value = -Math.log(1 - u) * 30 // seconds
      probAudio.playDing()
    } else if (worldNum === 8) {
      // World 8: Shannon Entropy
      // Binary search halving takes 4 queries
      value = 1
      probAudio.playDing(true)
    }

    setTrialsCount(prev => {
      const nextCount = prev + 1
      setHistory(prevHist => {
        const nextHist = [...prevHist, value]
        const sum = nextHist.reduce((a, b) => a + b, 0)
        setEmpiricalMean(sum / nextCount)
        return nextHist
      })
      return nextCount
    })
  }

  // Fast Monte Carlo Wand: Simulates N rounds instantly
  const handleFastSimulate = (rounds = 25) => {
    probAudio.playFanfare()
    const worldNum = currentWorld.worldNumber
    const newValues: number[] = []

    for (let i = 0; i < rounds; i++) {
      let val = 0
      if (worldNum === 1) {
        val = Math.random() < 0.667 ? 1 : 0
      } else if (worldNum === 2) {
        val = Math.random() < 0.1 ? 14 : 0
      } else if (worldNum === 3) {
        val = Math.random() < 0.667 ? 1 : 0
      } else if (worldNum === 4) {
        val = 1.0 // 1D recurrence
      } else if (worldNum === 5) {
        val = Math.random() < 1 / 64 ? -63 : 1
      } else if (worldNum === 6) {
        val = 1
      } else if (worldNum === 7) {
        val = -Math.log(1 - Math.random()) * 30
      } else {
        val = 4 // Shannon bound
      }
      newValues.push(val)
    }

    setTrialsCount(prev => {
      const nextCount = prev + rounds
      setHistory(prevHist => {
        const nextHist = [...prevHist, ...newValues]
        const sum = nextHist.reduce((a, b) => a + b, 0)
        setEmpiricalMean(sum / nextCount)
        return nextHist
      })
      return nextCount
    })
  }

  const toggleSound = () => {
    const next = !isSoundEnabled
    setIsSoundEnabled(next)
    probAudio.setEnabled(next)
  }

  return (
    <main className="probcraft-container" aria-label="ProbCraft 3D Voxel Probability Game">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="voxel-canvas-host" />

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
      />

      {/* Desktop Click-to-Play Overlay (when pointer is unlocked) */}
      {!isPointerLocked && (
        <div
          className="pointer-lock-prompt"
          onClick={() => {
            const canvas = containerRef.current?.querySelector("canvas")
            canvas?.requestPointerLock()
          }}
        >
          <div className="prompt-card">
            <span className="prompt-glyph">⛏</span>
            <h2>Click to Enter ProbCraft 3D</h2>
            <p>Look with mouse · Walk with [W][A][S][D] · Space to jump · Mine with Left-Click</p>
            <span className="prompt-btn">Activate Pointer Controls</span>
          </div>
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

        @media (max-width: 768px) and (orientation: portrait) {
          .mobile-orientation-banner {
            display: block;
          }
        }
      `}</style>
    </main>
  )
}
