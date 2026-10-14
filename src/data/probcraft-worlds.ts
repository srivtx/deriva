// ProbCraft: 8 Linear 3D Voxel Worlds for Deriving Probability from First Principles
// Conforms to Deriva curriculum laws (docs/03): one thinking-move per world,
// naive waste/trap revealed before the leap, physical manipulation over quiz cards.

export type ProbWorldDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Elite" | "Master"

export type VoxelBlockType =
  | "air"
  | "grass"
  | "dirt"
  | "stone"
  | "cobble"
  | "wood"
  | "gold_ore"
  | "diamond_ore"
  | "coal_ore"
  | "obsidian"
  | "portal"
  | "lava"
  | "chest"
  | "bedrock"
  | "dice_block"
  | "glass"
  | "redstone"

export interface VoxelCoord {
  x: number
  y: number
  z: number
  type: VoxelBlockType
  label?: string
  metadata?: Record<string, unknown>
}

export interface ProbOption {
  id: string
  label: string
  isTrap: boolean
  explanation: string
}

export interface ProbQuestStage {
  stageNumber: number
  title: string
  objective: string
  hint: string
}

export interface MicrostatePath {
  id: string
  label: string
  probDesc: string
  color: string
}

export interface ProbWorld {
  id: string
  worldNumber: number
  title: string
  subtitle: string
  difficulty: ProbWorldDifficulty
  concept: string
  theorem: string
  trapTitle: string
  naiveTrap: string
  invariantProof: string
  formulaKatex: string
  missionPrompt: string
  winConditionDesc: string
  playerSpawn: [number, number, number] // [x, y, z]
  cameraLookAt: [number, number, number]
  blocks: VoxelCoord[]
  interactiveTargets: {
    id: string
    x: number
    y: number
    z: number
    name: string
    prompt?: string
    oddsDesc: string
    expectedValue: number
  }[]
  options: ProbOption[]
  correctOptionId: string
  theoryTakeaway: string
  targetTrials: number
  questStages: ProbQuestStage[]
  microstatePaths: MicrostatePath[]
}

// ────────────────────────────────────────────────────────────────────────────
// High-Performance Procedural Voxel Builders
// ────────────────────────────────────────────────────────────────────────────

function deduplicateBlocks(blocks: VoxelCoord[]): VoxelCoord[] {
  const map = new Map<string, VoxelCoord>()
  for (const b of blocks) {
    const key = `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.z)}`
    map.set(key, b)
  }
  return Array.from(map.values())
}

function createFloor(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  y = 0,
  defaultType: VoxelBlockType = "cobble",
  accentType?: VoxelBlockType,
  accentStep = 4
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      const isAccent = accentType && (Math.abs(x) % accentStep === 0 || Math.abs(z) % accentStep === 0 || Math.abs(x) === Math.abs(z))
      blocks.push({ x, y, z, type: isAccent ? accentType : defaultType })
    }
  }
  return blocks
}

function createPillar(
  x: number,
  z: number,
  minY: number,
  maxY: number,
  shaftType: VoxelBlockType = "stone",
  capType: VoxelBlockType = "cobble"
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  for (let y = minY; y <= maxY; y++) {
    const type = y === minY || y === maxY ? capType : shaftType
    blocks.push({ x, y, z, type })
  }
  return blocks
}

function createWall(
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  minY: number,
  maxY: number,
  type: VoxelBlockType = "cobble"
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minZ = Math.min(z1, z2)
  const maxZ = Math.max(z1, z2)
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      for (let y = minY; y <= maxY; y++) {
        blocks.push({ x, y, z, type })
      }
    }
  }
  return blocks
}

function createBeam(
  x1: number,
  y: number,
  z1: number,
  x2: number,
  z2: number,
  type: VoxelBlockType = "wood"
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minZ = Math.min(z1, z2)
  const maxZ = Math.max(z1, z2)
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      blocks.push({ x, y, z, type })
    }
  }
  return blocks
}

function createArch(
  centerX: number,
  z: number,
  minY: number,
  height: number,
  span: number,
  type: VoxelBlockType = "stone",
  capType: VoxelBlockType = "cobble"
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  const leftX = centerX - Math.floor(span / 2)
  const rightX = centerX + Math.floor(span / 2)
  const topY = minY + height

  for (let y = minY; y < topY; y++) {
    blocks.push({ x: leftX, y, z, type })
    blocks.push({ x: rightX, y, z, type })
  }
  for (let x = leftX; x <= rightX; x++) {
    blocks.push({ x, y: topY, z, type: capType })
  }
  return blocks
}

function createTower(
  cx: number,
  cz: number,
  halfWidth: number,
  minY: number,
  maxY: number,
  wallType: VoxelBlockType = "stone",
  crenelType: VoxelBlockType = "cobble",
  beaconType?: VoxelBlockType
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  const minX = cx - halfWidth
  const maxX = cx + halfWidth
  const minZ = cz - halfWidth
  const maxZ = cz + halfWidth

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      blocks.push({ x, y, z: minZ, type: wallType })
      blocks.push({ x, y, z: maxZ, type: wallType })
    }
    for (let z = minZ + 1; z < maxZ; z++) {
      blocks.push({ x: minX, y, z, type: wallType })
      blocks.push({ x: maxX, y, z, type: wallType })
    }
  }
  for (let x = minX; x <= maxX; x += 2) {
    blocks.push({ x, y: maxY + 1, z: minZ, type: crenelType })
    blocks.push({ x, y: maxY + 1, z: maxZ, type: crenelType })
  }
  for (let z = minZ; z <= maxZ; z += 2) {
    blocks.push({ x: minX, y: maxY + 1, z, type: crenelType })
    blocks.push({ x: maxX, y: maxY + 1, z, type: crenelType })
  }
  if (beaconType) {
    blocks.push({ x: minX, y: maxY + 2, z: minZ, type: beaconType })
    blocks.push({ x: maxX, y: maxY + 2, z: minZ, type: beaconType })
    blocks.push({ x: minX, y: maxY + 2, z: maxZ, type: beaconType })
    blocks.push({ x: maxX, y: maxY + 2, z: maxZ, type: beaconType })
  }
  return blocks
}

function createCorridor(
  axis: "x" | "z",
  fixedCoord: number,
  start: number,
  end: number,
  halfWidth: number,
  minY: number,
  height: number,
  wallType: VoxelBlockType = "stone",
  pillarInterval = 4
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  const min = Math.min(start, end)
  const max = Math.max(start, end)

  if (axis === "z") {
    const leftX = fixedCoord - halfWidth
    const rightX = fixedCoord + halfWidth
    for (let z = min; z <= max; z++) {
      for (let y = minY; y < minY + height; y++) {
        blocks.push({ x: leftX, y, z, type: wallType })
        blocks.push({ x: rightX, y, z, type: wallType })
      }
      if (pillarInterval > 0 && Math.abs(z) % pillarInterval === 0) {
        blocks.push({ x: leftX, y: minY + height, z, type: "cobble" })
        blocks.push({ x: rightX, y: minY + height, z, type: "cobble" })
      }
    }
  } else {
    const leftZ = fixedCoord - halfWidth
    const rightZ = fixedCoord + halfWidth
    for (let x = min; x <= max; x++) {
      for (let y = minY; y < minY + height; y++) {
        blocks.push({ x, y, z: leftZ, type: wallType })
        blocks.push({ x, y, z: rightZ, type: wallType })
      }
      if (pillarInterval > 0 && Math.abs(x) % pillarInterval === 0) {
        blocks.push({ x, y: minY + height, z: leftZ, type: "cobble" })
        blocks.push({ x, y: minY + height, z: rightZ, type: "cobble" })
      }
    }
  }
  return blocks
}

function createStairs(
  startX: number,
  startZ: number,
  minY: number,
  steps: number,
  dx: number,
  dz: number,
  stepType: VoxelBlockType = "stone"
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  for (let s = 0; s < steps; s++) {
    const x = startX + s * dx
    const z = startZ + s * dz
    const y = minY + s
    blocks.push({ x, y, z, type: stepType })
    for (let fillY = minY; fillY < y; fillY++) {
      blocks.push({ x, y: fillY, z, type: "cobble" })
    }
  }
  return blocks
}

// ────────────────────────────────────────────────────────────────────────────
// 8 Linear Progressive Worlds from Foundations to Master
// ────────────────────────────────────────────────────────────────────────────

export const PROBCRAFT_WORLDS: ProbWorld[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 1: BERTRAND'S VAULTS (SAMPLE SPACE CONDITIONING)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "bertrands-vault",
    worldNumber: 1,
    title: "The Vaults of Bertrand",
    subtitle: "Conditioning on Outcomes vs Counting Remaining Boxes",
    difficulty: "Beginner",
    concept: "Conditional Probability & Sample Space Partitioning",
    theorem: "Bayes Theorem / Principle of Restricted Choice",
    trapTitle: "The Remaining Box Illusion",
    naiveTrap:
      "Candidates see that the coal box is ruled out and conclude: 'Two boxes remain — one has gold, one has coal — so probability is 1/2.'",
    invariantProof:
      "There are 3 Gold coins across all chests. The Gold Chest contains 2 gold coins (paths G1 and G2); the Mixed Chest contains 1 gold coin (path G3). Drawing a gold coin means you are in path G1, G2, or G3 with equal probability 1/3. Two of these three paths (G1, G2) belong to the double-gold chest. Therefore, P(Other is Gold | First is Gold) = 2/3.",
    formulaKatex: "P(A \\mid B) = \\frac{P(B \\mid A) P(A)}{P(B)} = \\frac{1 \\times \\frac{1}{3}}{\\frac{1}{2}} = \\frac{2}{3}",
    missionPrompt:
      "Three stone vaults stand before you: Vault A holds [Gold + Gold], Vault B holds [Coal + Coal], Vault C holds [Gold + Coal]. Open Vault A or C blindly. You extracted a Gold Ore! Inspect the other slot: why is the chance of finding Gold 2/3 instead of 1/2?",
    winConditionDesc: "Test 10 vault extractions and verify empirical convergence to 66.7%",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 1.8, 0],
    blocks: deduplicateBlocks([
      // Sprawling 45x45 Crypt Foundation at y = 0
      ...createFloor(-22, 22, -22, 22, 0, "cobble", "stone", 4),

      // Outer Perimeter Crypt Fortress Walls (y = 1 to 4)
      ...createWall(-22, -22, 22, -22, 1, 4, "stone"),
      ...createWall(-22, 22, 22, 22, 1, 3, "stone"),
      ...createWall(-22, -22, -22, 22, 1, 4, "stone"),
      ...createWall(22, -22, 22, 22, 1, 4, "stone"),

      // 4 Grand Gothic Corner Bastions
      ...createTower(-19, -19, 3, 1, 6, "stone", "cobble", "redstone"),
      ...createTower(19, -19, 3, 1, 6, "stone", "cobble", "redstone"),
      ...createTower(-19, 19, 3, 1, 5, "stone", "cobble"),
      ...createTower(19, 19, 3, 1, 5, "stone", "cobble"),

      // Central Sanctum Pillars & Wood Crossbeams
      ...createPillar(-6, -4, 1, 5, "stone", "cobble"),
      ...createPillar(6, -4, 1, 5, "stone", "cobble"),
      ...createPillar(-6, 6, 1, 5, "stone", "cobble"),
      ...createPillar(6, 6, 1, 5, "stone", "cobble"),
      { x: -6, y: 6, z: -4, type: "redstone" },
      { x: 6, y: 6, z: -4, type: "redstone" },
      { x: -6, y: 6, z: 6, type: "redstone" },
      { x: 6, y: 6, z: 6, type: "redstone" },
      ...createBeam(-6, 5, -4, 6, -4, "wood"),
      ...createBeam(-6, 5, 6, 6, 6, "wood"),
      ...createBeam(-6, 5, -4, -6, 6, "wood"),
      ...createBeam(6, 5, -4, 6, 6, "wood"),

      // Back Crypt Wall & Arches
      ...createWall(-8, -5, 8, -5, 1, 4, "stone"),
      ...createArch(-3, -4, 1, 4, 3, "cobble", "stone"),
      ...createArch(3, -4, 1, 4, 3, "cobble", "stone"),

      // The 3 Primary Puzzle Vaults
      { x: -3, y: 1, z: 0, type: "stone" },
      { x: -3, y: 2, z: 0, type: "chest", label: "Vault A [Gold + Gold]" },
      { x: 0, y: 1, z: 0, type: "stone" },
      { x: 0, y: 2, z: 0, type: "chest", label: "Vault B [Coal + Coal]" },
      { x: 3, y: 1, z: 0, type: "stone" },
      { x: 3, y: 2, z: 0, type: "chest", label: "Vault C [Gold + Coal]" },

      // Sample Space Path Lines on Floor
      { x: -3, y: 0, z: 1, type: "gold_ore" },
      { x: -3, y: 0, z: 2, type: "gold_ore" },
      { x: -3, y: 0, z: 3, type: "gold_ore" },
      { x: 0, y: 0, z: 1, type: "coal_ore" },
      { x: 0, y: 0, z: 2, type: "coal_ore" },
      { x: 0, y: 0, z: 3, type: "coal_ore" },
      { x: 3, y: 0, z: 1, type: "gold_ore" },
      { x: 3, y: 0, z: 2, type: "coal_ore" },
      { x: 3, y: 0, z: 3, type: "gold_ore" },

      // West Exploration Corridor & The Prior Crypt Chamber
      ...createCorridor("x", -4, -6, -16, 2, 1, 3, "stone"),
      ...createWall(-18, -12, -14, -6, 1, 3, "cobble"),
      { x: -16, y: 1, z: -10, type: "stone" },
      { x: -16, y: 2, z: -10, type: "gold_ore", label: "Bayes' Ancient Inscription" },
      { x: -16, y: 3, z: -10, type: "redstone" },

      // East Exploration Corridor & The Hall of Restricted Choice
      ...createCorridor("x", -4, 6, 16, 2, 1, 3, "stone"),
      ...createWall(14, -12, 18, -6, 1, 3, "cobble"),
      { x: 16, y: 1, z: -10, type: "stone" },
      { x: 16, y: 2, z: -10, type: "diamond_ore", label: "Shrine of Restricted Choice" },
      { x: 16, y: 3, z: -10, type: "redstone" },

      // North Battlements & High Crypt Observation Perch
      ...createStairs(0, -6, 1, 5, 0, -2, "stone"),
      ...createWall(-4, -18, 4, -16, 4, 4, "stone"),
      { x: 0, y: 5, z: -18, type: "diamond_ore", label: "High Crypt Observation Perch" },
      { x: 0, y: 6, z: -18, type: "redstone" },

      // South Entrance Colonnade protecting player spawn at [0, 2.15, 5]
      ...createPillar(-4, 8, 1, 4, "stone", "cobble"),
      ...createPillar(4, 8, 1, 4, "stone", "cobble"),
      ...createPillar(-4, 14, 1, 4, "stone", "cobble"),
      ...createPillar(4, 14, 1, 4, "stone", "cobble"),
    ]),
    interactiveTargets: [
      { id: "vault-a", x: -3, y: 2, z: 0, name: "Vault A (Gold + Gold)", oddsDesc: "2 Gold Coins (Paths G1 & G2 — 2/3 of all gold)", expectedValue: 2 },
      { id: "vault-b", x: 0, y: 2, z: 0, name: "Vault B (Coal + Coal)", oddsDesc: "2 Coal Coins (Eliminated by observing Gold)", expectedValue: 0 },
      { id: "vault-c", x: 3, y: 2, z: 0, name: "Vault C (Gold + Coal)", oddsDesc: "1 Gold Coin (Path G3 — 1/3 of all gold)", expectedValue: 1 },
      { id: "shrine-bayes", x: -16, y: 2, z: -10, name: "Bayes' Ancient Inscription", oddsDesc: "Prior 1/3 updated by likelihood ratio: P(Gold|GG)=1 vs P(Gold|GC)=1/2 gives Posterior 2/3", expectedValue: 0.667 },
      { id: "shrine-restricted-choice", x: 16, y: 2, z: -10, name: "Shrine of Restricted Choice", oddsDesc: "Double-gold vault has 2 pathways to draw gold; mixed vault has only 1. 2/3 of all gold paths lie in Vault A", expectedValue: 2.0 },
      { id: "perch-observation", x: 0, y: 5, z: -18, name: "High Crypt Observation Perch", oddsDesc: "Overlooks all 3 microstate pathways (G1, G2, G3) across the nave", expectedValue: 1.0 },
    ],
    options: [
      { id: "opt-half", label: "1/2 (50%) — Two surviving chests, each equally likely", isTrap: true, explanation: "Counts boxes instead of individual coin draw paths. The double gold box has twice as many ways to produce a gold draw." },
      { id: "opt-two-thirds", label: "2/3 (66.7%) — 2 of the 3 existing gold coins belong to the double-gold vault", isTrap: false, explanation: "Correct! Conditioning on seeing gold eliminates 3 of the 6 total coin faces, leaving 2 from Box A and 1 from Box C." },
      { id: "opt-one-third", label: "1/3 (33.3%) — The chance of originally choosing Vault 1", isTrap: true, explanation: "Ignores the new evidence. Observing gold rules out Vault 2 completely, so the probability must update upwards." },
    ],
    correctOptionId: "opt-two-thirds",
    theoryTakeaway: "Condition on individual microstate outcomes, never on aggregate macrostate containers.",
    targetTrials: 10,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: Two Closed Vaults",
        objective: "Examine the vaults. You draw a gold coin. Vault B (Coal+Coal) is impossible. Are the remaining vaults 50/50?",
        hint: "Count how many total gold coins exist across all three vaults, not just how many boxes remain.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: Count the Microstates",
        objective: "Mine the vaults 10 times. Track whether your gold coin was drawn from Vault A (Paths G1, G2) or Vault C (Path G3).",
        hint: "Vault A produces twice as many gold draws as Vault C because it holds two gold coins.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Bayes Sample Partition",
        objective: "Lock in your deduction: P(Double Gold | Gold Seen) = (2 paths) / (3 total gold paths) = 2/3.",
        hint: "Select the 2/3 hypothesis card below to cement the theorem.",
      },
    ],
    microstatePaths: [
      { id: "path-g1", label: "Path G1: Vault A (Coin 1)", probDesc: "Gold coin from double-gold vault (1/3 of all gold)", color: "#eab308" },
      { id: "path-g2", label: "Path G2: Vault A (Coin 2)", probDesc: "Second gold coin from double-gold vault (1/3 of all gold)", color: "#eab308" },
      { id: "path-g3", label: "Path G3: Vault C (Coin 1)", probDesc: "Only gold coin from mixed vault (1/3 of all gold)", color: "#06b6d4" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 2: THE VEIN OF LARGE NUMBERS (EXPECTED VALUE & VARIANCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "law-of-large-numbers",
    worldNumber: 2,
    title: "The Vein of Large Numbers",
    subtitle: "Sample Average Convergence & Pickaxe Variance",
    difficulty: "Beginner",
    concept: "Expected Value E[X] & Weak Law of Large Numbers",
    theorem: "Khinchin's Law of Large Numbers (WLLN)",
    trapTitle: "The High-Variance Delusion",
    naiveTrap:
      "Players judge an action's worth by its single best payout rather than its expected value per action.",
    invariantProof:
      "Let X be the payout per block mined. E[X] = \\sum x \\cdot P(X=x). While Pickaxe A yields guaranteed 1 gold (Var=0), Pickaxe B yields 0.10 \\times 14 = 1.4 gold. As N \\to \\infty, the sample average \\bar{X}_N = \\frac{1}{N} \\sum_{i=1}^N X_i converges in probability to E[X] with standard error \\sigma / \\sqrt{N}.",
    formulaKatex: "\\lim_{N \\to \\infty} P(|\\bar{X}_N - \\mu| < \\epsilon) = 1, \\quad \\sigma_{\\bar{X}} = \\frac{\\sigma}{\\sqrt{N}}",
    missionPrompt:
      "A massive vein of mystic ores stretches ahead. Test three mining tools: Iron Pick (1 gold guaranteed, E=1.0), Diamond Pick (10% chance of 14 gold, E=1.4), and Cursed Pick (1% chance of 80 gold, E=0.8). Mine 20 blocks to watch sample average converge to expectation!",
    winConditionDesc: "Mine 20 blocks to observe sample average convergence within 10% of theoretical mean",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 2.0, 0],
    blocks: deduplicateBlocks([
      // Subterranean Mine Floor (45x45 stone and cobble)
      ...createFloor(-22, 22, -22, 22, 0, "stone", "cobble", 4),

      // Outer Deep Mine Cavern Walls
      ...createWall(-22, -22, 22, -22, 1, 5, "stone"),
      ...createWall(-22, 22, 22, 22, 1, 4, "stone"),
      ...createWall(-22, -22, -22, 22, 1, 5, "stone"),
      ...createWall(22, -22, 22, 22, 1, 5, "stone"),

      // Mine Scaffolding Timbers (upright wood logs)
      ...createPillar(-6, -4, 1, 5, "wood", "wood"),
      ...createPillar(0, -4, 1, 5, "wood", "wood"),
      ...createPillar(6, -4, 1, 5, "wood", "wood"),
      ...createPillar(-6, 3, 1, 5, "wood", "wood"),
      ...createPillar(0, 3, 1, 5, "wood", "wood"),
      ...createPillar(6, 3, 1, 5, "wood", "wood"),

      // Overhead Wooden Scaffolding Beams
      ...createBeam(-6, 5, -4, 6, -4, "wood"),
      ...createBeam(-6, 5, 3, 6, 3, "wood"),
      ...createBeam(-6, 5, -4, -6, 3, "wood"),
      ...createBeam(6, 5, -4, 6, 3, "wood"),

      // Multi-tiered Ore Vein Wall (Diamond, Gold, and Coal ores)
      ...Array.from({ length: 17 }, (_, i) => {
        const x = i - 8
        return [
          { x, y: 1, z: -3, type: ((i % 3 === 0 ? "diamond_ore" : i % 2 === 0 ? "gold_ore" : "coal_ore") as VoxelBlockType) },
          { x, y: 2, z: -3, type: ((i % 4 === 0 ? "diamond_ore" : i % 2 === 1 ? "gold_ore" : "stone") as VoxelBlockType) },
          { x, y: 3, z: -3, type: ((i % 2 === 0 ? "coal_ore" : "gold_ore") as VoxelBlockType) },
          { x, y: 4, z: -3, type: ((i % 5 === 0 ? "diamond_ore" : "stone") as VoxelBlockType) },
        ]
      }).flat(),

      // Tool Pickaxe Pedestals at z = 2
      { x: -3, y: 1, z: 2, type: "cobble" },
      { x: -3, y: 2, z: 2, type: "gold_ore", label: "Steady Iron Pick Station" },
      { x: 0, y: 1, z: 2, type: "cobble" },
      { x: 0, y: 2, z: 2, type: "diamond_ore", label: "Lucky Diamond Pick Station" },
      { x: 3, y: 1, z: 2, type: "cobble" },
      { x: 3, y: 2, z: 2, type: "obsidian", label: "Cursed Nether Pick Station" },
      { x: -6, y: 3, z: -3, type: "redstone" },
      { x: 6, y: 3, z: -3, type: "redstone" },

      // West Exploration Shaft: The Deep Assay Quarry
      ...createCorridor("x", 3, -6, -18, 2, 1, 3, "wood"),
      ...createWall(-21, 0, -15, 6, 1, 4, "stone"),
      { x: -18, y: 1, z: 3, type: "cobble" },
      { x: -18, y: 2, z: 3, type: "gold_ore", label: "Khinchin's LLN Monument" },
      { x: -18, y: 3, z: 3, type: "redstone" },

      // East Exploration Shaft: The Hall of Variance
      ...createCorridor("x", 3, 6, 18, 2, 1, 3, "wood"),
      ...createWall(15, 0, 21, 6, 1, 4, "stone"),
      { x: 18, y: 1, z: 3, type: "cobble" },
      { x: 18, y: 2, z: 3, type: "diamond_ore", label: "Altar of the Standard Error" },
      { x: 18, y: 3, z: 3, type: "redstone" },

      // North High Scaffolding Bastion & High Deck
      ...createStairs(0, -6, 1, 6, 0, -2, "wood"),
      ...createWall(-6, -17, 6, -13, 5, 5, "wood"),
      { x: 0, y: 6, z: -15, type: "diamond_ore", label: "High Scaffolding Watchtower" },
      { x: 0, y: 7, z: -15, type: "redstone" },

      // Mine Cavern Sunk Shafts and Pits
      ...createPillar(-15, -15, 1, 6, "wood", "stone"),
      ...createPillar(15, -15, 1, 6, "wood", "stone"),
      ...createPillar(-15, 15, 1, 5, "wood", "stone"),
      ...createPillar(15, 15, 1, 5, "wood", "stone"),
    ]),
    interactiveTargets: [
      { id: "pick-iron", x: -3, y: 2, z: 2, name: "Steady Iron Pick", oddsDesc: "100% chance of 1 gold chunk (EV = 1.0)", expectedValue: 1.0 },
      { id: "pick-diamond", x: 0, y: 2, z: 2, name: "Lucky Diamond Pick", oddsDesc: "10% chance of 14 gold, 90% chance of 0 (EV = 1.4)", expectedValue: 1.4 },
      { id: "pick-cursed", x: 3, y: 2, z: 2, name: "Cursed Nether Pick", oddsDesc: "1% chance of 80 gold, 99% chance of 0 (EV = 0.8)", expectedValue: 0.8 },
      { id: "shrine-khinchin", x: -18, y: 2, z: 3, name: "Khinchin's LLN Monument", oddsDesc: "Sample average X̄_N converges in probability to E[X] = 1.4 gold/strike as trials N grow large", expectedValue: 1.4 },
      { id: "shrine-variance", x: 18, y: 2, z: 3, name: "Altar of the Standard Error", oddsDesc: "Standard error scales as σ/√N. Over short horizons variance deceives, but over deep horizons EV dominates", expectedValue: 1.0 },
      { id: "perch-scaffold", x: 0, y: 6, z: -15, name: "High Scaffolding Watchtower", oddsDesc: "Surveying the deep ore strata: Diamond pick delivers 40% more wealth over 1,000 strikes", expectedValue: 1.4 },
    ],
    options: [
      { id: "opt-iron", label: "Iron Pick: 1 guaranteed is always safer and better over 1000 blocks", isTrap: true, explanation: "Zero variance, but lower expected yield: 1000 blocks gives 1000 gold vs Diamond Pick's expected 1400 gold." },
      { id: "opt-diamond", label: "Diamond Pick: E[X] = 1.4 gold/strike, yielding 40% more total wealth over large N", isTrap: false, explanation: "Correct! In repeat games, expected value governs cumulative payout as variance averages out." },
      { id: "opt-cursed", label: "Cursed Pick: 80 gold jackpot makes it the highest EV tool", isTrap: true, explanation: "0.01 * 80 = 0.8 gold/strike, which is worse than both Iron (1.0) and Diamond (1.4)." },
    ],
    correctOptionId: "opt-diamond",
    theoryTakeaway: "In repeated trials, maximize Expected Value E[X]. Variance only dominates short horizons.",
    targetTrials: 20,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: Jackpot Temptation",
        objective: "Inspect the three picks. Does the Cursed Pick's 80-gold jackpot make it the superior tool?",
        hint: "Multiply probability by payout: 0.01 x 80 = 0.8 gold per strike.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: Mine 20 Ore Blocks",
        objective: "Strike the ore vein 20 times. Watch how variance flattens out as sample mean converges toward E[X].",
        hint: "Short streaks of zeroes are quickly smoothed by the law of large numbers.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Khinchin's LLN",
        objective: "Deduce why Diamond Pick dominates: E[X] = 1.4 vs Iron's 1.0 and Cursed's 0.8.",
        hint: "Select the Diamond Pick hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-iron", label: "Iron Pick Strike", probDesc: "Guaranteed 1 Gold (EV = 1.0, Var = 0)", color: "#eab308" },
      { id: "path-diamond", label: "Diamond Pick Jackpot", probDesc: "10% chance of 14 Gold (EV = 1.4, Var = 17.64)", color: "#06b6d4" },
      { id: "path-cursed", label: "Cursed Nether Strike", probDesc: "1% chance of 80 Gold (EV = 0.8, Var = 63.36)", color: "#ef4444" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 3: MONTY'S NETHER CITADEL (BAYESIAN UPDATING & INFORMATION)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "monty-hall-citadel",
    worldNumber: 3,
    title: "Monty's Nether Citadel",
    subtitle: "The Three Portals & Filtered Host Information",
    difficulty: "Intermediate",
    concept: "Bayesian Updating with Informed Non-Random Filtering",
    theorem: "The Monty Hall Theorem",
    trapTitle: "The Symmetrical 50/50 Myth",
    naiveTrap:
      "When one goat portal is opened, people assume the two remaining closed portals now have equal 50/50 odds.",
    invariantProof:
      "Initial choice has P(Win) = 1/3 and P(Loss) = 2/3. The host CANNOT open your portal and CANNOT open the prize portal. When you originally picked wrong (2/3 of the time), the host is FORCED to reveal the single other wrong portal, so the remaining door has the prize with probability 2/3. Switching wins whenever your original pick was wrong!",
    formulaKatex: "P(\\text{Win by Switching}) = 1 - P(\\text{Initial Pick Correct}) = 1 - \\frac{1}{3} = \\frac{2}{3}",
    missionPrompt:
      "Three glowing Nether Portals stand in the obsidian sanctum. One leads to the Diamond Citadel; two drop into the Sheep Void. Pick Portal 1. The dungeon master steps forward and activates Portal 3, exposing a sheep! Should you STAY at Portal 1, or SWITCH to Portal 2?",
    winConditionDesc: "Test 15 rounds of Switching vs Staying and verify the 2:1 win ratio",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 2.0, 0],
    blocks: deduplicateBlocks([
      // Sprawling 45x45 Obsidian Floor with Redstone Accents
      ...createFloor(-22, 22, -22, 22, 0, "obsidian", "redstone", 4),

      // Perimeter Lava Moats around the Citadel (y = 0)
      ...createWall(-20, -20, 20, -20, 0, 0, "lava"),
      ...createWall(-20, 20, 20, 20, 0, 0, "lava"),
      ...createWall(-20, -20, -20, 20, 0, 0, "lava"),
      ...createWall(20, -20, 20, 20, 0, 0, "lava"),

      // Outer Citadel Obsidian Ramparts (y = 1 to 4)
      ...createWall(-22, -22, 22, -22, 1, 4, "obsidian"),
      ...createWall(-22, 22, 22, 22, 1, 3, "obsidian"),
      ...createWall(-22, -22, -22, 22, 1, 4, "obsidian"),
      ...createWall(22, -22, 22, 22, 1, 4, "obsidian"),

      // 4 Monolithic Obsidian Towers
      ...createTower(-18, -18, 3, 1, 7, "obsidian", "stone", "redstone"),
      ...createTower(18, -18, 3, 1, 7, "obsidian", "stone", "redstone"),
      ...createTower(-18, 18, 3, 1, 5, "obsidian", "stone"),
      ...createTower(18, 18, 3, 1, 5, "obsidian", "stone"),

      // Inner Moat Channels flanking Portal Platform
      ...createWall(-8, -6, -7, 6, 0, 0, "lava"),
      ...createWall(7, -6, 8, 6, 0, 0, "lava"),
      ...createWall(-6, -6, -6, 6, 1, 1, "cobble"),
      ...createWall(6, -6, 6, 6, 1, 1, "cobble"),

      // Portal 1 (Left: Obsidian Frame 4 wide, 5 high)
      ...createPillar(-5, -2, 1, 5, "obsidian", "obsidian"),
      ...createPillar(-2, -2, 1, 5, "obsidian", "obsidian"),
      { x: -4, y: 5, z: -2, type: "obsidian" },
      { x: -3, y: 5, z: -2, type: "obsidian" },
      { x: -4, y: 1, z: -2, type: "obsidian" },
      { x: -3, y: 1, z: -2, type: "obsidian" },
      { x: -4, y: 2, z: -2, type: "portal", label: "Portal 1 (Initial Choice)" },
      { x: -3, y: 2, z: -2, type: "portal" },
      { x: -4, y: 3, z: -2, type: "portal" },
      { x: -3, y: 3, z: -2, type: "portal" },
      { x: -4, y: 4, z: -2, type: "portal" },
      { x: -3, y: 4, z: -2, type: "portal" },

      // Portal 2 (Center: Obsidian Frame 4 wide, 5 high)
      ...createPillar(-1, -2, 1, 5, "obsidian", "obsidian"),
      ...createPillar(2, -2, 1, 5, "obsidian", "obsidian"),
      { x: 0, y: 5, z: -2, type: "obsidian" },
      { x: 1, y: 5, z: -2, type: "obsidian" },
      { x: 0, y: 1, z: -2, type: "obsidian" },
      { x: 1, y: 1, z: -2, type: "obsidian" },
      { x: 0, y: 2, z: -2, type: "portal", label: "Portal 2 (Switch Alternative)" },
      { x: 1, y: 2, z: -2, type: "portal" },
      { x: 0, y: 3, z: -2, type: "portal" },
      { x: 1, y: 3, z: -2, type: "portal" },
      { x: 0, y: 4, z: -2, type: "portal" },
      { x: 1, y: 4, z: -2, type: "portal" },

      // Portal 3 (Right: Obsidian Frame 4 wide, 5 high)
      ...createPillar(3, -2, 1, 5, "obsidian", "obsidian"),
      ...createPillar(6, -2, 1, 5, "obsidian", "obsidian"),
      { x: 4, y: 5, z: -2, type: "obsidian" },
      { x: 5, y: 5, z: -2, type: "obsidian" },
      { x: 4, y: 1, z: -2, type: "obsidian" },
      { x: 5, y: 1, z: -2, type: "obsidian" },
      { x: 4, y: 2, z: -2, type: "portal", label: "Portal 3 (Revealed Sheep)" },
      { x: 5, y: 2, z: -2, type: "portal" },
      { x: 4, y: 3, z: -2, type: "portal" },
      { x: 5, y: 3, z: -2, type: "portal" },
      { x: 4, y: 4, z: -2, type: "portal" },
      { x: 5, y: 4, z: -2, type: "portal" },

      // Host Podium in Front
      { x: 0, y: 1, z: 2, type: "obsidian" },
      { x: 0, y: 2, z: 2, type: "redstone", label: "Host Altar" },

      // West Exploration Wing: Shrine of Filtered Knowledge
      ...createCorridor("x", 5, -6, -18, 2, 1, 3, "obsidian"),
      ...createWall(-20, 2, -14, 8, 1, 4, "obsidian"),
      { x: -17, y: 1, z: 5, type: "obsidian" },
      { x: -17, y: 2, z: 5, type: "portal", label: "Shrine of Filtered Knowledge" },
      { x: -17, y: 3, z: 5, type: "redstone" },

      // East Exploration Wing: Hall of Preserved Probability Mass
      ...createCorridor("x", 5, 6, 18, 2, 1, 3, "obsidian"),
      ...createWall(14, 2, 20, 8, 1, 4, "obsidian"),
      { x: 17, y: 1, z: 5, type: "obsidian" },
      { x: 17, y: 2, z: 5, type: "diamond_ore", label: "Altar of Preserved Mass" },
      { x: 17, y: 3, z: 5, type: "redstone" },

      // North Citadel Ramparts & Observation Spire
      ...createStairs(0, -6, 1, 6, 0, -2, "obsidian"),
      ...createWall(-6, -19, 6, -15, 5, 5, "obsidian"),
      { x: 0, y: 6, z: -17, type: "obsidian", label: "Citadel Observation Spire" },
      { x: 0, y: 7, z: -17, type: "redstone" },
    ]),
    interactiveTargets: [
      { id: "portal-1", x: -4, y: 2, z: -2, name: "Portal 1 (Initial Choice)", oddsDesc: "Keeps initial 1/3 prior probability", expectedValue: 0.333 },
      { id: "portal-2", x: 0, y: 2, z: -2, name: "Portal 2 (Switch Alternative)", oddsDesc: "Absorbs 2/3 probability mass from host filter", expectedValue: 0.667 },
      { id: "portal-3", x: 4, y: 2, z: -2, name: "Portal 3 (Revealed Sheep)", oddsDesc: "Known goat (0% win probability)", expectedValue: 0 },
      { id: "shrine-host-filter", x: -17, y: 2, z: 5, name: "Shrine of Filtered Knowledge", oddsDesc: "The host's choice is constrained: he cannot open your door and cannot open the diamond", expectedValue: 0.667 },
      { id: "shrine-prob-mass", x: 17, y: 2, z: 5, name: "Altar of Preserved Mass", oddsDesc: "Initial pick preserves 1/3 prior. The remaining 2/3 probability mass concentrates entirely onto Door 2", expectedValue: 0.667 },
      { id: "perch-citadel", x: 0, y: 6, z: -17, name: "Citadel Observation Spire", oddsDesc: "High vantage overlooking the 3 Nether arches: switching wins in 2 of 3 possible worlds", expectedValue: 0.667 },
    ],
    options: [
      { id: "opt-stay", label: "Stay with Portal 1: It's 50/50 between the two remaining portals", isTrap: true, explanation: "Fails to account for host knowledge. The host's filtered action is not random coin tossing." },
      { id: "opt-switch", label: "Switch to Portal 2: Doubles your win rate from 1/3 to 2/3", isTrap: false, explanation: "Correct! Switching wins in every universe where your first guess was wrong (which happens 2/3 of the time)." },
      { id: "opt-same", label: "It makes zero mathematical difference whether you switch or stay", isTrap: true, explanation: "Common intuition fallacy: independent symmetry only applies if the host had picked randomly and happened not to reveal the diamond." },
    ],
    correctOptionId: "opt-switch",
    theoryTakeaway: "Host filtering concentrates the unchosen probability mass into the remaining candidate.",
    targetTrials: 15,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: The 50/50 Illusion",
        objective: "Portal 3 is opened to reveal a sheep void. Do the two remaining closed portals have equal 50/50 odds?",
        hint: "The host knew where the diamond was. His choice was constrained, not random.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: 15 Portal Trials",
        objective: "Simulate 15 portal rounds. Track the empirical win rate of switching vs staying.",
        hint: "Notice that switching wins in every scenario where your initial guess was incorrect.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Information Massing",
        objective: "Deduce why switching doubles your win rate to 2/3: P(Win | Switch) = 1 - P(Initial Correct) = 2/3.",
        hint: "Select the Switch hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-stay", label: "Stay with Portal 1", probDesc: "Wins only in 1/3 of universes (Initial pick correct)", color: "#9ca3af" },
      { id: "path-switch", label: "Switch to Portal 2", probDesc: "Wins in 2/3 of universes (Absorbs host filter mass)", color: "#06b6d4" },
      { id: "path-goat", label: "Revealed Sheep Portal", probDesc: "Filtered out by the dungeon master (0% win)", color: "#ef4444" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 4: THE DRUNKARD'S VOID BRIDGE (RANDOM WALKS & RECURRENCE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "drunkards-walk-bridge",
    worldNumber: 4,
    title: "The Drunkard's Void Bridge",
    subtitle: "Pólya's Recurrence & Gambler's Absorbing Ruin",
    difficulty: "Intermediate",
    concept: "Symmetric Random Walks & Absorbing Boundaries",
    theorem: "Pólya's Recurrence Theorem (1921)",
    trapTitle: "The Drifter's Guarantee",
    naiveTrap:
      "Assuming that a fair random walk will quickly drift infinitely far away without ever coming back to the start.",
    invariantProof:
      "A 1D simple symmetric random walk (p=1/2) is null recurrent: P(return to origin) = 1.0. In 2D grid walk, P(return) = 1.0. But in 3D voxel space, P(return) \\approx 0.3405 — 'A drunk man will find his way home, but a drunk bird may be lost forever' (Kakutani). With asymmetric p < 0.5, gambler's ruin gives an exponential hitting probability: P(\\text{ruin}) = 1 - (p/q)^k.",
    formulaKatex: "P(\\text{Return in 1D}) = 1.0, \\quad P(\\text{Return in 3D}) \\approx 0.340537",
    missionPrompt:
      "A narrow 1-block stone bridge spans a bottomless void. You take random steps forward (+1) or backward (-1). With a fair wind (p=0.5), will you return to your starting block? Step onto the bridge and simulate 25 walks to test recurrence vs transience!",
    winConditionDesc: "Simulate 25 random walk paths and verify 100% recurrence in 1D",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 1.5, -2],
    blocks: deduplicateBlocks([
      // Safe Spawn Temple Island & South Plaza (x: -22..22, z: 2..22 at y = 0)
      ...createFloor(-22, 22, 2, 22, 0, "cobble", "stone", 4),

      // 4 Temple Pillars on Spawn Island
      ...createPillar(-3, 3, 1, 4, "stone", "obsidian"),
      ...createPillar(3, 3, 1, 4, "stone", "obsidian"),
      ...createPillar(-3, 7, 1, 4, "stone", "obsidian"),
      ...createPillar(3, 7, 1, 4, "stone", "obsidian"),
      { x: -3, y: 5, z: 3, type: "redstone" },
      { x: 3, y: 5, z: 3, type: "redstone" },

      // 1D Narrow Suspended Bridge spanning across void (x=0, y=0, z=0 down to z=-10)
      { x: 0, y: 0, z: 0, type: "diamond_ore", label: "Origin Marker (z=0)" },
      { x: 0, y: 0, z: -1, type: "stone", label: "Step -1" },
      { x: 0, y: 0, z: -2, type: "stone", label: "Step -2" },
      { x: 0, y: 0, z: -3, type: "stone", label: "Step -3" },
      { x: 0, y: 0, z: -4, type: "redstone", label: "Midpoint Marker (z=-4)" },
      { x: 0, y: 0, z: -5, type: "stone", label: "Step -5" },
      { x: 0, y: 0, z: -6, type: "stone", label: "Step -6" },
      { x: 0, y: 0, z: -7, type: "stone", label: "Step -7" },
      { x: 0, y: 0, z: -8, type: "gold_ore", label: "Threshold Marker (z=-8)" },
      { x: 0, y: 0, z: -9, type: "stone", label: "Step -9" },
      { x: 0, y: 0, z: -10, type: "stone", label: "Step -10" },

      // Floating Destination Gold Island (x: -12..12, z: -22..-11 at y = 0)
      ...createFloor(-12, 12, -22, -11, 0, "gold_ore", "obsidian", 3),
      ...createPillar(-6, -16, 1, 5, "obsidian", "gold_ore"),
      ...createPillar(6, -16, 1, 5, "obsidian", "gold_ore"),
      { x: 0, y: 1, z: -18, type: "obsidian" },
      { x: 0, y: 2, z: -18, type: "gold_ore", label: "Monolith of Absorbing Boundaries" },
      { x: 0, y: 3, z: -18, type: "redstone" },

      // West Floating Island: Pólya's Recurrence Stele
      ...createFloor(-22, -12, -12, 2, 0, "stone", "cobble", 3),
      ...createPillar(-18, -6, 1, 4, "stone", "cobble"),
      { x: -18, y: 1, z: -6, type: "stone" },
      { x: -18, y: 2, z: -6, type: "diamond_ore", label: "Pólya's Recurrence Stele" },
      { x: -18, y: 3, z: -6, type: "redstone" },

      // East Floating Island: Kakutani's Aviary
      ...createFloor(12, 22, -12, 2, 0, "stone", "cobble", 3),
      ...createPillar(18, -6, 1, 4, "stone", "cobble"),
      { x: 18, y: 1, z: -6, type: "stone" },
      { x: 18, y: 2, z: -6, type: "glass", label: "Kakutani's Drunk Bird Perch" },
      { x: 18, y: 3, z: -6, type: "redstone" },

      // Floating Stepping Stone Archipelagos in the Void
      { x: -5, y: 0, z: -4, type: "cobble" },
      { x: -6, y: 0, z: -5, type: "stone" },
      { x: -8, y: 0, z: -8, type: "cobble" },
      { x: 5, y: 0, z: -4, type: "cobble" },
      { x: 6, y: 0, z: -5, type: "stone" },
      { x: 8, y: 0, z: -8, type: "cobble" },
    ]),
    interactiveTargets: [
      { id: "walk-fair", x: 0, y: 0, z: 0, name: "Fair Walk (p=0.5)", oddsDesc: "Recurrent: Expected visits to origin is infinite (P=1.0)", expectedValue: 1.0 },
      { id: "walk-biased", x: 0, y: 0, z: -4, name: "Adverse Wind (p=0.4)", oddsDesc: "Transient: Drifts inevitably into the void", expectedValue: 0.333 },
      { id: "shrine-polya", x: -18, y: 2, z: -6, name: "Pólya's Recurrence Stele", oddsDesc: "In 1D and 2D: harmonic sum ∑ 1/n = ∞ diverges (recurrent). In 3D: Green function converges (transient)", expectedValue: 1.0 },
      { id: "shrine-kakutani", x: 18, y: 2, z: -6, name: "Kakutani's Drunk Bird Perch", oddsDesc: "A drunk man will find his way home, but a drunk bird in 3D has only ~34.05% return probability", expectedValue: 0.3405 },
      { id: "shrine-gamblers-ruin", x: 0, y: 2, z: -18, name: "Monolith of Absorbing Boundaries", oddsDesc: "With asymmetric p < 0.5, gambler's ruin gives an exponential hitting probability: P(ruin) = 1 - (p/q)^k", expectedValue: 0.0 },
    ],
    options: [
      { id: "opt-never", label: "In 1D, fair steps will almost surely drift away and never return to origin", isTrap: true, explanation: "False! Pólya proved 1D and 2D symmetric walks return to the starting position with probability 1." },
      { id: "opt-recurrent", label: "In 1D and 2D, the walk is recurrent (P(return) = 1); in 3D it is transient (P(return) ≈ 34%)", isTrap: false, explanation: "Correct! The green function sum diverges in dimensions 1 and 2, but converges in dimension 3." },
      { id: "opt-infinite", label: "Higher dimensions make it easier to return because there are more paths home", isTrap: true, explanation: "More paths also means vastly more volume to get lost in — volume grows exponentially like r^d." },
    ],
    correctOptionId: "opt-recurrent",
    theoryTakeaway: "1D and 2D symmetric random walks are recurrent; 3D space is transient.",
    targetTrials: 25,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: The Drifter's Illusion",
        objective: "Does taking fair random steps in 1D guarantee you will drift away into the void forever?",
        hint: "Because step variance grows as √N while drift is 0, the walk oscillates across the origin infinitely many times.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: 25 Walk Paths",
        objective: "Simulate 25 random walks along the suspended stone bridge. Record how many return to z=0.",
        hint: "Observe empirical recurrence: 100% of fair 1D walks visit the origin.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Pólya's Dimensional Leap",
        objective: "Lock in Pólya's theorem: 1D and 2D walks are recurrent (P=1); 3D walks are transient (P≈34%).",
        hint: "Select the Recurrent hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-step-pos", label: "+1 Step Forward", probDesc: "Fair coin step towards destination (p=0.5)", color: "#22c55e" },
      { id: "path-step-neg", label: "-1 Step Backward", probDesc: "Fair coin step towards origin (p=0.5)", color: "#ef4444" },
      { id: "path-origin", label: "Origin Recurrence", probDesc: "Return to origin z=0 (P=1.0 in 1D)", color: "#06b6d4" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 5: THE MARTINGALE LAVA RUN (STOPPING TIME & FINITE ASSETS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "martingale-lava-run",
    worldNumber: 5,
    title: "The Martingale Lava Run",
    subtitle: "Doubling Down & The Illusion of Guaranteed Profit",
    difficulty: "Advanced",
    concept: "Martingales & Optional Stopping Theorem",
    theorem: "Doob's Optional Stopping Theorem",
    trapTitle: "The Finite Bankroll Cliff",
    naiveTrap:
      "Believing that doubling your bet after every loss guarantees a profit of +1 because 'you must eventually win a flip.'",
    invariantProof:
      "Let X_t be your wealth. In a fair game, E[X_{t+1} | X_t] = X_t (Martingale). If bankroll is infinite, stopping time T = inf{t: win} has P(T < \\infty) = 1 and profit = +1. But in physical reality with bankroll B, a streak of k losses requires 2^k bet. With B = 63, k=6 losses incurs -63 ruin. The tiny probability (1/64) of catastrophic loss exactly cancels the frequent +1 gains: E[X_T] = 63/64*(+1) + 1/64*(-63) = 0.",
    formulaKatex: "E[X_T] = E[X_0] = 0 \\quad (\\text{when } |X_{t \\land T}| \\le M)",
    missionPrompt:
      "A path of gold pressure plates spans across bubbling lava. Step on a plate: flip a coin. If you lose, double your bet. Your pouch holds 64 gold chunks. Can you generate risk-free profit by doubling down? Run the simulation to watch the fatal 6-loss streak wipeout!",
    winConditionDesc: "Simulate 30 Martingale sessions and discover why E[Profit] remains exactly 0",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 1.5, 0],
    blocks: deduplicateBlocks([
      // Caldera Lava Sea (45x45 at y = -1)
      ...createFloor(-22, 22, -22, 22, -1, "lava"),

      // Safe Start Plaza around spawn [0, 2.15, 5] (x: -16..16, z: 2..22 at y = 0)
      ...createFloor(-16, 16, 2, 22, 0, "obsidian", "cobble", 4),
      ...createPillar(-3, 4, 1, 4, "obsidian", "obsidian"),
      ...createPillar(3, 4, 1, 4, "obsidian", "obsidian"),
      ...createPillar(-12, 12, 1, 5, "obsidian", "obsidian"),
      ...createPillar(12, 12, 1, 5, "obsidian", "obsidian"),

      // Rising Doubling-Down Staircase over Lava Lake
      { x: 0, y: 0, z: 1, type: "cobble", label: "Start Bet: 1 Gold" },
      { x: 0, y: 1, z: 0, type: "stone", label: "Bet 2 Gold" },
      { x: 0, y: 2, z: -2, type: "stone", label: "Bet 4 Gold" },
      { x: 0, y: 3, z: -4, type: "stone", label: "Bet 8 Gold" },
      { x: 0, y: 4, z: -6, type: "stone", label: "Bet 16 Gold" },
      { x: 0, y: 5, z: -8, type: "stone", label: "Bet 32 Gold (High Cliff!)" },

      // Goal Treasure Plateau (x: -6..6, z: -16..-10 at y = 6)
      ...createFloor(-6, 6, -16, -10, 6, "gold_ore", "obsidian", 2),

      // West Basalt Ridge: Doob's Inscription of Fair Games
      ...createFloor(-20, -12, 2, 10, 1, "obsidian", "cobble", 2),
      { x: -16, y: 1, z: 6, type: "obsidian" },
      { x: -16, y: 2, z: 6, type: "obsidian", label: "Doob's Inscription of Fair Games" },
      { x: -16, y: 3, z: 6, type: "redstone" },

      // East Volcanic Bastion: Altar of Finite Capital
      ...createFloor(12, 20, 2, 10, 1, "obsidian", "cobble", 2),
      { x: 16, y: 1, z: 6, type: "obsidian" },
      { x: 16, y: 2, z: 6, type: "gold_ore", label: "Altar of Finite Capital" },
      { x: 16, y: 3, z: 6, type: "redstone" },

      // High Magma Watchtower: Caldera Lookout
      ...createTower(0, -18, 3, 0, 6, "obsidian", "cobble", "redstone"),
      { x: 0, y: 7, z: -18, type: "redstone", label: "Caldera Lookout Tower" },

      // Basalt Rock Spires Rising from Lava
      ...createPillar(-8, -2, 0, 4, "obsidian", "cobble"),
      ...createPillar(8, -2, 0, 4, "obsidian", "cobble"),
      ...createPillar(-8, -8, 0, 5, "obsidian", "cobble"),
      ...createPillar(8, -8, 0, 5, "obsidian", "cobble"),
      ...createPillar(-15, -15, 0, 6, "obsidian", "cobble"),
      ...createPillar(15, -15, 0, 6, "obsidian", "cobble"),
    ]),
    interactiveTargets: [
      { id: "bet-single", x: 0, y: 0, z: 1, name: "Flat 1 Gold Bet", oddsDesc: "Fair 50/50 coin flip, EV = 0", expectedValue: 0 },
      { id: "bet-martingale", x: 0, y: 1, z: 0, name: "Martingale Doubling (1 -> 2 -> 4 -> 8)", oddsDesc: "Frequent +1 wins, rare total bankroll wipeout", expectedValue: 0 },
      { id: "shrine-doob", x: -16, y: 2, z: 6, name: "Doob's Inscription of Fair Games", oddsDesc: "No stopping rule τ can achieve E[X_τ] > E[X_0] under bounded capital. Martingales have zero drift", expectedValue: 0.0 },
      { id: "shrine-finite-capital", x: 16, y: 2, z: 6, name: "Altar of Finite Capital", oddsDesc: "With 63 gold bankroll, a streak of 6 losses (prob 1/64) wipes out 63 gold, canceling all 1-gold gains", expectedValue: 0.0 },
      { id: "perch-caldera", x: 0, y: 7, z: -18, name: "Caldera Lookout Tower", oddsDesc: "Doubling exponentially: 2^k blows past all mortal treasuries within 50 steps", expectedValue: 0.0 },
    ],
    options: [
      { id: "opt-guarantee", label: "Martingale is guaranteed profit because P(win eventually) = 1", isTrap: true, explanation: "Ignores the unbounded negative tail. Under any finite bankroll, total ruin cancels all small profits." },
      { id: "opt-doob", label: "Expected profit is identically 0: rare catastrophic loss perfectly balances frequent +1 gains", isTrap: false, explanation: "Correct! Doob's Optional Stopping Theorem proves no stopping rule can turn a zero-drift martingale profitable." },
      { id: "opt-hot-hand", label: "Coins develop memory after 4 tails and are more likely to land on heads", isTrap: true, explanation: "The classic Gambler's Fallacy: each coin flip remains strictly independent." },
    ],
    correctOptionId: "opt-doob",
    theoryTakeaway: "No stopping rule can create positive expectation from a zero-drift martingale under bounded capital.",
    targetTrials: 30,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: The Doubling-Down Myth",
        objective: "Does doubling your bet after each loss guarantee free profit since you 'must eventually win'?",
        hint: "A streak of 6 losses requires betting 1+2+4+8+16+32 = 63 gold. What happens if you bust?",
      },
      {
        stageNumber: 2,
        title: "The Experiment: Simulate 30 Doubling Sessions",
        objective: "Run 30 martingale sessions with a 64 gold bankroll. Watch for the rare catastrophic -63 wipeout.",
        hint: "The 1/64 chance of losing 63 gold perfectly offsets the 63/64 chance of winning 1 gold.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Doob's Optional Stopping Theorem",
        objective: "Deduce why E[Wealth_T] = E[Wealth_0] = 0: no stopping rule beats a fair martingale.",
        hint: "Select Doob's Optional Stopping hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-win-small", label: "+1 Gold Win", probDesc: "Frequent minor profit (63/64 chance = 98.4%)", color: "#22c55e" },
      { id: "path-loss-catastrophic", label: "Catastrophic Ruin (-63 Gold)", probDesc: "6 consecutive losses wipeout (1/64 chance = 1.56%)", color: "#ef4444" },
      { id: "path-expected", label: "Zero-Drift Martingale", probDesc: "Expected value E[X] = (63/64)(+1) + (1/64)(-63) = 0", color: "#06b6d4" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 6: THE MARKOV DUNGEON (TRANSITION MATRICES & STATIONARY STATE)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "markov-chain-dungeon",
    worldNumber: 6,
    title: "The Markov Chain Dungeon",
    subtitle: "Transition Matrices, Ergodicity & Stationary Eigenvectors",
    difficulty: "Advanced",
    concept: "Markov Chains & Stationary Distribution \\pi P = \\pi",
    theorem: "Perron-Frobenius Theorem for Ergodic Chains",
    trapTitle: "The Starting Room Bias",
    naiveTrap:
      "Thinking that after 100 steps, your location depends strongly on the room in which you started.",
    invariantProof:
      "For an irreducible, aperiodic Markov chain with transition matrix P, the n-step distribution converges exponentially fast to the unique stationary vector \\pi regardless of initial state \\mu_0: \\lim_{n \\to \\infty} \\mu_0 P^n = \\pi, where \\pi P = \\pi and \\sum \\pi_i = 1.",
    formulaKatex: "\\pi P = \\pi, \\quad \\pi_j = \\sum_{i} \\pi_i P_{ij}, \\quad \\sum_{i} \\pi_i = 1",
    missionPrompt:
      "A 4-room labyrinth: Forest (1), Desert (2), Tundra (3), Nether (4). The portals transition between rooms with fixed probabilities. Release 100 scout golems through the portals. Watch the room occupancy percentages settle into the stationary eigenvector!",
    winConditionDesc: "Observe 100 transitions converge to the stationary distribution within 2% margin",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 1.5, 0],
    blocks: deduplicateBlocks([
      // 4 Sprawling Quadrant Biomes Floor (45x45 at y = 0)
      ...Array.from({ length: 45 }, (_, x) =>
        Array.from({ length: 45 }, (_, z) => {
          const rx = x - 22
          const rz = z - 22
          let type: VoxelBlockType = "cobble"
          if (rx < 0 && rz < 0) type = "grass" // Forest (NW)
          else if (rx >= 0 && rz < 0) type = "dirt" // Desert (NE)
          else if (rx < 0 && rz >= 0) type = "glass" // Tundra (SW)
          else type = "obsidian" // Nether (SE)
          return { x: rx, y: 0, z: rz, type }
        })
      ).flat(),

      // Dividing Cross Walls separating the 4 chambers (y = 1 to 3)
      ...Array.from({ length: 45 }, (_, i) => {
        const coord = i - 22
        const blocks: VoxelCoord[] = []
        // Don't block doorway near center (rx = -2..2 or rz = -2..2)
        if (Math.abs(coord) > 2) {
          blocks.push({ x: coord, y: 1, z: 0, type: "stone" })
          blocks.push({ x: coord, y: 2, z: 0, type: "stone" })
          blocks.push({ x: 0, y: 1, z: coord, type: "stone" })
          blocks.push({ x: 0, y: 2, z: coord, type: "stone" })
        }
        return blocks
      }).flat(),

      // Forest Room Tree & Obelisks
      ...createPillar(-4, -4, 1, 3, "wood", "wood"),
      { x: -4, y: 4, z: -4, type: "glass" },
      ...createPillar(-10, -10, 1, 4, "wood", "wood"),

      // Desert Room Obelisks
      ...createPillar(4, -4, 1, 4, "stone", "stone"),
      ...createPillar(10, -10, 1, 5, "stone", "stone"),

      // Tundra Room Ice Spires
      ...createPillar(-4, 4, 1, 4, "glass", "glass"),
      ...createPillar(-10, 10, 1, 5, "glass", "glass"),

      // Nether Room Flame Spires
      ...createPillar(4, 4, 1, 3, "obsidian", "obsidian"),
      { x: 4, y: 4, z: 4, type: "redstone" },
      ...createPillar(10, 10, 1, 5, "obsidian", "obsidian"),

      // The 4 Transition Portals in each chamber
      { x: -3, y: 1, z: -3, type: "portal", label: "Forest Portal [Stay: 0.5, Desert: 0.3, Tundra: 0.2]" },
      { x: 3, y: 1, z: -3, type: "portal", label: "Desert Portal [Forest: 0.4, Stay: 0.2, Nether: 0.4]" },
      { x: -3, y: 1, z: 3, type: "portal", label: "Tundra Portal [Forest: 0.3, Nether: 0.7]" },
      { x: 3, y: 1, z: 3, type: "portal", label: "Nether Portal [Desert: 0.5, Tundra: 0.1, Stay: 0.4]" },

      // Northwest Deep Forest Grove: Perron-Frobenius Ancient Stele
      ...createWall(-18, -18, -14, -14, 1, 3, "cobble"),
      { x: -16, y: 1, z: -16, type: "stone" },
      { x: -16, y: 2, z: -16, type: "grass", label: "Perron-Frobenius Ancient Stele" },
      { x: -16, y: 3, z: -16, type: "redstone" },

      // Southeast Nether Vault: Ergodic Horizon Monument
      ...createWall(14, 14, 18, 18, 1, 3, "obsidian"),
      { x: 16, y: 1, z: 16, type: "obsidian" },
      { x: 16, y: 2, z: 16, type: "redstone", label: "Ergodic Horizon Monument" },
      { x: 16, y: 3, z: 16, type: "redstone" },

      // North Labyrinth Ramparts & Master Perch
      ...createStairs(0, -14, 1, 5, 0, -1, "stone"),
      ...createWall(-6, -21, 6, -19, 4, 4, "stone"),
      { x: 0, y: 5, z: -20, type: "stone", label: "Labyrinth Master Perch" },
      { x: 0, y: 6, z: -20, type: "redstone" },
    ]),
    interactiveTargets: [
      { id: "quad-forest", x: -3, y: 1, z: -3, name: "Forest Biome", oddsDesc: "Stationary mass: ~31.8%", expectedValue: 0.318 },
      { id: "quad-desert", x: 3, y: 1, z: -3, name: "Desert Biome", oddsDesc: "Stationary mass: ~27.3%", expectedValue: 0.273 },
      { id: "quad-tundra", x: -3, y: 1, z: 3, name: "Tundra Biome", oddsDesc: "Stationary mass: ~15.9%", expectedValue: 0.159 },
      { id: "quad-nether", x: 3, y: 1, z: 3, name: "Nether Biome", oddsDesc: "Stationary mass: ~25.0%", expectedValue: 0.250 },
      { id: "shrine-perron-frobenius", x: -16, y: 2, z: -16, name: "Perron-Frobenius Ancient Stele", oddsDesc: "Stationary vector π = [0.318, 0.273, 0.159, 0.250] is the unique leading eigenvector with λ = 1", expectedValue: 1.0 },
      { id: "shrine-ergodic-horizon", x: 16, y: 2, z: 16, name: "Ergodic Horizon Monument", oddsDesc: "Irreducible and aperiodic: memory of initial starting room decays exponentially as |λ₂|^n", expectedValue: 1.0 },
      { id: "perch-markov", x: 0, y: 5, z: -20, name: "Labyrinth Master Perch", oddsDesc: "High perch surveying all four biome transitions and equilibrium flow", expectedValue: 1.0 },
    ],
    options: [
      { id: "opt-initial-bias", label: "Starting in the Nether guarantees you will spend most time in the Nether", isTrap: true, explanation: "Initial conditions decay exponentially. The stationary state is independent of where you start." },
      { id: "opt-stationary", label: "Room occupancy converges to the stationary vector π where πP = π regardless of start", isTrap: false, explanation: "Correct! The Perron-Frobenius theorem guarantees unique stationary convergence for ergodic chains." },
      { id: "opt-uniform", label: "Because all 4 rooms are connected, each room will hold exactly 25% occupancy", isTrap: true, explanation: "Only symmetric double-stochastic matrices yield uniform distributions. Asymmetric transition rates skew stationary weights." },
    ],
    correctOptionId: "opt-stationary",
    theoryTakeaway: "In ergodic Markov systems, long-term state occupancy converges to the eigenvector πP = π.",
    targetTrials: 100,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: The Starting Room Bias",
        objective: "If you begin in the Nether chamber, does your 100-step trajectory remain biased towards Nether?",
        hint: "Transitions depend only on current state, not origin history. Initial distribution forgets its start.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: 100 Transition Steps",
        objective: "Step through the portals 100 times. Observe how room occupancies settle into equilibrium.",
        hint: "Watch Forest converge to ~31.8%, Desert to ~27.3%, Tundra to ~15.9%, and Nether to ~25.0%.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Perron-Frobenius Eigenvector",
        objective: "Deduce why long-term state occupancy satisfies πP = π regardless of initial position.",
        hint: "Select the Stationary Vector hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-forest", label: "Forest Biome (π₁ = 31.8%)", probDesc: "Highest stationary probability room", color: "#22c55e" },
      { id: "path-desert", label: "Desert Biome (π₂ = 27.3%)", probDesc: "Second most visited biome", color: "#eab308" },
      { id: "path-nether", label: "Nether Biome (π₄ = 25.0%)", probDesc: "High connectivity portal room", color: "#ef4444" },
      { id: "path-tundra", label: "Tundra Biome (π₃ = 15.9%)", probDesc: "Transient low-probability outpost", color: "#06b6d4" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 7: THE POISSON CREEPER SPINDLE (MEMORYLESS ARRIVALS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "poisson-spawner-rhythm",
    worldNumber: 7,
    title: "The Poisson Spawner Rhythm",
    subtitle: "Continuous Arrival Rates & The Exponential Memoryless Trap",
    difficulty: "Elite",
    concept: "Poisson Processes & Exponential Inter-arrival Times",
    theorem: "The Memoryless Property of Exponential Distributions",
    trapTitle: "The 'It Is Overdue' Fallacy",
    naiveTrap:
      "Believing that if no creeper has spawned for 50 seconds, a creeper is 'due any second now.'",
    invariantProof:
      "A Poisson process with rate \\lambda has independent increments. The waiting time T until the next arrival follows Exponential(\\lambda). The memoryless property states: P(T > s + t \\mid T > s) = P(T > t). Having waited 50 seconds with zero spawns provides ZERO information about the remaining time until the next spawn.",
    formulaKatex: "P(T > s + t \\mid T > s) = \\frac{e^{-\\lambda(s+t)}}{e^{-\\lambda s}} = e^{-\\lambda t} = P(T > t)",
    missionPrompt:
      "In the mob dungeon, a cage spawner clicks with rate λ = 2 spawns per minute. 50 seconds have elapsed with total silence. Does the spawner have a higher probability of popping in the next 10 seconds than it did right at the beginning? Measure 15 arrivals!",
    winConditionDesc: "Record 15 inter-arrival intervals and observe the memoryless histogram shape",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 1.5, 0],
    blocks: deduplicateBlocks([
      // Sprawling Stone Dungeon Floor (45x45 at y = 0)
      ...createFloor(-22, 22, -22, 22, 0, "cobble", "stone", 4),

      // Outer Catacomb Walls
      ...createWall(-22, -22, 22, -22, 1, 4, "stone"),
      ...createWall(-22, 22, 22, 22, 1, 3, "stone"),
      ...createWall(-22, -22, -22, 22, 1, 4, "stone"),
      ...createWall(22, -22, 22, 22, 1, 4, "stone"),

      // 8 Massive Dungeon Buttress Pillars & Overhead Vault Beams
      ...createPillar(-6, -6, 1, 5, "stone", "cobble"),
      ...createPillar(6, -6, 1, 5, "stone", "cobble"),
      ...createPillar(-6, 6, 1, 5, "stone", "cobble"),
      ...createPillar(6, 6, 1, 5, "stone", "cobble"),
      ...createBeam(-6, 5, -6, 6, -6, "stone"),
      ...createBeam(-6, 5, 6, 6, 6, "stone"),
      ...createBeam(-6, 5, -6, -6, 6, "stone"),
      ...createBeam(6, 5, -6, 6, 6, "stone"),

      // Raised Spawner Dais in Center (5x5 Stone at y = 1)
      ...createFloor(-2, 2, -2, 2, 1, "stone"),
      { x: 0, y: 2, z: 0, type: "dice_block", label: "Creeper Spawner (λ=2/min)" },
      { x: 0, y: 3, z: 0, type: "redstone" },
      { x: -1, y: 2, z: 0, type: "glass" },
      { x: 1, y: 2, z: 0, type: "glass" },
      { x: 0, y: 2, z: -1, type: "glass" },
      { x: 0, y: 2, z: 1, type: "glass" },

      // Concentric Timing Indicator Rings on Floor
      { x: -3, y: 0, z: 0, type: "diamond_ore", label: "15s Horizon Ring" },
      { x: 3, y: 0, z: 0, type: "diamond_ore" },
      { x: 0, y: 0, z: -3, type: "diamond_ore" },
      { x: 0, y: 0, z: 3, type: "diamond_ore" },
      { x: -5, y: 0, z: 0, type: "gold_ore", label: "30s Mean Ring" },
      { x: 5, y: 0, z: 0, type: "gold_ore" },
      { x: 0, y: 0, z: -5, type: "gold_ore" },
      { x: 0, y: 0, z: 5, type: "gold_ore" },

      // West Crypt Wing: Stele of the Invariant Hazard Rate
      ...createCorridor("x", -4, -6, -18, 2, 1, 3, "stone"),
      ...createWall(-20, -8, -14, 0, 1, 3, "cobble"),
      { x: -17, y: 1, z: -4, type: "stone" },
      { x: -17, y: 2, z: -4, type: "diamond_ore", label: "Stele of the Invariant Hazard Rate" },
      { x: -17, y: 3, z: -4, type: "redstone" },

      // East Crypt Wing: Altar of the Exponential Tail
      ...createCorridor("x", -4, 6, 18, 2, 1, 3, "stone"),
      ...createWall(14, -8, 20, 0, 1, 3, "cobble"),
      { x: 17, y: 1, z: -4, type: "stone" },
      { x: 17, y: 2, z: -4, type: "gold_ore", label: "Altar of the Exponential Tail" },
      { x: 17, y: 3, z: -4, type: "redstone" },

      // North Catacomb Belfry
      ...createStairs(0, -6, 1, 6, 0, -2, "stone"),
      ...createWall(-4, -19, 4, -15, 5, 5, "stone"),
      { x: 0, y: 6, z: -17, type: "dice_block", label: "Belfry of Poisson Arrivals" },
      { x: 0, y: 7, z: -17, type: "redstone" },

      // South Cloister Altar
      { x: 0, y: 1, z: 8, type: "stone" },
      { x: 0, y: 2, z: 8, type: "redstone", label: "Altar of Independent Increments" },
    ]),
    interactiveTargets: [
      { id: "target-spawner", x: 0, y: 2, z: 0, name: "Mystic Spawner Cage", oddsDesc: "Memoryless Exponential rate λ = 2/min (Mean wait = 30s)", expectedValue: 30 },
      { id: "shrine-hazard-rate", x: -17, y: 2, z: -4, name: "Stele of the Invariant Hazard Rate", oddsDesc: "Memoryless: P(T > s + t | T > s) = P(T > t). Constant hazard rate h(t) = λ means zero accumulated fatigue", expectedValue: 30 },
      { id: "shrine-exponential-tail", x: 17, y: 2, z: -4, name: "Altar of the Exponential Tail", oddsDesc: "Waiting 50s with zero spawns leaves remaining expected wait at exactly 30s — identical to t = 0", expectedValue: 30 },
      { id: "perch-poisson-belfry", x: 0, y: 6, z: -17, name: "Belfry of Poisson Arrivals", oddsDesc: "Disjoint time windows are statistically independent: arrivals follow Poisson(λΔt)", expectedValue: 2.0 },
      { id: "altar-poisson-prior", x: 0, y: 2, z: 8, name: "Altar of Independent Increments", oddsDesc: "Events in non-overlapping intervals are mutually independent random variables", expectedValue: 1.0 },
    ],
    options: [
      { id: "opt-overdue", label: "Yes, waiting 50s charges the spawner, making an immediate spawn much more likely", isTrap: true, explanation: "Fails to grasp memorylessness. Radioactive decay and Poisson processes have zero internal clock or fatigue." },
      { id: "opt-memoryless", label: "No: P(T > 60 | T > 50) = P(T > 10). The remaining wait distribution is identical to new", isTrap: false, explanation: "Correct! The exponential distribution is the ONLY continuous probability distribution with zero memory." },
      { id: "opt-periodic", label: "Spawns are strictly periodic: exactly one every 30 seconds", isTrap: true, explanation: "Poisson processes are stochastic, not deterministic clocks. Inter-arrival times have variance equal to (1/λ)^2." },
    ],
    correctOptionId: "opt-memoryless",
    theoryTakeaway: "Memoryless Poisson events do not become 'due'; the probability of an arrival in the next second is invariant.",
    targetTrials: 15,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: The 'It Is Overdue' Fallacy",
        objective: "50 seconds have passed with 0 mob spawns. Is a spawn overdue and more likely in the next 10 seconds?",
        hint: "Does a radioactive atom know how long it has existed? The hazard rate λ remains strictly constant.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: Measure 15 Inter-arrival Times",
        objective: "Click the spawner to record 15 stochastic arrival intervals Δt. Observe the exponential distribution shape.",
        hint: "Waiting times cluster near 0 with a long flat tail — memorylessness in action.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: The Memoryless Invariant",
        objective: "Deduce why P(T > s + t | T > s) = P(T > t): elapsed waiting time confers zero predictive advantage.",
        hint: "Select the Memoryless hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-short-wait", label: "Immediate Spawn (Δt < 15s)", probDesc: "High-density burst arrivals (P ≈ 39.3%)", color: "#22c55e" },
      { id: "path-avg-wait", label: "Typical Spawn (15s ≤ Δt ≤ 45s)", probDesc: "Centering around mean wait μ = 30s", color: "#eab308" },
      { id: "path-long-wait", label: "Prolonged Silence (Δt > 45s)", probDesc: "Exponential tail — still zero memory accumulated", color: "#06b6d4" },
    ],
  },

  // ──────────────────────────────────────────────────────────────────────────
  // WORLD 8: THE SHANNON ENTROPY MINE (INFORMATION & SEARCH BOUNDS)
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "shannon-entropy-vault",
    worldNumber: 8,
    title: "The Shannon Entropy Vault",
    subtitle: "Information Bounds, Binary Halving & Optimal Partitioning",
    difficulty: "Master",
    concept: "Shannon Entropy H(X) & The Information-Theoretic Lower Bound",
    theorem: "Shannon Source Coding Theorem & Halving Bounds",
    trapTitle: "Linear Luck vs Information Maximization",
    naiveTrap:
      "Guessing single blocks randomly rather than querying half-spaces to maximize bit-entropy extracted per query.",
    invariantProof:
      "A hidden core is uniformly distributed among 16 voxel blocks. Initial uncertainty is H(X) = -\\sum_{i=1}^{16} (1/16) \\log_2 (1/16) = \\log_2 16 = 4 bits. Each binary sonar query that splits candidates into two equal halves (8 vs 8) provides I(X; Y) = H(Y) = 1 full bit of mutual information. In exactly \\lceil \\log_2 16 \\rceil = 4 queries, entropy drops to 0 bits. Point queries extract far less expected information: only -(15/16 log2 15/16 + 1/16 log2 1/16) ≈ 0.337 bits.",
    formulaKatex: "H(X) = -\\sum_{i=1}^n P(x_i) \\log_2 P(x_i) = \\log_2 16 = 4 \\text{ bits}",
    missionPrompt:
      "A pure Netherite-Diamond core is buried beneath one of 16 bedrock blocks. You have an acoustic sonar pulse. Test single blocks (extracting ~0.34 bits/query, average 8.5 queries) versus binary partition pulses (extracting 1.0 bit/query, guaranteed 4 queries). Prove Shannon's 4-bit bound!",
    winConditionDesc: "Locate the hidden diamond in exactly 4 binary tests across 5 consecutive rounds",
    playerSpawn: [0, 2.15, 5],
    cameraLookAt: [0, 1.5, 0],
    blocks: deduplicateBlocks([
      // Solid Obsidian Vault Floor (45x45 at y = 0)
      ...createFloor(-22, 22, -22, 22, 0, "obsidian", "stone", 4),

      // Outer High-Tech Security Walls (y = 1 to 4)
      ...createWall(-22, -22, 22, -22, 1, 4, "obsidian"),
      ...createWall(-22, 22, 22, 22, 1, 3, "obsidian"),
      ...createWall(-22, -22, -22, 22, 1, 4, "obsidian"),
      ...createWall(22, -22, 22, 22, 1, 4, "obsidian"),

      // 4 High-Tech Data Pillars with Redstone Beacons
      ...createTower(-18, -18, 3, 1, 7, "obsidian", "stone", "redstone"),
      ...createTower(18, -18, 3, 1, 7, "obsidian", "stone", "redstone"),
      ...createTower(-18, 18, 3, 1, 5, "obsidian", "stone"),
      ...createTower(18, 18, 3, 1, 5, "obsidian", "stone"),

      // Raised Dais for 4x4 Bedrock Matrix (9x9 Obsidian at y = 1)
      ...createFloor(-4, 4, -4, 4, 1, "obsidian"),

      // 4x4 Bedrock Vault Grid on dais at y = 2
      ...Array.from({ length: 4 }, (_, gx) =>
        Array.from({ length: 4 }, (_, gz) => ({
          x: (gx - 1.5) * 1.8,
          y: 2,
          z: (gz - 1.5) * 1.8,
          type: "bedrock" as VoxelBlockType,
          label: `Vault Block #${gx * 4 + gz + 1}`,
        }))
      ).flat(),

      // Glowing Glass Partition Wall physically splitting candidates 8 vs 8 along x = 0
      ...Array.from({ length: 7 }, (_, i) => ({
        x: 0,
        y: 2,
        z: i - 3,
        type: "glass" as VoxelBlockType,
        label: "Shannon Half-Space Divider [8 vs 8 Split]",
      })),
      ...Array.from({ length: 7 }, (_, i) => ({
        x: 0,
        y: 3,
        z: i - 3,
        type: "glass" as VoxelBlockType,
      })),

      // Overhead Scanner Bridge at y = 5
      ...createBeam(-4, 5, 0, 4, 0, "stone"),
      { x: 0, y: 4, z: 0, type: "diamond_ore", label: "Acoustic Sonar Emitter" },

      // West Exploration Wing: Shannon's Halving Monument
      ...createCorridor("x", 4, -4, -18, 2, 1, 3, "obsidian"),
      ...createWall(-20, 0, -14, 8, 1, 4, "obsidian"),
      { x: -17, y: 1, z: 4, type: "obsidian" },
      { x: -17, y: 2, z: 4, type: "diamond_ore", label: "Shannon's Halving Monument" },
      { x: -17, y: 3, z: 4, type: "redstone" },

      // East Exploration Wing: Altar of the Information Bound
      ...createCorridor("x", 4, 4, 18, 2, 1, 3, "obsidian"),
      ...createWall(14, 0, 20, 8, 1, 4, "obsidian"),
      { x: 17, y: 1, z: 4, type: "obsidian" },
      { x: 17, y: 2, z: 4, type: "redstone", label: "Altar of the Information Bound" },
      { x: 17, y: 3, z: 4, type: "redstone" },

      // North High Sonar Gantry & Inspection Platform
      ...createStairs(0, -6, 1, 6, 0, -2, "obsidian"),
      ...createWall(-6, -19, 6, -15, 5, 5, "obsidian"),
      { x: 0, y: 6, z: -17, type: "diamond_ore", label: "High Sonar Inspection Gantry" },
      { x: 0, y: 7, z: -17, type: "redstone" },
    ]),
    interactiveTargets: [
      ...Array.from({ length: 16 }, (_, i) => ({
        id: `block-${i + 1}`,
        x: ((i % 4) - 1.5) * 1.8,
        y: 2,
        z: (Math.floor(i / 4) - 1.5) * 1.8,
        name: `Vault Cell #${i + 1}`,
        oddsDesc: "Uniform 1/16 prior probability (H = 4 bits)",
        expectedValue: 0.0625,
      })),
      { id: "shrine-shannon-halving", x: -17, y: 2, z: 4, name: "Shannon's Halving Monument", oddsDesc: "H(X) = 4 bits. Splitting candidates 50/50 yields exactly 1 full bit of mutual information per test", expectedValue: 4.0 },
      { id: "shrine-entropy-bound", x: 17, y: 2, z: 4, name: "Altar of the Information Bound", oddsDesc: "Source coding theorem: no binary search can guarantee fewer than ⌈log2(N)⌉ tests in the worst case", expectedValue: 1.0 },
      { id: "perch-sonar-gantry", x: 0, y: 6, z: -17, name: "High Sonar Inspection Gantry", oddsDesc: "Overlooks the 8 vs 8 laser division plane: 4 binary halvings collapse 16 candidates to 1", expectedValue: 1.0 },
    ],
    options: [
      { id: "opt-guess", label: "Guessing blocks individually has a chance to find it on try 1, so it's a faster strategy", isTrap: true, explanation: "High variance trap: expected tries is (1+16)/2 = 8.5 queries, more than double the Shannon optimal 4 queries." },
      { id: "opt-entropy", label: "Binary half-partitioning guarantees the diamond in exactly ceil(log2 16) = 4 queries by extracting 1 full bit per query", isTrap: false, explanation: "Correct! Shannon entropy H = 4 bits. Splitting candidates 50/50 maximizes mutual information." },
      { id: "opt-random-sonar", label: "Querying random 3-block clusters extracts more information than 8-block halves", isTrap: true, explanation: "Entropy of a binary query is maximized at p=0.5 (1.0 bit). A 3/16 split yields only ~0.696 bits of information." },
    ],
    correctOptionId: "opt-entropy",
    theoryTakeaway: "Optimal search partitions the hypothesis space into equal halves, extracting 1 bit of Shannon information per test.",
    targetTrials: 5,
    questStages: [
      {
        stageNumber: 1,
        title: "The Trap: Point Guessing vs Shannon Halving",
        objective: "A diamond is hidden in 1 of 16 blocks. Point queries average 8.5 tries. Can we guarantee 4 tries?",
        hint: "A query that splits candidates 50/50 maximizes Shannon mutual information I(X;Y) = 1.0 bit.",
      },
      {
        stageNumber: 2,
        title: "The Experiment: 4-Query Binary Halving",
        objective: "Execute binary half-space queries. Each pulse halves the candidates: 16 -> 8 -> 4 -> 2 -> 1.",
        hint: "Notice the glass laser wall dividing the 16 cells into two groups of 8.",
      },
      {
        stageNumber: 3,
        title: "The Invariant: Shannon's Fundamental Lower Bound",
        objective: "Deduce why H(X) = log2(16) = 4 bits: optimal search extracts exactly 1 bit per query.",
        hint: "Select the Shannon Entropy hypothesis card below.",
      },
    ],
    microstatePaths: [
      { id: "path-query-1", label: "Query 1: 16 → 8 Cells", probDesc: "1.0 bit extracted (3.0 bits uncertainty left)", color: "#06b6d4" },
      { id: "path-query-2", label: "Query 2: 8 → 4 Cells", probDesc: "1.0 bit extracted (2.0 bits uncertainty left)", color: "#06b6d4" },
      { id: "path-query-3", label: "Query 3: 4 → 2 Cells", probDesc: "1.0 bit extracted (1.0 bit uncertainty left)", color: "#06b6d4" },
      { id: "path-query-4", label: "Query 4: Diamond Found!", probDesc: "1.0 bit extracted (0.0 bits uncertainty left — solved!)", color: "#22c55e" },
    ],
  },
]
