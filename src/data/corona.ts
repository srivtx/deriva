export type GridKind = "square" | "hex"

export interface CoronaGoal {
  tiler?: boolean
  minDepth?: number
  maxDepth?: number
  minCells?: number
  maxCells?: number
  grid?: GridKind
}

export type CoronaPuzzleKind = "mc" | "num" | "create"

export interface CoronaPuzzle {
  id: number
  stage: number
  kind: CoronaPuzzleKind
  title: string
  prompt: string
  choices?: string[]
  answer?: number
  tol?: number
  goal?: CoronaGoal
  hard?: boolean
  why: string
}

export interface CoronaStage {
  id: number
  name: string
  desc: string
}

export const STAGES_CORONA: CoronaStage[] = [
  { id: 0, name: "Witness", desc: "ring a shape once — the corona is a certificate you can replay" },
  { id: 1, name: "Frontier", desc: "stack rings toward the open problem — three is the record, five is the hunt" },
]

export const PUZZLES_CORONA: CoronaPuzzle[] = [
  {
    id: 1, stage: 0, kind: "create",
    title: "Tile a test region",
    prompt: "Draw any shape you like in the lab. The moment the engine proves copies of it cover the plane with no gaps and no overlaps, this puzzle pops. A lone domino already qualifies — try something with more character.",
    goal: { tiler: true },
    why: "Tiling is an existence claim: one infinite family of copies, edge to edge, forever. The engine proves it constructively — it exhibits a placement pattern and replays it outward. If the replay runs, the tiling is true. No faith, no hand-waving.",
  },
  {
    id: 2, stage: 0, kind: "create",
    title: "Break symmetry",
    prompt: "Now fail on purpose: draw a shape of at least 6 cells that the engine can prove never tiles. Plenty of big shapes fail — the art is making one you'd swear almost works, and watching the engine close every escape route.",
    goal: { tiler: false, minCells: 6 },
    why: "Non-tiling is checked by exhaustion: the engine explores every way copies could interlock and finds each branch blocked. The shapes that DO tile are the rare exceptions — break one little balance and the whole plane-fill collapses.",
  },
  {
    id: 3, stage: 0, kind: "create",
    title: "First corona",
    prompt: "A corona is a ring of copies that perfectly surrounds your shape — every copy touching it, no gaps, no overlaps. Draw a non-tiler and get the engine to certify its first corona. That single ring is Heesch number 1.",
    goal: { tiler: false, minDepth: 1 },
    why: "The first corona is already a small proof: the shape can be enclosed once even though it can never tile. Most non-tilers manage at least this — a stubborn few can't be ringed at all, and those score Heesch number 0.",
  },
  {
    id: 4, stage: 0, kind: "num",
    title: "The T's orientations",
    prompt: "How many unique orientations does the T-tetromino have, counting rotations × reflections?",
    answer: 8,
    why: "4 rotations × 2 reflections = 8 — the orientation count a tiling engine enumerates when it tries every placement of a shape. Flip symmetry is exactly why the T is such a pleasant tiler: mirrors and rotations hand it free fits.",
  },
  {
    id: 5, stage: 0, kind: "create",
    title: "Two rings deep",
    prompt: "Heesch 2: a non-tiler that can be surrounded once, and then surrounded AGAIN by a second complete corona. Draw, tweak, and check until the engine certifies two full rings around your shape.",
    goal: { tiler: false, minDepth: 2 },
    why: "Each extra corona is exponentially harder: the first ring fixes constraints that the second must satisfy around its entire outer boundary. Known shapes manage 2 — every additional ring kills most candidates on contact.",
  },
  {
    id: 6, stage: 0, kind: "mc",
    title: "The tiler's infinite coronas",
    prompt: "Why can a shape that tiles the plane never have a finite Heesch number?",
    choices: [
      "Because tilers are always too small to be surrounded",
      "Because copies of a tiler can be repeated outward forever, so coronas never run out",
      "Because Heesch numbers are only defined for hexagonal grids",
      "Because a tiling proof deletes the outermost ring first",
    ],
    answer: 1,
    why: "Heesch number is defined for NON-tilers: it counts how many complete coronas a shape tolerates before the ring-packing possibility dies. If the shape tiles, the coronas are just the successive shells of an infinite tiling — the count never terminates, so no finite number exists.",
  },
  {
    id: 7, stage: 1, kind: "create",
    title: "Triple corona",
    prompt: "Heesch 3 — the genuine frontier of this lab. Find a non-tiler the engine can ring three full times. The known constructions live in symmetric, hex-flavored families: load a preset, carve, and keep checking.",
    goal: { tiler: false, minDepth: 3 },
    hard: true,
    why: "Every additional ring demands that the previous ring's outer boundary be ringable too — a compounding constraint most shapes die on. Confirmed examples stop at 3; nothing deeper has ever been exhibited.",
  },
  {
    id: 8, stage: 1, kind: "num",
    title: "Six ways to turn",
    prompt: "On the hex grid, how many rotations does a shape have (reflections excluded)?",
    answer: 6,
    why: "Six 60° rotations before a shape returns to itself — the hexagonal orientation group is half again as rich as the square's four. That extra symmetry is exactly why the deepest known Heesch examples were built on hex-flavored grids.",
  },
  {
    id: 9, stage: 1, kind: "create",
    title: "Hex ring",
    prompt: "Point the lab at the hex grid and draw a non-tiler that earns its first corona there. Neighbors meet three-way at every vertex, so coronas seal differently — the dihex preset is a good launchpad.",
    goal: { tiler: false, minDepth: 1, grid: "hex" },
    why: "On hex grids each cell has six neighbors and coronas grow as hexagonal shells; the classic deep-Heesch constructions were found in exactly this geometry. Ring structure here is cleaner to certify and richer to explore.",
  },
  {
    id: 10, stage: 1, kind: "mc",
    title: "What the witness proves",
    prompt: "A corona witness is a proof of what?",
    choices: [
      "That the shape secretly tiles, but only in disguise",
      "That the shape has at least six neighbors on average",
      "That those copies, in those positions, surround the shape without collision (verifiable by replay)",
      "That the shape can never be ringed a second time",
    ],
    answer: 2,
    why: "A witness is a concrete certificate: the exact coordinates of every copy in the ring. Anyone can replay it — place the copies, check contacts and collisions — and the claim verifies in a single pass, no trust in the search required. Same philosophy as proof-carrying SAT results.",
  },
  {
    id: 11, stage: 1, kind: "create",
    title: "Lean machine",
    prompt: "Economy run: a non-tiler of 6 cells or fewer that still reaches depth 1. Small failures are the hardest — with so few cells there is little room to break the symmetry that tilings feed on.",
    goal: { tiler: false, minDepth: 1, maxCells: 6 },
    why: "The tiniest polyominoes almost all tile; the compact non-tilers that survive one corona sit in a narrow sweet spot. Hunting near the minimum teaches you precisely which local arrangement kills a tiling.",
  },
  {
    id: 12, stage: 1, kind: "create",
    title: "The five-ring frontier",
    prompt: "Set the lab to 5 rings and hunt. Grading: reach 3 or more coronas — Heesch 4 would already beat the confirmed record, and the first Heesch 5 shape would end a 60-year-old open problem. Layr Labs is running a live contest on exactly this hunt right now.",
    goal: { tiler: false, minDepth: 3, maxDepth: 5 },
    hard: true,
    why: "Heesch asked in the 1960s whether non-tilers exist with arbitrarily deep coronas. The deepest confirmed number is 3; whether 4 — or the prize number 5 — can be reached is open mathematics, and the github.com/Layr-Labs/heesch contest is paying attention to anyone who pushes the frontier.",
  },
]

export const CORONA_PRESETS: { name: string; grid: GridKind; cells: [number, number][] }[] = [
  { name: "T-tetromino", grid: "square", cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { name: "L-pentomino", grid: "square", cells: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]] },
  { name: "P-pentomino", grid: "square", cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]] },
  { name: "Hex dihex", grid: "hex", cells: [[0, 0], [1, 0]] },
]
