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
}

// 8 Linear Progressive Worlds from Foundations to Master
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
      "Three stone vaults stand before you: Vault 1 holds [Gold + Gold], Vault 2 holds [Coal + Coal], Vault 3 holds [Gold + Coal]. Open Vault 1 or 3 blindly. You extracted a Gold Ore! Inspect the other slot: why is the chance of finding Gold 2/3 instead of 1/2?",
    winConditionDesc: "Test 10 vault extractions and verify empirical convergence to 66.7%",
    playerSpawn: [0, 2, 6],
    cameraLookAt: [0, 1.5, 0],
    blocks: [
      // Floor (Grass & Stone)
      ...Array.from({ length: 9 }, (_, x) =>
        Array.from({ length: 9 }, (_, z) => ({
          x: x - 4,
          y: 0,
          z: z - 4,
          type: (Math.abs(x - 4) <= 1 && Math.abs(z - 4) <= 1 ? "cobble" : "grass") as VoxelBlockType,
        }))
      ).flat(),
      // Vault Pedestals
      { x: -3, y: 1, z: 0, type: "stone" },
      { x: -3, y: 2, z: 0, type: "chest", label: "Vault A [Gold + Gold]" },
      { x: 0, y: 1, z: 0, type: "stone" },
      { x: 0, y: 2, z: 0, type: "chest", label: "Vault B [Coal + Coal]" },
      { x: 3, y: 1, z: 0, type: "stone" },
      { x: 3, y: 2, z: 0, type: "chest", label: "Vault C [Gold + Coal]" },
      // Archway in background
      { x: -4, y: 1, z: -4, type: "cobble" },
      { x: -4, y: 2, z: -4, type: "cobble" },
      { x: -4, y: 3, z: -4, type: "cobble" },
      { x: 4, y: 1, z: -4, type: "cobble" },
      { x: 4, y: 2, z: -4, type: "cobble" },
      { x: 4, y: 3, z: -4, type: "cobble" },
      { x: 0, y: 4, z: -4, type: "gold_ore" },
    ],
    interactiveTargets: [
      { id: "vault-a", x: -3, y: 2, z: 0, name: "Vault A (Gold + Gold)", oddsDesc: "2 Gold Coins (2/3 of all gold paths)", expectedValue: 2 },
      { id: "vault-b", x: 0, y: 2, z: 0, name: "Vault B (Coal + Coal)", oddsDesc: "2 Coal Coins (Eliminated by seeing Gold)", expectedValue: 0 },
      { id: "vault-c", x: 3, y: 2, z: 0, name: "Vault C (Gold + Coal)", oddsDesc: "1 Gold Coin (1/3 of all gold paths)", expectedValue: 1 },
    ],
    options: [
      { id: "opt-half", label: "1/2 (50%) — Two surviving chests, each equally likely", isTrap: true, explanation: "Counts boxes instead of individual coin draw paths. The double gold box has twice as many ways to produce a gold draw." },
      { id: "opt-two-thirds", label: "2/3 (66.7%) — 2 of the 3 existing gold coins belong to the double-gold vault", isTrap: false, explanation: "Correct! Conditioning on seeing gold eliminates 3 of the 6 total coin faces, leaving 2 from Box A and 1 from Box C." },
      { id: "opt-one-third", label: "1/3 (33.3%) — The chance of originally choosing Vault 1", isTrap: true, explanation: "Ignores the new evidence. Observing gold rules out Vault 2 completely, so the probability must update upwards." },
    ],
    correctOptionId: "opt-two-thirds",
    theoryTakeaway: "Condition on individual microstate outcomes, never on aggregate macrostate containers.",
    targetTrials: 10,
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
    playerSpawn: [0, 2, 8],
    cameraLookAt: [0, 2, 0],
    blocks: [
      // Floor
      ...Array.from({ length: 11 }, (_, x) =>
        Array.from({ length: 11 }, (_, z) => ({
          x: x - 5,
          y: 0,
          z: z - 5,
          type: "stone" as VoxelBlockType,
        }))
      ).flat(),
      // Ore Vein Wall (Diamond & Gold ores)
      ...Array.from({ length: 7 }, (_, x) =>
        Array.from({ length: 4 }, (_, y) => ({
          x: x - 3,
          y: y + 1,
          z: 0,
          type: ((x + y) % 3 === 0 ? "diamond_ore" : (x + y) % 2 === 0 ? "gold_ore" : "coal_ore") as VoxelBlockType,
        }))
      ).flat(),
      // Torches / glowstone
      { x: -4, y: 2, z: 2, type: "redstone" },
      { x: 4, y: 2, z: 2, type: "redstone" },
    ],
    interactiveTargets: [
      { id: "pick-iron", x: -2, y: 1, z: 4, name: "Steady Iron Pick", oddsDesc: "100% chance of 1 gold chunk", expectedValue: 1.0 },
      { id: "pick-diamond", x: 0, y: 1, z: 4, name: "Lucky Diamond Pick", oddsDesc: "10% chance of 14 gold, 90% chance of 0", expectedValue: 1.4 },
      { id: "pick-cursed", x: 2, y: 1, z: 4, name: "Cursed Nether Pick", oddsDesc: "1% chance of 80 gold, 99% chance of 0", expectedValue: 0.8 },
    ],
    options: [
      { id: "opt-iron", label: "Iron Pick: 1 guaranteed is always safer and better over 1000 blocks", isTrap: true, explanation: "Zero variance, but lower expected yield: 1000 blocks gives 1000 gold vs Diamond Pick's expected 1400 gold." },
      { id: "opt-diamond", label: "Diamond Pick: E[X] = 1.4 gold/strike, yielding 40% more total wealth over large N", isTrap: false, explanation: "Correct! In repeat games, expected value governs cumulative payout as variance averages out." },
      { id: "opt-cursed", label: "Cursed Pick: 80 gold jackpot makes it the highest EV tool", isTrap: true, explanation: "0.01 * 80 = 0.8 gold/strike, which is worse than both Iron (1.0) and Diamond (1.4)." },
    ],
    correctOptionId: "opt-diamond",
    theoryTakeaway: "In repeated trials, maximize Expected Value E[X]. Variance only dominates short horizons.",
    targetTrials: 20,
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
    playerSpawn: [0, 2, 7],
    cameraLookAt: [0, 2, 0],
    blocks: [
      // Floor Obsidian
      ...Array.from({ length: 9 }, (_, x) =>
        Array.from({ length: 9 }, (_, z) => ({
          x: x - 4,
          y: 0,
          z: z - 4,
          type: "obsidian" as VoxelBlockType,
        }))
      ).flat(),
      // Portal 1 (Left)
      { x: -3, y: 1, z: 0, type: "obsidian" },
      { x: -3, y: 2, z: 0, type: "portal", label: "Portal 1" },
      { x: -3, y: 3, z: 0, type: "obsidian" },
      // Portal 2 (Center)
      { x: 0, y: 1, z: 0, type: "obsidian" },
      { x: 0, y: 2, z: 0, type: "portal", label: "Portal 2" },
      { x: 0, y: 3, z: 0, type: "obsidian" },
      // Portal 3 (Right)
      { x: 3, y: 1, z: 0, type: "obsidian" },
      { x: 3, y: 2, z: 0, type: "portal", label: "Portal 3" },
      { x: 3, y: 3, z: 0, type: "obsidian" },
    ],
    interactiveTargets: [
      { id: "portal-1", x: -3, y: 2, z: 0, name: "Portal 1 (Initial Choice)", oddsDesc: "Keeps initial 1/3 prior probability", expectedValue: 0.333 },
      { id: "portal-2", x: 0, y: 2, z: 0, name: "Portal 2 (Switch Alternative)", oddsDesc: "Absorbs the 2/3 probability mass from host filter", expectedValue: 0.667 },
      { id: "portal-3", x: 3, y: 2, z: 0, name: "Portal 3 (Revealed Sheep)", oddsDesc: "Known goat (0% win probability)", expectedValue: 0 },
    ],
    options: [
      { id: "opt-stay", label: "Stay with Portal 1: It's 50/50 between the two remaining portals", isTrap: true, explanation: "Fails to account for host knowledge. The host's filtered action is not random coin tossing." },
      { id: "opt-switch", label: "Switch to Portal 2: Doubles your win rate from 1/3 to 2/3", isTrap: false, explanation: "Correct! Switching wins in every universe where your first guess was wrong (which happens 2/3 of the time)." },
      { id: "opt-same", label: "It makes zero mathematical difference whether you switch or stay", isTrap: true, explanation: "Common intuition fallacy: independent symmetry only applies if the host had picked randomly and happened not to reveal the diamond." },
    ],
    correctOptionId: "opt-switch",
    theoryTakeaway: "Host filtering concentrates the unchosen probability mass into the remaining candidate.",
    targetTrials: 15,
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
    playerSpawn: [0, 2, 8],
    cameraLookAt: [0, 2, 0],
    blocks: [
      // Spawn platform
      ...Array.from({ length: 3 }, (_, x) =>
        Array.from({ length: 3 }, (_, z) => ({
          x: x - 1,
          y: 1,
          z: z + 7,
          type: "cobble" as VoxelBlockType,
        }))
      ).flat(),
      // 1D Narrow Bridge suspended over void
      ...Array.from({ length: 12 }, (_, i) => ({
        x: 0,
        y: 1,
        z: 6 - i,
        type: (i === 6 ? "diamond_ore" : "stone") as VoxelBlockType,
        label: `Tile ${i - 6}`,
      })),
      // Finish platform
      ...Array.from({ length: 3 }, (_, x) =>
        Array.from({ length: 3 }, (_, z) => ({
          x: x - 1,
          y: 1,
          z: z - 7,
          type: "gold_ore" as VoxelBlockType,
        }))
      ).flat(),
    ],
    interactiveTargets: [
      { id: "walk-fair", x: 0, y: 1, z: 0, name: "Fair Walk (p=0.5)", oddsDesc: "Recurrent: Expected visits to origin is infinite", expectedValue: 0 },
      { id: "walk-biased", x: 0, y: 1, z: -3, name: "Adverse Wind (p=0.4)", oddsDesc: "Transient: Drifts inevitably into the void", expectedValue: -0.2 },
    ],
    options: [
      { id: "opt-never", label: "In 1D, fair steps will almost surely drift away and never return to origin", isTrap: true, explanation: "False! Pólya proved 1D and 2D symmetric walks return to the starting position with probability 1." },
      { id: "opt-recurrent", label: "In 1D and 2D, the walk is recurrent (P(return) = 1); in 3D it is transient (P(return) ≈ 34%)", isTrap: false, explanation: "Correct! The green function sum diverges in dimensions 1 and 2, but converges in dimension 3." },
      { id: "opt-infinite", label: "Higher dimensions make it easier to return because there are more paths home", isTrap: true, explanation: "More paths also means vastly more volume to get lost in — volume grows exponentially like r^d." },
    ],
    correctOptionId: "opt-recurrent",
    theoryTakeaway: "1D and 2D symmetric random walks are recurrent; 3D space is transient.",
    targetTrials: 25,
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
    playerSpawn: [0, 2, 6],
    cameraLookAt: [0, 1.5, 0],
    blocks: [
      // Lava Lake
      ...Array.from({ length: 9 }, (_, x) =>
        Array.from({ length: 9 }, (_, z) => ({
          x: x - 4,
          y: 0,
          z: z - 4,
          type: "lava" as VoxelBlockType,
        }))
      ).flat(),
      // Stepping Stone Pillars
      { x: 0, y: 1, z: 4, type: "cobble", label: "Start Bet: 1 Gold" },
      { x: 0, y: 1, z: 2, type: "stone", label: "Bet 2 Gold" },
      { x: 0, y: 1, z: 0, type: "stone", label: "Bet 4 Gold" },
      { x: 0, y: 1, z: -2, type: "stone", label: "Bet 8 Gold" },
      { x: 0, y: 1, z: -4, type: "gold_ore", label: "Goal (+1 Gold Profit)" },
    ],
    interactiveTargets: [
      { id: "bet-single", x: 0, y: 1, z: 4, name: "Flat 1 Gold Bet", oddsDesc: "Fair 50/50 coin flip, EV = 0", expectedValue: 0 },
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
    playerSpawn: [0, 2, 6],
    cameraLookAt: [0, 1.5, 0],
    blocks: [
      // 4 Quadrant Biomes
      ...Array.from({ length: 8 }, (_, x) =>
        Array.from({ length: 8 }, (_, z) => {
          const rx = x - 4
          const rz = z - 4
          let type: VoxelBlockType = "cobble"
          if (rx < 0 && rz < 0) type = "grass" // Forest
          else if (rx >= 0 && rz < 0) type = "dirt" // Desert
          else if (rx < 0 && rz >= 0) type = "glass" // Tundra
          else type = "obsidian" // Nether
          return { x: rx, y: 0, z: rz, type }
        })
      ).flat(),
      // Portal Pillars in each room
      { x: -2, y: 1, z: -2, type: "portal", label: "Forest Portal [Stay: 0.5, Desert: 0.3, Tundra: 0.2]" },
      { x: 2, y: 1, z: -2, type: "portal", label: "Desert Portal [Forest: 0.4, Stay: 0.2, Nether: 0.4]" },
      { x: -2, y: 1, z: 2, type: "portal", label: "Tundra Portal [Forest: 0.3, Nether: 0.7]" },
      { x: 2, y: 1, z: 2, type: "portal", label: "Nether Portal [Desert: 0.5, Tundra: 0.1, Stay: 0.4]" },
    ],
    interactiveTargets: [
      { id: "quad-forest", x: -2, y: 1, z: -2, name: "Forest Biome", oddsDesc: "Stationary mass: ~31.8%", expectedValue: 0.318 },
      { id: "quad-desert", x: 2, y: 1, z: -2, name: "Desert Biome", oddsDesc: "Stationary mass: ~27.3%", expectedValue: 0.273 },
      { id: "quad-tundra", x: -2, y: 1, z: 2, name: "Tundra Biome", oddsDesc: "Stationary mass: ~15.9%", expectedValue: 0.159 },
      { id: "quad-nether", x: 2, y: 1, z: 2, name: "Nether Biome", oddsDesc: "Stationary mass: ~25.0%", expectedValue: 0.250 },
    ],
    options: [
      { id: "opt-initial-bias", label: "Starting in the Nether guarantees you will spend most time in the Nether", isTrap: true, explanation: "Initial conditions decay exponentially. The stationary state is independent of where you start." },
      { id: "opt-stationary", label: "Room occupancy converges to the stationary vector π where πP = π regardless of start", isTrap: false, explanation: "Correct! The Perron-Frobenius theorem guarantees unique stationary convergence for ergodic chains." },
      { id: "opt-uniform", label: "Because all 4 rooms are connected, each room will hold exactly 25% occupancy", isTrap: true, explanation: "Only symmetric double-stochastic matrices yield uniform distributions. Asymmetric transition rates skew stationary weights." },
    ],
    correctOptionId: "opt-stationary",
    theoryTakeaway: "In ergodic Markov systems, long-term state occupancy converges to the eigenvector πP = π.",
    targetTrials: 100,
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
    playerSpawn: [0, 2, 6],
    cameraLookAt: [0, 1.5, 0],
    blocks: [
      // Stone Dungeon
      ...Array.from({ length: 7 }, (_, x) =>
        Array.from({ length: 7 }, (_, z) => ({
          x: x - 3,
          y: 0,
          z: z - 3,
          type: "cobble" as VoxelBlockType,
        }))
      ).flat(),
      // Spawner Cage in Center
      { x: 0, y: 1, z: 0, type: "obsidian" },
      { x: 0, y: 2, z: 0, type: "dice_block", label: "Creeper Spawner (λ=2/min)" },
      { x: 0, y: 3, z: 0, type: "redstone" },
    ],
    interactiveTargets: [
      { id: "target-spawner", x: 0, y: 2, z: 0, name: "Mystic Spawner Cage", oddsDesc: "Memoryless Exponential rate λ = 2/min", expectedValue: 30 },
    ],
    options: [
      { id: "opt-overdue", label: "Yes, waiting 50s charges the spawner, making an immediate spawn much more likely", isTrap: true, explanation: "Fails to grasp memorylessness. Radioactive decay and Poisson processes have zero internal clock or fatigue." },
      { id: "opt-memoryless", label: "No: P(T > 60 | T > 50) = P(T > 10). The remaining wait distribution is identical to new", isTrap: false, explanation: "Correct! The exponential distribution is the ONLY continuous probability distribution with zero memory." },
      { id: "opt-periodic", label: "Spawns are strictly periodic: exactly one every 30 seconds", isTrap: true, explanation: "Poisson processes are stochastic, not deterministic clocks. Inter-arrival times have variance equal to (1/λ)^2." },
    ],
    correctOptionId: "opt-memoryless",
    theoryTakeaway: "Memoryless Poisson events do not become 'due'; the probability of an arrival in the next second is invariant.",
    targetTrials: 15,
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
    playerSpawn: [0, 2, 6],
    cameraLookAt: [0, 1.5, 0],
    blocks: [
      // 4x4 Bedrock Vault Grid
      ...Array.from({ length: 4 }, (_, x) =>
        Array.from({ length: 4 }, (_, z) => ({
          x: (x - 1.5) * 1.5,
          y: 1,
          z: (z - 1.5) * 1.5,
          type: "bedrock" as VoxelBlockType,
          label: `Voxel ${x * 4 + z + 1}`,
        }))
      ).flat(),
      // Pedestal frames
      { x: -3.5, y: 1, z: 0, type: "obsidian" },
      { x: 3.5, y: 1, z: 0, type: "obsidian" },
      { x: 0, y: 1, z: -3.5, type: "gold_ore" },
    ],
    interactiveTargets: Array.from({ length: 16 }, (_, i) => ({
      id: `block-${i + 1}`,
      x: ((i % 4) - 1.5) * 1.5,
      y: 1,
      z: (Math.floor(i / 4) - 1.5) * 1.5,
      name: `Vault Block #${i + 1}`,
      oddsDesc: "Uniform 1/16 prior probability (0.0625)",
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
  },
]
