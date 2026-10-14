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
// Procedural Architectural Voxel Builders
// ────────────────────────────────────────────────────────────────────

function createFloor(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  y = 0,
  defaultType: VoxelBlockType = "cobble",
  accentType?: VoxelBlockType
): VoxelCoord[] {
  const blocks: VoxelCoord[] = []
  for (let x = minX; x <= maxX; x++) {
    for (let z = minZ; z <= maxZ; z++) {
      const isAccent = accentType && (Math.abs(x) === Math.abs(z) || x === 0 || z === 0)
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
    blocks: [
      // Floor (19x19 cobblestone and stone)
      ...createFloor(-9, 9, -9, 9, 0, "cobble", "stone"),
      // 4 Gothic Corner Pillars
      ...createPillar(-6, -4, 1, 5, "stone", "cobble"),
      ...createPillar(6, -4, 1, 5, "stone", "cobble"),
      ...createPillar(-6, 6, 1, 5, "stone", "cobble"),
      ...createPillar(6, 6, 1, 5, "stone", "cobble"),
      // Torches on pillar tops
      { x: -6, y: 6, z: -4, type: "redstone" },
      { x: 6, y: 6, z: -4, type: "redstone" },
      { x: -6, y: 6, z: 6, type: "redstone" },
      { x: 6, y: 6, z: 6, type: "redstone" },
      // Overhead Wooden Crossbeams
      ...createBeam(-6, 5, -4, 6, -4, "wood"),
      ...createBeam(-6, 5, 6, 6, 6, "wood"),
      ...createBeam(-6, 5, -4, -6, 6, "wood"),
      ...createBeam(6, 5, -4, 6, 6, "wood"),
      // Back Crypt Wall
      ...createWall(-8, -5, 8, -5, 1, 4, "stone"),
      // Decorative Arch Framing Vaults
      { x: -4, y: 3, z: -4, type: "cobble" },
      { x: -2, y: 3, z: -4, type: "cobble" },
      { x: -1, y: 3, z: -4, type: "cobble" },
      { x: 1, y: 3, z: -4, type: "cobble" },
      { x: 2, y: 3, z: -4, type: "cobble" },
      { x: 4, y: 3, z: -4, type: "cobble" },
      // Vault Pedestals & Chests
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
    ],
    interactiveTargets: [
      { id: "vault-a", x: -3, y: 2, z: 0, name: "Vault A (Gold + Gold)", oddsDesc: "2 Gold Coins (Paths G1 & G2 — 2/3 of all gold)", expectedValue: 2 },
      { id: "vault-b", x: 0, y: 2, z: 0, name: "Vault B (Coal + Coal)", oddsDesc: "2 Coal Coins (Eliminated by observing Gold)", expectedValue: 0 },
      { id: "vault-c", x: 3, y: 2, z: 0, name: "Vault C (Gold + Coal)", oddsDesc: "1 Gold Coin (Path G3 — 1/3 of all gold)", expectedValue: 1 },
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
    blocks: [
      // Subterranean Mine Floor (19x19 stone and cobble)
      ...createFloor(-9, 9, -9, 9, 0, "stone", "cobble"),
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
      ...Array.from({ length: 13 }, (_, i) => {
        const x = i - 6
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
      // Lanterns on Scaffolding
      { x: -6, y: 3, z: -3, type: "redstone" },
      { x: 6, y: 3, z: -3, type: "redstone" },
    ],
    interactiveTargets: [
      { id: "pick-iron", x: -3, y: 2, z: 2, name: "Steady Iron Pick", oddsDesc: "100% chance of 1 gold chunk (EV = 1.0)", expectedValue: 1.0 },
      { id: "pick-diamond", x: 0, y: 2, z: 2, name: "Lucky Diamond Pick", oddsDesc: "10% chance of 14 gold, 90% chance of 0 (EV = 1.4)", expectedValue: 1.4 },
      { id: "pick-cursed", x: 3, y: 2, z: 2, name: "Cursed Nether Pick", oddsDesc: "1% chance of 80 gold, 99% chance of 0 (EV = 0.8)", expectedValue: 0.8 },
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
    blocks: [
      // Floor (19x19 Obsidian with Redstone Borders)
      ...createFloor(-9, 9, -9, 9, 0, "obsidian", "redstone"),
      // Lava Moat Channels on Left and Right sides
      ...createWall(-8, -6, -7, 6, 0, 0, "lava"),
      ...createWall(7, -6, 8, 6, 0, 0, "lava"),
      // Lava Protective Stone Railings
      ...createWall(-6, -6, -6, 6, 1, 1, "cobble"),
      ...createWall(6, -6, 6, 6, 1, 1, "cobble"),
      // Portal 1 (Left: Obsidian Frame 4 wide, 5 high)
      ...createPillar(-5, -2, 1, 5, "obsidian", "obsidian"),
      ...createPillar(-2, -2, 1, 5, "obsidian", "obsidian"),
      { x: -4, y: 5, z: -2, type: "obsidian" },
      { x: -3, y: 5, z: -2, type: "obsidian" },
      { x: -4, y: 1, z: -2, type: "obsidian" },
      { x: -3, y: 1, z: -2, type: "obsidian" },
      // Portal 1 Vortex Blocks
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
      // Portal 2 Vortex Blocks
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
      // Portal 3 Vortex Blocks (Revealed Sheep Void)
      { x: 4, y: 2, z: -2, type: "portal", label: "Portal 3 (Revealed Sheep)" },
      { x: 5, y: 2, z: -2, type: "portal" },
      { x: 4, y: 3, z: -2, type: "portal" },
      { x: 5, y: 3, z: -2, type: "portal" },
      { x: 4, y: 4, z: -2, type: "portal" },
      { x: 5, y: 4, z: -2, type: "portal" },

      // Host Podium in Front
      { x: 0, y: 1, z: 2, type: "obsidian" },
      { x: 0, y: 2, z: 2, type: "redstone", label: "Host Altar" },
      // Citadel Battlements in Background
      ...createWall(-8, -6, 8, -6, 1, 4, "obsidian"),
    ],
    interactiveTargets: [
      { id: "portal-1", x: -4, y: 2, z: -2, name: "Portal 1 (Initial Choice)", oddsDesc: "Keeps initial 1/3 prior probability", expectedValue: 0.333 },
      { id: "portal-2", x: 0, y: 2, z: -2, name: "Portal 2 (Switch Alternative)", oddsDesc: "Absorbs 2/3 probability mass from host filter", expectedValue: 0.667 },
      { id: "portal-3", x: 4, y: 2, z: -2, name: "Portal 3 (Revealed Sheep)", oddsDesc: "Known goat (0% win probability)", expectedValue: 0 },
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
    blocks: [
      // Safe Spawn Temple Island (9x9 cobblestone and stone at y=0)
      ...createFloor(-4, 4, 1, 9, 0, "cobble", "stone"),
      // 4 Temple Pillars on Spawn Island
      ...createPillar(-3, 3, 1, 4, "stone", "obsidian"),
      ...createPillar(3, 3, 1, 4, "stone", "obsidian"),
      ...createPillar(-3, 7, 1, 4, "stone", "obsidian"),
      ...createPillar(3, 7, 1, 4, "stone", "obsidian"),
      // Torches on temple pillars
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
      // Floating Destination Gold Island (9x9 gold and obsidian at y=0)
      ...createFloor(-4, 4, -18, -11, 0, "gold_ore", "obsidian"),
      // Destination Temple Pillars
      ...createPillar(-3, -13, 1, 4, "obsidian", "gold_ore"),
      ...createPillar(3, -13, 1, 4, "obsidian", "gold_ore"),
      // Floating Stepping Stone Archipelagos in the Void
      { x: -5, y: 0, z: -4, type: "cobble" },
      { x: -6, y: 0, z: -5, type: "stone" },
      { x: 5, y: 0, z: -4, type: "cobble" },
      { x: 6, y: 0, z: -5, type: "stone" },
    ],
    interactiveTargets: [
      { id: "walk-fair", x: 0, y: 0, z: 0, name: "Fair Walk (p=0.5)", oddsDesc: "Recurrent: Expected visits to origin is infinite (P=1.0)", expectedValue: 1.0 },
      { id: "walk-biased", x: 0, y: 0, z: -4, name: "Adverse Wind (p=0.4)", oddsDesc: "Transient: Drifts inevitably into the void", expectedValue: 0.333 },
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
    blocks: [
      // Safe Start Plaza (7x7 Obsidian at y=0, z=2 to 8)
      ...createFloor(-3, 3, 2, 8, 0, "obsidian", "cobble"),
      // Obsidian Guard Pillars at Spawn
      ...createPillar(-3, 4, 1, 4, "obsidian", "obsidian"),
      ...createPillar(3, 4, 1, 4, "obsidian", "obsidian"),
      // Rising Doubling-Down Staircase over Lava Lake
      { x: 0, y: 0, z: 1, type: "cobble", label: "Start Bet: 1 Gold" },
      { x: 0, y: 1, z: 0, type: "stone", label: "Bet 2 Gold" },
      { x: 0, y: 2, z: -2, type: "stone", label: "Bet 4 Gold" },
      { x: 0, y: 3, z: -4, type: "stone", label: "Bet 8 Gold" },
      { x: 0, y: 4, z: -6, type: "stone", label: "Bet 16 Gold" },
      { x: 0, y: 5, z: -8, type: "stone", label: "Bet 32 Gold (High Cliff!)" },
      // Goal Treasure Plateau (7x7 Gold Ore at y=6, z=-15 to -9)
      ...createFloor(-3, 3, -15, -9, 6, "gold_ore", "obsidian"),
      // Surrounding Caldera Lava Lake (21x21 at y=-1)
      ...createFloor(-10, 10, -16, 8, -1, "lava"),
      // Basalt Rock Spires Rising from Lava
      ...createPillar(-6, -2, 0, 4, "obsidian", "cobble"),
      ...createPillar(6, -2, 0, 4, "obsidian", "cobble"),
      ...createPillar(-6, -8, 0, 5, "obsidian", "cobble"),
      ...createPillar(6, -8, 0, 5, "obsidian", "cobble"),
    ],
    interactiveTargets: [
      { id: "bet-single", x: 0, y: 0, z: 1, name: "Flat 1 Gold Bet", oddsDesc: "Fair 50/50 coin flip, EV = 0", expectedValue: 0 },
      { id: "bet-martingale", x: 0, y: 1, z: 0, name: "Martingale Doubling (1 -> 2 -> 4 -> 8)", oddsDesc: "Frequent +1 wins, rare total bankroll wipeout", expectedValue: 0 },
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
    blocks: [
      // 4 Quadrant Biomes Floor (19x19 at y=0)
      ...Array.from({ length: 19 }, (_, x) =>
        Array.from({ length: 19 }, (_, z) => {
          const rx = x - 9
          const rz = z - 9
          let type: VoxelBlockType = "cobble"
          if (rx < 0 && rz < 0) type = "grass" // Forest (NW)
          else if (rx >= 0 && rz < 0) type = "dirt" // Desert (NE)
          else if (rx < 0 && rz >= 0) type = "glass" // Tundra (SW)
          else type = "obsidian" // Nether (SE)
          return { x: rx, y: 0, z: rz, type }
        })
      ).flat(),
      // Stone Dividing Cross Walls separating the 4 chambers (y=1 to 3)
      ...Array.from({ length: 19 }, (_, i) => {
        const coord = i - 9
        const blocks: VoxelCoord[] = []
        // Don't block doorway near center (rx = -1..1 or rz = -1..1)
        if (Math.abs(coord) > 1) {
          blocks.push({ x: coord, y: 1, z: 0, type: "stone" })
          blocks.push({ x: coord, y: 2, z: 0, type: "stone" })
          blocks.push({ x: 0, y: 1, z: coord, type: "stone" })
          blocks.push({ x: 0, y: 2, z: coord, type: "stone" })
        }
        return blocks
      }).flat(),
      // Forest Room Tree at (-4, -4)
      ...createPillar(-4, -4, 1, 3, "wood", "wood"),
      { x: -4, y: 4, z: -4, type: "glass" },
      // Desert Room Obelisk at (4, -4)
      ...createPillar(4, -4, 1, 4, "stone", "stone"),
      // Tundra Room Ice Spire at (-4, 4)
      ...createPillar(-4, 4, 1, 4, "glass", "glass"),
      // Nether Room Flame Spire at (4, 4)
      ...createPillar(4, 4, 1, 3, "obsidian", "obsidian"),
      { x: 4, y: 4, z: 4, type: "redstone" },
      // Interactive Transition Portals in each chamber
      { x: -3, y: 1, z: -3, type: "portal", label: "Forest Portal [Stay: 0.5, Desert: 0.3, Tundra: 0.2]" },
      { x: 3, y: 1, z: -3, type: "portal", label: "Desert Portal [Forest: 0.4, Stay: 0.2, Nether: 0.4]" },
      { x: -3, y: 1, z: 3, type: "portal", label: "Tundra Portal [Forest: 0.3, Nether: 0.7]" },
      { x: 3, y: 1, z: 3, type: "portal", label: "Nether Portal [Desert: 0.5, Tundra: 0.1, Stay: 0.4]" },
    ],
    interactiveTargets: [
      { id: "quad-forest", x: -3, y: 1, z: -3, name: "Forest Biome", oddsDesc: "Stationary mass: ~31.8%", expectedValue: 0.318 },
      { id: "quad-desert", x: 3, y: 1, z: -3, name: "Desert Biome", oddsDesc: "Stationary mass: ~27.3%", expectedValue: 0.273 },
      { id: "quad-tundra", x: -3, y: 1, z: 3, name: "Tundra Biome", oddsDesc: "Stationary mass: ~15.9%", expectedValue: 0.159 },
      { id: "quad-nether", x: 3, y: 1, z: 3, name: "Nether Biome", oddsDesc: "Stationary mass: ~25.0%", expectedValue: 0.250 },
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
    blocks: [
      // Stone Dungeon Floor (19x19 Cobblestone and Stone at y=0)
      ...createFloor(-9, 9, -9, 9, 0, "cobble", "stone"),
      // 4 Massive Dungeon Buttress Pillars
      ...createPillar(-6, -6, 1, 5, "stone", "cobble"),
      ...createPillar(6, -6, 1, 5, "stone", "cobble"),
      ...createPillar(-6, 6, 1, 5, "stone", "cobble"),
      ...createPillar(6, 6, 1, 5, "stone", "cobble"),
      // Overhead Stone Vault Beams
      ...createBeam(-6, 5, -6, 6, -6, "stone"),
      ...createBeam(-6, 5, 6, 6, 6, "stone"),
      ...createBeam(-6, 5, -6, -6, 6, "stone"),
      ...createBeam(6, 5, -6, 6, 6, "stone"),
      // Raised Spawner Dais in Center (5x5 Stone at y=1)
      ...createFloor(-2, 2, -2, 2, 1, "stone"),
      // Central Spawner Cage
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
    ],
    interactiveTargets: [
      { id: "target-spawner", x: 0, y: 2, z: 0, name: "Mystic Spawner Cage", oddsDesc: "Memoryless Exponential rate λ = 2/min (Mean wait = 30s)", expectedValue: 30 },
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
    blocks: [
      // Solid Obsidian Vault Floor (19x19 at y=0)
      ...createFloor(-9, 9, -9, 9, 0, "obsidian", "stone"),
      // 4 High-Tech Data Pillars with Redstone Beacons
      ...createPillar(-6, -6, 1, 5, "obsidian", "obsidian"),
      ...createPillar(6, -6, 1, 5, "obsidian", "obsidian"),
      ...createPillar(-6, 6, 1, 5, "obsidian", "obsidian"),
      ...createPillar(6, 6, 1, 5, "obsidian", "obsidian"),
      { x: -6, y: 6, z: -6, type: "redstone" },
      { x: 6, y: 6, z: -6, type: "redstone" },
      { x: -6, y: 6, z: 6, type: "redstone" },
      { x: 6, y: 6, z: 6, type: "redstone" },
      // Raised Dais for 4x4 Bedrock Matrix (9x9 Obsidian at y=1)
      ...createFloor(-4, 4, -4, 4, 1, "obsidian"),
      // 4x4 Bedrock Vault Grid on dais at y=2
      ...Array.from({ length: 4 }, (_, gx) =>
        Array.from({ length: 4 }, (_, gz) => ({
          x: (gx - 1.5) * 1.8,
          y: 2,
          z: (gz - 1.5) * 1.8,
          type: "bedrock" as VoxelBlockType,
          label: `Vault Block #${gx * 4 + gz + 1}`,
        }))
      ).flat(),
      // Glowing Glass Partition Wall physically splitting candidates 8 vs 8 along x=0
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
      // Overhead Scanner Bridge at y=5
      ...createBeam(-4, 5, 0, 4, 0, "stone"),
      { x: 0, y: 4, z: 0, type: "diamond_ore", label: "Acoustic Sonar Emitter" },
    ],
    interactiveTargets: Array.from({ length: 16 }, (_, i) => ({
      id: `block-${i + 1}`,
      x: ((i % 4) - 1.5) * 1.8,
      y: 2,
      z: (Math.floor(i / 4) - 1.5) * 1.8,
      name: `Vault Cell #${i + 1}`,
      oddsDesc: "Uniform 1/16 prior probability (H = 4 bits)",
      expectedValue: 0.0625,
    })),
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
