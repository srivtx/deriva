"use client"

import type { ChalkboardSpec } from "@/data/agora"

interface AgoraChalkboardProps {
  spec: ChalkboardSpec
  revealed: boolean
  isCorrect?: boolean
}

export function AgoraChalkboard({ spec, revealed, isCorrect }: AgoraChalkboardProps) {
  return (
    <div className="chalkboard-wrap">
      <div className="chalkboard-header">
        <div className="chalkboard-title-group">
          <span className="chalkboard-kicker">§ Technical Invariant</span>
          <h4 className="chalkboard-title">{spec.title}</h4>
        </div>
        <div className="chalkboard-metric-badge">
          <span className="metric-val">{spec.highlightMetric}</span>
          <span className="metric-lbl">{spec.metricLabel}</span>
        </div>
      </div>

      <div className="chalkboard-svg-stage">
        {spec.type === "box" && <BoxConditioningDiagram revealed={revealed} />}
        {spec.type === "bayes" && <BayesDiagram revealed={revealed} />}
        {spec.type === "martingale" && <MartingaleDiagram revealed={revealed} />}
        {spec.type === "cycles" && <CyclesDiagram revealed={revealed} />}
        {spec.type === "simd" && <SimdVectorDiagram revealed={revealed} />}
        {spec.type === "branch" && <BranchPipelineDiagram revealed={revealed} />}
        {spec.type === "cache" && <CacheCoherenceDiagram revealed={revealed} />}
        {spec.type === "ring" && <RingBufferDiagram revealed={revealed} />}
        {spec.type === "tso" && <TsoOrderingDiagram revealed={revealed} />}
        {spec.type === "clocks" && <VectorClocksDiagram revealed={revealed} />}
        {spec.type === "raft" && <RaftQuorumDiagram revealed={revealed} />}
        {spec.type === "vnodes" && <VNodesHashDiagram revealed={revealed} />}
        {spec.type === "crdt" && <CrdtLatticeDiagram revealed={revealed} />}
      </div>

      <p className="chalkboard-caption">{spec.caption}</p>

      <style jsx>{`
        .chalkboard-wrap {
          background: var(--paper-raised);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: var(--sp-4);
          display: flex;
          flex-direction: column;
          gap: var(--sp-3);
          box-shadow: var(--shadow-raised);
        }

        .chalkboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--sp-2);
          border-bottom: 1px solid var(--line);
          padding-bottom: var(--sp-2);
        }

        .chalkboard-kicker {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--accent);
          display: block;
        }

        .chalkboard-title {
          margin: 2px 0 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--ink);
        }

        .chalkboard-metric-badge {
          background: var(--accent-soft);
          border: 1px solid var(--accent);
          border-radius: 6px;
          padding: 4px 10px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .metric-val {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 800;
          color: var(--accent);
          line-height: 1;
        }

        .metric-lbl {
          font-size: 10px;
          color: var(--ink-soft);
          margin-top: 2px;
        }

        .chalkboard-svg-stage {
          width: 100%;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 8px;
          overflow: hidden;
        }

        .chalkboard-caption {
          margin: 0;
          font-size: 12px;
          color: var(--ink-soft);
          line-height: 1.5;
        }
      `}</style>
    </div>
  )
}

// 1. Bertrand's Box Paradox
function BoxConditioningDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Bertrand Box Conditioning Diagram">
      <defs>
        <marker id="box-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Box 1 (Gold / Gold) */}
      <rect x="20" y="24" width="130" height="135" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <text x="85" y="44" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">BOX 1 (G / G)</text>
      <circle cx="55" cy="80" r="18" fill="var(--viz-active)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="55" y="84" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">G₁</text>
      <circle cx="115" cy="80" r="18" fill="var(--viz-active)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="115" y="84" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">G₂</text>
      <text x="85" y="125" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="600">2 Gold Coins</text>
      <text x="85" y="145" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="700">2 Ways to pick Gold</text>

      {/* Box 2 (Gold / Silver) */}
      <rect x="175" y="24" width="130" height="135" rx="8" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="240" y="44" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">BOX 2 (G / S)</text>
      <circle cx="210" cy="80" r="18" fill="var(--viz-active)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="210" y="84" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">G₃</text>
      <circle cx="270" cy="80" r="18" fill="var(--ink-soft)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="270" y="84" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">S₁</text>
      <text x="240" y="125" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="600">1 Gold + 1 Silver</text>
      <text x="240" y="145" textAnchor="middle" fill="var(--ink-soft)" fontSize="10" fontWeight="600">1 Way to pick Gold</text>

      {/* Box 3 (Silver / Silver - Eliminated) */}
      <rect x="330" y="24" width="130" height="135" rx="8" fill="var(--paper-raised)" stroke="var(--viz-pruned)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6" />
      <text x="395" y="44" textAnchor="middle" fill="var(--viz-pruned)" fontSize="11" fontWeight="700">BOX 3 (S / S)</text>
      <circle cx="365" cy="80" r="18" fill="var(--ink-soft)" opacity="0.5" />
      <text x="365" y="84" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">S₂</text>
      <circle cx="425" cy="80" r="18" fill="var(--ink-soft)" opacity="0.5" />
      <text x="425" y="84" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">S₃</text>
      <text x="395" y="125" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">Eliminated</text>
      <text x="395" y="145" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">P(G | Box 3) = 0</text>

      {/* Bottom Summary Bar */}
      <rect x="20" y="175" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Total Gold Coins in Universe = 3 (G₁, G₂, G₃)
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        P(Other Coin is Gold) = P(G₁ or G₂) / 3 = 2/3 (66.7%) ≠ 1/2
      </text>
    </svg>
  )
}

// 2. Bayes Adverse Selection (D10 Prime condition)
function BayesDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Bayes adverse selection conditioning">
      {/* Prior Set: 10 Fair Faces */}
      <rect x="20" y="24" width="200" height="140" rx="8" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="120" y="44" textAnchor="middle" fill="var(--ink-soft)" fontSize="11" fontWeight="700">PRIOR UNIVERSE: D10</text>
      <text x="120" y="70" textAnchor="middle" fill="var(--ink)" fontSize="11">Odd Faces (50%): {"{1, 3, 5, 7, 9}"}</text>
      <text x="120" y="94" textAnchor="middle" fill="var(--ink)" fontSize="11">Even Faces (50%): {"{2, 4, 6, 8, 10}"}</text>
      <line x1="35" y1="110" x2="205" y2="110" stroke="var(--line)" strokeWidth="1" />
      <text x="120" y="130" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">Prior EV = (0.5 × +$2) - (0.5 × $1)</text>
      <text x="120" y="148" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">Prior EV = +$0.50</text>

      {/* Conditioning Arrow */}
      <path d="M 226 94 L 246 94" stroke="var(--accent)" strokeWidth="2" strokeDasharray="3 3" />

      {/* Posterior Subset: Primes */}
      <rect x="252" y="24" width="208" height="140" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <text x="356" y="44" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">CONDITION: PRIME OUTCOME</text>
      <text x="356" y="68" textAnchor="middle" fill="var(--ink)" fontSize="12" fontWeight="700">Subset: {"{ 2, 3, 5, 7 }"}</text>

      {/* Odd vs Even Circles */}
      <circle cx="310" cy="105" r="16" fill="var(--accent)" />
      <text x="310" y="109" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">3 Odd</text>

      <circle cx="400" cy="105" r="16" fill="var(--viz-active)" />
      <text x="400" y="109" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">1 Even</text>

      <text x="356" y="145" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        P(Odd | Prime) = 3/4 = 75%
      </text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Dealer declares prime: Even count collapses from 5 to 1!
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Updated EV = (3/4 × +$2) - (1/4 × $1) = $1.50 - $0.25 = +$1.25
      </text>
    </svg>
  )
}

// 3. Martingale & Penney's Game (Prefix Preemption)
function MartingaleDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Penney Game Prefix Preemption">
      <defs>
        <marker id="pen-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
        </marker>
        <marker id="pen-arr-mute" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--ink-soft)" />
        </marker>
      </defs>

      {/* Start State */}
      <circle cx="40" cy="100" r="18" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="2" />
      <text x="40" y="104" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">Start</text>

      {/* Transition to H */}
      <path d="M 58 100 L 102 100" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#pen-arr-mute)" />

      {/* Node H */}
      <circle cx="120" cy="100" r="18" fill="var(--paper-raised)" stroke="var(--viz-active)" strokeWidth="2" />
      <text x="120" y="104" textAnchor="middle" fill="var(--viz-active)" fontSize="11" fontWeight="700">H</text>

      {/* Fork to HH (Player A's prefix) */}
      <path d="M 136 90 L 194 65" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#pen-arr)" />
      <text x="156" y="70" fill="var(--accent)" fontSize="9" fontWeight="700">Toss H</text>

      {/* Node HH (Player B blocks Player A) */}
      <rect x="200" y="45" width="80" height="38" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <text x="240" y="62" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">State H-H</text>
      <text x="240" y="75" textAnchor="middle" fill="var(--ink-soft)" fontSize="8">Preemption Point</text>

      {/* Node HT */}
      <path d="M 136 110 L 194 135" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#pen-arr-mute)" />
      <text x="156" y="136" fill="var(--ink-soft)" fontSize="9">Toss T</text>
      <rect x="200" y="120" width="80" height="38" rx="6" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="240" y="137" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">State H-T</text>
      <text x="240" y="150" textAnchor="middle" fill="var(--ink-soft)" fontSize="8">Loop state</text>

      {/* Wins boxes */}
      <path d="M 280 64 L 328 64" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#pen-arr)" />
      <rect x="330" y="45" width="130" height="42" rx="6" fill="var(--accent)" />
      <text x="395" y="62" textAnchor="middle" fill="var(--paper)" fontSize="11" fontWeight="800">PLAYER B WINS (T-H-H)</text>
      <text x="395" y="77" textAnchor="middle" fill="var(--paper)" fontSize="9">Captures on 1st H-H</text>

      <path d="M 280 139 L 328 139" stroke="var(--ink-soft)" strokeWidth="1.5" markerEnd="url(#pen-arr-mute)" />
      <rect x="330" y="118" width="130" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="395" y="135" textAnchor="middle" fill="var(--ink-soft)" fontSize="10" fontWeight="700">Player A (H-H-H)</text>
      <text x="395" y="150" textAnchor="middle" fill="var(--ink-soft)" fontSize="9">Only if sequence starts H-H-H</text>

      {/* Bottom Summary */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Non-transitive prefix trapping: B plays T-H-H against A's H-H-H
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        P(B wins) = 7/8 = 87.5% · Player A only wins if first 3 flips are H-H-H (1/8)
      </text>
    </svg>
  )
}

// 4. 100 Prisoners Permutation Cycles
function CyclesDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="100 Prisoners Permutation Cycle Invariant">
      <defs>
        <marker id="cycle-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Left: Cycle decomposition */}
      <rect x="20" y="20" width="200" height="145" rx="8" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="120" y="38" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">DISJOINT CYCLE SKELETON</text>

      {/* Cycle nodes */}
      <circle cx="120" cy="90" r="42" fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="120" cy="48" r="12" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="2" />
      <text x="120" y="52" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">12</text>

      <circle cx="162" cy="90" r="12" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="2" />
      <text x="162" y="94" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">45</text>

      <circle cx="120" cy="132" r="12" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="2" />
      <text x="120" y="136" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">89</text>

      <circle cx="78" cy="90" r="12" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="2" />
      <text x="78" y="94" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">3</text>

      <path d="M 132 48 A 42 42 0 0 1 162 78" fill="none" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#cycle-arr)" />
      <path d="M 162 102 A 42 42 0 0 1 132 132" fill="none" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#cycle-arr)" />
      <path d="M 108 132 A 42 42 0 0 1 78 102" fill="none" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#cycle-arr)" />
      <path d="M 78 78 A 42 42 0 0 1 108 48" fill="none" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#cycle-arr)" />
      <text x="120" y="156" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="700">Length ≤ 50: Prisoner Solves Box</text>

      {/* Right: Harmonic tail probability */}
      <rect x="235" y="20" width="225" height="145" rx="8" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="1.5" />
      <text x="347" y="38" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">PROBABILITY OF GIANT CYCLE</text>

      <rect x="250" y="52" width="195" height="42" rx="6" fill="var(--paper)" stroke="var(--viz-pruned)" strokeWidth="1.5" />
      <text x="347" y="68" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">P(Cycle length L &gt; 50) = 1 / L</text>
      <text x="347" y="84" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">Sum over L ∈ [51, 100] ≈ ln 2 ≈ 68.8%</text>

      <rect x="250" y="104" width="195" height="48" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="347" y="122" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        SURVIVAL = 1 - ln 2 = 31.18%
      </text>
      <text x="347" y="140" textAnchor="middle" fill="var(--ink)" fontSize="9">
        Independent choices: (1/2)¹⁰⁰ ≈ 10⁻³⁰ (Total Doom)
      </text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Permutation cycles couple all 100 prisoners together
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Either all survive (len ≤ 50) or all fail (len &gt; 50) · Global correlation wins!
      </text>
    </svg>
  )
}

// 5. AoS vs SoA SIMD Vectorization
function SimdVectorDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="AoS vs SoA SIMD vectorization">
      {/* AoS Row */}
      <rect x="20" y="18" width="440" height="70" rx="8" fill="var(--paper-raised)" stroke="var(--viz-pruned)" strokeWidth="1.5" />
      <text x="30" y="36" fill="var(--viz-pruned)" fontSize="11" fontWeight="700">AoS (Array of Structs): struct {"{ float x, y, z; }"}</text>
      <text x="440" y="36" textAnchor="end" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">66% Memory Bandwidth Wasted</text>

      <g transform="translate(30, 44)">
        {[0, 1, 2, 3].map(i => (
          <g key={i} transform={`translate(${i * 102}, 0)`}>
            <rect x="0" y="0" width="30" height="30" rx="4" fill="var(--accent)" />
            <text x="15" y="19" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="700">x{i}</text>
            <rect x="32" y="0" width="30" height="30" rx="4" fill="var(--paper)" stroke="var(--line)" />
            <text x="47" y="19" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">y{i}</text>
            <rect x="64" y="0" width="30" height="30" rx="4" fill="var(--paper)" stroke="var(--line)" />
            <text x="79" y="19" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">z{i}</text>
          </g>
        ))}
      </g>

      {/* SoA Row */}
      <rect x="20" y="98" width="440" height="70" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <text x="30" y="116" fill="var(--accent)" fontSize="11" fontWeight="700">SoA (Structure of Arrays): struct {"{ float x[N], y[N], z[N]; }"}</text>
      <text x="440" y="116" textAnchor="end" fill="var(--accent)" fontSize="10" fontWeight="800">100% Contiguous SIMD Load</text>

      <g transform="translate(30, 124)">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
          <g key={i} transform={`translate(${i * 51}, 0)`}>
            <rect x="0" y="0" width="47" height="30" rx="4" fill="var(--accent)" stroke="var(--accent)" />
            <text x="23" y="19" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="700">x{i}</text>
          </g>
        ))}
      </g>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Single AVX2 Instruction: _mm256_load_ps(&x[i]) loads 8 floats in 1 cycle
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Full 256-bit SIMD registers saturated · 8× to 16× speedup over scalar loops
      </text>
    </svg>
  )
}

// 6. Branch Pipeline & Speculation
function BranchPipelineDiagram({ revealed }: { revealed: boolean }) {
  const stages = ["Fetch", "Decode", "Rename", "Dispatch", "Issue", "Execute", "Memory", "Retire"]

  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Branch predictor speculative pipeline">
      <text x="240" y="22" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">
        16-STAGE SUPERSCALAR SPECULATIVE PIPELINE
      </text>

      {/* Pipeline Stages */}
      <g transform="translate(20, 32)">
        {stages.map((st, i) => (
          <g key={i} transform={`translate(${i * 55}, 0)`}>
            <rect
              x="0"
              y="0"
              width="50"
              height="34"
              rx="6"
              fill={i < 4 ? "var(--accent-soft)" : "var(--paper-raised)"}
              stroke={i < 4 ? "var(--accent)" : "var(--line)"}
              strokeWidth="1.5"
            />
            <text x="25" y="21" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">
              {st}
            </text>
          </g>
        ))}
      </g>

      {/* Comparison blocks */}
      <rect x="20" y="78" width="215" height="85" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="127" y="98" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        SORTED DATA (T, T, T, ... F, F)
      </text>
      <text x="127" y="118" textAnchor="middle" fill="var(--ink)" fontSize="10">
        2-bit Branch Predictor: ~99% accuracy
      </text>
      <text x="127" y="136" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">
        Zero pipeline stalls · Full retirement rate
      </text>
      <text x="127" y="152" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="700">
        ~0.30 ns per element
      </text>

      <rect x="245" y="78" width="215" height="85" rx="8" fill="var(--paper-raised)" stroke="var(--viz-pruned)" strokeWidth="1.5" />
      <text x="352" y="98" textAnchor="middle" fill="var(--viz-pruned)" fontSize="11" fontWeight="800">
        RANDOM DATA (T, F, T, T, F, ...)
      </text>
      <text x="352" y="118" textAnchor="middle" fill="var(--ink)" fontSize="10">
        Branch History Table: 50% mispredicts
      </text>
      <text x="352" y="136" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10">
        Flushes entire 16-stage pipeline!
      </text>
      <text x="352" y="152" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">
        15–20 lost cycles per branch (~6× slower)
      </text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Predictability dominates raw operation count in modern superscalar CPUs
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Eliminate branches using branchless masks or presorting before tight loops
      </text>
    </svg>
  )
}

// 7. False Sharing & MESI Bus Invalidation
function CacheCoherenceDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Cache coherence false sharing diagram">
      {/* CPU Core 0 */}
      <rect x="30" y="18" width="170" height="48" rx="8" fill="var(--paper-raised)" stroke="var(--viz-active)" strokeWidth="2" />
      <text x="115" y="38" textAnchor="middle" fill="var(--viz-active)" fontSize="11" fontWeight="800">CPU Core 0</text>
      <text x="115" y="54" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">Writes to counter[0]</text>

      {/* CPU Core 1 */}
      <rect x="280" y="18" width="170" height="48" rx="8" fill="var(--paper-raised)" stroke="var(--viz-active)" strokeWidth="2" />
      <text x="365" y="38" textAnchor="middle" fill="var(--viz-active)" fontSize="11" fontWeight="800">CPU Core 1</text>
      <text x="365" y="54" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">Writes to counter[1]</text>

      {/* Bus Invalidation Arcs */}
      <path d="M 115 66 L 115 90" stroke="var(--viz-pruned)" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M 365 66 L 365 90" stroke="var(--viz-pruned)" strokeWidth="2" strokeDasharray="3 3" />
      <path d="M 115 78 L 365 78" stroke="var(--viz-pruned)" strokeWidth="2" />
      <text x="240" y="74" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">
        RFO Interconnect Storm (100–120 cycles)
      </text>

      {/* Shared 64-Byte Cache Line */}
      <rect x="20" y="94" width="440" height="72" rx="8" fill="var(--paper-raised)" stroke="var(--viz-pruned)" strokeWidth="2" strokeDasharray="4 2" />
      <text x="240" y="112" textAnchor="middle" fill="var(--viz-pruned)" fontSize="11" fontWeight="800">
        SHARED 64-BYTE L1 CACHE LINE (MESI Ping-Pong)
      </text>

      <g transform="translate(35, 122)">
        <rect x="0" y="0" width="100" height="28" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="50" y="18" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="800">counter[0] (8B)</text>

        <rect x="110" y="0" width="100" height="28" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1.5" />
        <text x="160" y="18" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="800">counter[1] (8B)</text>

        <rect x="220" y="0" width="190" height="28" rx="4" fill="var(--paper)" stroke="var(--line)" />
        <text x="315" y="18" textAnchor="middle" fill="var(--ink-soft)" fontSize="10">Remaining 48-byte unused padding</text>
      </g>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Independent logical data on same 64B cache line forces mutual invalidation
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Fix: alignas(64) pads each thread variable to its own private cache line
      </text>
    </svg>
  )
}

// 8. SPSC Ring Buffer & Cache Line Padding
function RingBufferDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="SPSC ring buffer padding diagram">
      <defs>
        <marker id="ring-arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--accent)" />
        </marker>
      </defs>

      {/* Ring buffer in center */}
      <circle cx="240" cy="85" r="50" fill="none" stroke="var(--line)" strokeWidth="16" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
        const rad = (i * 45 * Math.PI) / 180
        const x = 240 + Math.cos(rad) * 50
        const y = 85 + Math.sin(rad) * 50
        return <circle key={i} cx={x} cy={y} r="5" fill="var(--accent)" />
      })}
      <text x="240" y="89" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">64-Slot Ring</text>

      {/* Producer (Tail pointer) */}
      <rect x="20" y="40" width="130" height="75" rx="8" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="2" />
      <text x="85" y="60" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">PRODUCER</text>
      <text x="85" y="78" textAnchor="middle" fill="var(--ink)" fontSize="10">alignas(64) tail;</text>
      <text x="85" y="96" textAnchor="middle" fill="var(--ink-soft)" fontSize="9">Private Cache Line 0</text>
      <path d="M 150 78 L 180 78" stroke="var(--accent)" strokeWidth="2" markerEnd="url(#ring-arr)" />

      {/* Consumer (Head pointer) */}
      <rect x="330" y="40" width="130" height="75" rx="8" fill="var(--paper-raised)" stroke="var(--viz-active)" strokeWidth="2" />
      <text x="395" y="60" textAnchor="middle" fill="var(--viz-active)" fontSize="11" fontWeight="800">CONSUMER</text>
      <text x="395" y="78" textAnchor="middle" fill="var(--ink)" fontSize="10">alignas(64) head;</text>
      <text x="395" y="96" textAnchor="middle" fill="var(--ink-soft)" fontSize="9">Private Cache Line 1</text>
      <path d="M 330 78 L 300 78" stroke="var(--viz-active)" strokeWidth="2" />

      {/* Memory Order annotations */}
      <rect x="20" y="125" width="440" height="38" rx="6" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="1" />
      <text x="85" y="148" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="700">tail.store(release)</text>
      <text x="240" y="148" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="600">No Locks · No CAS loops</text>
      <text x="395" y="148" textAnchor="middle" fill="var(--viz-active)" fontSize="10" fontWeight="700">head.store(release)</text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Padding head and tail onto separate 64-byte lines guarantees zero false sharing
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Throughput exceeds 40,000,000 msgs/sec with sub-microsecond latency
      </text>
    </svg>
  )
}

// 9. Memory Fences & TSO
function TsoOrderingDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="TSO store buffer reordering">
      {/* Core 0 */}
      <rect x="20" y="20" width="200" height="135" rx="8" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="120" y="40" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">CPU CORE 0</text>
      <text x="120" y="60" textAnchor="middle" fill="var(--ink)" fontSize="10">X = 1; (Store buffered)</text>
      <rect x="40" y="70" width="160" height="34" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="120" y="86" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="700">FIFO Store Buffer</text>
      <text x="120" y="98" textAnchor="middle" fill="var(--ink-soft)" fontSize="8">Store delayed past load</text>
      <text x="120" y="122" textAnchor="middle" fill="var(--ink)" fontSize="10">r1 = Y; (Reads Y = 0 from cache)</text>
      <text x="120" y="142" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">Observed: r1 == 0</text>

      {/* Core 1 */}
      <rect x="260" y="20" width="200" height="135" rx="8" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="360" y="40" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">CPU CORE 1</text>
      <text x="360" y="60" textAnchor="middle" fill="var(--ink)" fontSize="10">Y = 1; (Store buffered)</text>
      <rect x="280" y="70" width="160" height="34" rx="4" fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x="360" y="86" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="700">FIFO Store Buffer</text>
      <text x="360" y="98" textAnchor="middle" fill="var(--ink-soft)" fontSize="8">Store delayed past load</text>
      <text x="360" y="122" textAnchor="middle" fill="var(--ink)" fontSize="10">r2 = X; (Reads X = 0 from cache)</text>
      <text x="360" y="142" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">Observed: r2 == 0</text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Hardware Store Buffer delays stores past subsequent loads (Store-Load reordering)
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        MFENCE / seq_cst forces store buffer drain before the load executes
      </text>
    </svg>
  )
}

// 10. Vector Clocks
function VectorClocksDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Vector clocks causal timeline">
      {/* 3 Processes */}
      <g transform="translate(20, 20)">
        {/* P1 */}
        <text x="10" y="24" fill="var(--ink)" fontSize="11" fontWeight="700">P1</text>
        <line x1="40" y1="20" x2="420" y2="20" stroke="var(--line)" strokeWidth="2" />
        <circle cx="80" cy="20" r="7" fill="var(--accent)" />
        <text x="80" y="38" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="700">[1,0,0]</text>

        <circle cx="200" cy="20" r="7" fill="var(--accent)" />
        <text x="200" y="38" textAnchor="middle" fill="var(--accent)" fontSize="9" fontWeight="700">[2,0,0]</text>

        {/* P2 */}
        <text x="10" y="74" fill="var(--ink)" fontSize="11" fontWeight="700">P2</text>
        <line x1="40" y1="70" x2="420" y2="70" stroke="var(--line)" strokeWidth="2" />
        <circle cx="140" cy="70" r="7" fill="var(--viz-active)" />
        <text x="140" y="88" textAnchor="middle" fill="var(--viz-active)" fontSize="9" fontWeight="700">[0,1,0]</text>

        <circle cx="280" cy="70" r="7" fill="var(--viz-active)" />
        <text x="280" y="88" textAnchor="middle" fill="var(--viz-active)" fontSize="9" fontWeight="700">[2,2,0]</text>

        {/* P3 */}
        <text x="10" y="124" fill="var(--ink)" fontSize="11" fontWeight="700">P3</text>
        <line x1="40" y1="120" x2="420" y2="120" stroke="var(--line)" strokeWidth="2" />
        <circle cx="360" cy="120" r="7" fill="var(--viz-pointer)" />
        <text x="360" y="138" textAnchor="middle" fill="var(--viz-pointer)" fontSize="9" fontWeight="700">[2,2,1]</text>

        {/* Message Edges */}
        <path d="M 200 20 L 280 70" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M 280 70 L 360 120" stroke="var(--viz-active)" strokeWidth="1.5" strokeDasharray="3 3" />
      </g>

      {/* Concurrent indicator */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Causal Order: [1,0,0] &lt; [2,2,0] &lt; [2,2,1] · Concurrency: [2,0,0] ∥ [0,1,0]
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        V(a) &lt; V(b) iff ∀k V(a)[k] ≤ V(b)[k] and ∃k V(a)[k] &lt; V(b)[k]
      </text>
    </svg>
  )
}

// 11. Raft Quorum Partition (Leader L)
function RaftQuorumDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Raft consensus quorum partition">
      {/* Partition A (Left: 2 Nodes) */}
      <rect x="20" y="24" width="180" height="135" rx="8" fill="var(--paper-raised)" stroke="var(--viz-pruned)" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="110" y="45" textAnchor="middle" fill="var(--viz-pruned)" fontSize="11" fontWeight="700">PARTITION A (2 NODES)</text>

      <circle cx="75" cy="85" r="18" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="2" />
      <text x="75" y="89" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">N1</text>

      <circle cx="145" cy="85" r="18" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="2" />
      <text x="145" y="89" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">N2</text>

      <rect x="35" y="118" width="150" height="26" rx="4" fill="var(--paper)" stroke="var(--viz-pruned)" />
      <text x="110" y="135" textAnchor="middle" fill="var(--viz-pruned)" fontSize="10" fontWeight="700">Votes: 2 &lt; 3 (No Quorum)</text>

      {/* Network Cut */}
      <path d="M 218 20 L 218 165" stroke="var(--viz-pruned)" strokeWidth="2" strokeDasharray="4 4" />
      <text x="218" y="172" textAnchor="middle" fill="var(--viz-pruned)" fontSize="9" fontWeight="800">NET SPLIT</text>

      {/* Partition B (Right: 3 Nodes) */}
      <rect x="238" y="24" width="222" height="135" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
      <text x="349" y="45" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">PARTITION B (3 NODES - MAJORITY)</text>

      {/* N3 is leader (Labeled [L], NOT with a star!) */}
      <circle cx="280" cy="85" r="18" fill="var(--accent)" stroke="var(--accent)" strokeWidth="2" />
      <text x="280" y="89" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">N3 [L]</text>

      <circle cx="349" cy="85" r="18" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="349" y="89" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">N4</text>

      <circle cx="418" cy="85" r="18" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="418" y="89" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="700">N5</text>

      <rect x="253" y="118" width="192" height="26" rx="4" fill="var(--accent)" />
      <text x="349" y="135" textAnchor="middle" fill="var(--paper)" fontSize="10" fontWeight="800">Votes: 3 ≥ 3 (Leader Elected)</text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Quorum Invariant: Any two majorities intersect by at least 1 node (Q₁ ∩ Q₂ ≠ ∅)
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Zero split-brain · Stale partition cannot commit entries
      </text>
    </svg>
  )
}

// 12. Consistent Hashing & Virtual Nodes
function VNodesHashDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="Consistent hashing virtual nodes">
      {/* Circle Ring */}
      <circle cx="160" cy="95" r="65" fill="none" stroke="var(--line)" strokeWidth="12" />

      {/* Virtual tokens on ring */}
      {[
        { deg: 0, s: "S1", col: "var(--accent)" },
        { deg: 45, s: "S2", col: "var(--viz-active)" },
        { deg: 90, s: "S3", col: "var(--viz-pointer)" },
        { deg: 135, s: "S1", col: "var(--accent)" },
        { deg: 180, s: "S2", col: "var(--viz-active)" },
        { deg: 225, s: "S3", col: "var(--viz-pointer)" },
        { deg: 270, s: "S1", col: "var(--accent)" },
        { deg: 315, s: "S2", col: "var(--viz-active)" },
      ].map((tk, i) => {
        const rad = (tk.deg * Math.PI) / 180
        const x = 160 + Math.cos(rad) * 65
        const y = 95 + Math.sin(rad) * 65
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="8" fill={tk.col} />
            <text x={x} y={y + 3} textAnchor="middle" fill="var(--paper)" fontSize="8" fontWeight="800">{tk.s}</text>
          </g>
        )
      })}
      <text x="160" y="99" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">Hash Ring [0, 2³²)</text>

      {/* Legend & Stats */}
      <rect x="260" y="24" width="200" height="135" rx="8" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="360" y="44" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="700">VIRTUAL NODE (VNODE) SPREAD</text>

      <circle cx="280" cy="68" r="6" fill="var(--accent)" />
      <text x="295" y="72" fill="var(--ink)" fontSize="10">Server 1 (256 VNodes)</text>

      <circle cx="280" cy="92" r="6" fill="var(--viz-active)" />
      <text x="295" y="96" fill="var(--ink)" fontSize="10">Server 2 (256 VNodes)</text>

      <circle cx="280" cy="116" r="6" fill="var(--viz-pointer)" />
      <text x="295" y="120" fill="var(--ink)" fontSize="10">Server 3 (256 VNodes)</text>

      <text x="360" y="145" textAnchor="middle" fill="var(--accent)" fontSize="10" fontWeight="800">Standard Deviation &lt; 5%</text>

      {/* Bottom Result */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Without vnodes, hash clustering creates severe hot spots (3× load imbalance)
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Vnodes evenly disperse rehashed keys when a server joins or crashes (K/N keys move)
      </text>
    </svg>
  )
}

// 13. CRDT Join-Semilattice
function CrdtLatticeDiagram({ revealed }: { revealed: boolean }) {
  return (
    <svg viewBox="0 0 480 230" width="100%" height="230" aria-label="CRDT join semilattice lattice">
      {/* Base State S0 */}
      <circle cx="240" cy="145" r="18" fill="var(--paper-raised)" stroke="var(--line)" strokeWidth="2" />
      <text x="240" y="149" textAnchor="middle" fill="var(--ink)" fontSize="10" fontWeight="700">State S₀</text>

      {/* Divergent branch A */}
      <circle cx="120" cy="90" r="22" fill="var(--paper-raised)" stroke="var(--viz-active)" strokeWidth="2" />
      <text x="120" y="88" textAnchor="middle" fill="var(--viz-active)" fontSize="10" fontWeight="700">Edit A</text>
      <text x="120" y="100" textAnchor="middle" fill="var(--ink-soft)" fontSize="8">Color: Green</text>

      {/* Divergent branch B */}
      <circle cx="360" cy="90" r="22" fill="var(--paper-raised)" stroke="var(--viz-active)" strokeWidth="2" />
      <text x="360" y="88" textAnchor="middle" fill="var(--viz-active)" fontSize="10" fontWeight="700">Edit B</text>
      <text x="360" y="100" textAnchor="middle" fill="var(--ink-soft)" fontSize="8">Pos: (50, 100)</text>

      {/* Converged Join A ⊔ B */}
      <circle cx="240" cy="35" r="26" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2.5" />
      <text x="240" y="34" textAnchor="middle" fill="var(--accent)" fontSize="13" fontWeight="800">A ⊔ B</text>
      <text x="240" y="47" textAnchor="middle" fill="var(--accent)" fontSize="8" fontWeight="600">Least Upper Bound</text>

      {/* Connecting edges */}
      <path d="M 224 133 L 138 102" stroke="var(--ink-soft)" strokeWidth="1.5" />
      <path d="M 256 133 L 342 102" stroke="var(--ink-soft)" strokeWidth="1.5" />
      <path d="M 138 78 L 218 48" stroke="var(--accent)" strokeWidth="2" />
      <path d="M 342 78 L 262 48" stroke="var(--accent)" strokeWidth="2" />

      {/* Mathematical axioms */}
      <rect x="20" y="176" width="440" height="42" rx="6" fill="var(--paper-raised)" stroke="var(--accent)" strokeWidth="1.5" />
      <text x="240" y="193" textAnchor="middle" fill="var(--ink)" fontSize="11" fontWeight="600">
        Commutative: A ⊔ B = B ⊔ A · Associative: (A ⊔ B) ⊔ C = A ⊔ (B ⊔ C) · Idempotent: A ⊔ A = A
      </text>
      <text x="240" y="208" textAnchor="middle" fill="var(--accent)" fontSize="11" fontWeight="800">
        Deterministic Strong Eventual Consistency without locks or central coordinator
      </text>
    </svg>
  )
}
