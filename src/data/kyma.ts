// KYMA — pattern formation: how waves, flows and chemistry draw figures.
// Puzzles are graded against real physics: the plate checks your (m, n, mix)
// dial, the dish checks your feed/kill chemistry. All Gray-Scott presets are
// verified against the exact Karl-Sims algorithm shipped in the lab
// (DA=1.0, DB=0.5, dt=1.0, 9-point laplacian).

export interface KymaTarget {
  m: number
  n: number
  mix: number
}

export interface KymaFk {
  F: number
  k: number
}

export type KymaPuzzleKind = "mc" | "num" | "plate" | "fk"

export interface KymaPuzzle {
  id: number
  stage: number
  kind: KymaPuzzleKind
  title: string
  prompt: string
  options?: string[]
  answer?: number
  numAnswer?: number
  tol?: number
  target?: KymaTarget
  fkTarget?: KymaFk
  fkTol?: KymaFk
  why: string
}

export interface KymaStage {
  id: number
  name: string
  desc: string
}

export const STAGES_KYMA: KymaStage[] = [
  { id: 0, name: "The Still Point", desc: "sand gathers where the plate does not move" },
  { id: 1, name: "The Mode Ladder", desc: "every frequency owns exactly one figure" },
  { id: 2, name: "The Two Chemicals", desc: "the mixer that paints — Turing's inversion" },
  { id: 3, name: "The Parameter Zoo", desc: "feed and kill decide what the dish grows" },
]

export const PUZZLES_KYMA: KymaPuzzle[] = [
  // ---- Stage 0 — The Still Point ----
  {
    id: 1, stage: 0, kind: "mc",
    title: "Where the sand stays",
    prompt: "A plate driven at resonance hums violently almost everywhere — yet the sand draws its figure along the lines where the plate is perfectly STILL. Why does the sand abandon the fast-moving regions?",
    options: [
      "The vibration heats those regions and the sand melts away",
      "Vibration bounces grains off the fast regions until they rest on the motionless nodal lines",
      "Air pushed by the speaker blows the sand outward",
      "Grains become statically charged and repel the edges",
    ],
    answer: 1,
    why: "The plate's acceleration, not its loudness, moves the sand: antinode regions accelerate hundreds of times per second and kick the grains on every bounce. Each landing nudges a grain one step; grains random-walk until they land where the surface never moves — a nodal line — and stay. The figure you see is literally a map of zero motion.",
  },
  {
    id: 2, stage: 0, kind: "num",
    title: "Chladni's law",
    prompt: "On a circular plate, Chladni's empirical law says a mode's frequency scales as (m + 2n)\u00B2, where m counts nodal diameters (spokes) and n counts nodal circles (rings). A figure with 4 diameters and 0 circles scores (4 + 0)\u00B2 = 16 frequency units. How many units does the figure with 0 diameters and 2 circles score?",
    numAnswer: 16,
    tol: 0.01,
    why: "(0 + 2\u00B7\u00B2)\u00B2 = 16 too — adding ONE nodal circle costs as much frequency as adding TWO diameters. That trade is the whole law: Chladni tabulated it by hand in 1787, and it still tunes cymbals and bells today (with a plate-dependent correction).",
  },
  {
    id: 3, stage: 0, kind: "mc",
    title: "Two figures, one pitch",
    prompt: "Bow a square plate at one frequency and the sand may settle into two genuinely DIFFERENT figures at the same pitch. What makes that possible?",
    options: [
      "The wood remembers the previous figure through hysteresis",
      "Square symmetry makes the modes (m,n) and (n,m) share one frequency — degeneracy",
      "The bow's position secretly changes the pitch",
      "The two figures alternate faster than the eye can see",
    ],
    answer: 1,
    why: "A square doesn't care which axis is which: the standing wave with m bands across and n bands along is physically distinct from n-across/m-along, yet mathematically a twin — same eigenfrequency. Real plates have tiny imperfections that split the pair, which is exactly how violin makers hear a plate's flaws before carving them away.",
  },
  // ---- Stage 1 — The Mode Ladder ----
  {
    id: 4, stage: 1, kind: "plate",
    title: "Dial the twin bands",
    prompt: "The target figure glows green on the plate: two vertical antinode bands across, three horizontal bands along. Dial the plate's mode until your sand figure matches it.",
    target: { m: 2, n: 3, mix: 0 },
    why: "The figure is a signature of the pair (m, n) — two antinodes across, three along. Nodal lines always sit where the cosine factors cancel; sliding m or n redraws the whole lattice in one snap because the resonance jumps to a different eigenmode.",
  },
  {
    id: 5, stage: 1, kind: "plate",
    title: "Dial the ladder's far rung",
    prompt: "The target figure glows green: one vertical band across, four horizontal bands along, and the diagonal twin blended in (mix all the way to the (4,1) twin). Reproduce it.",
    target: { m: 1, n: 4, mix: 1 },
    why: "With mix at 1 you're seeing the twin mode (n, m) = (4, 1) — the degenerate partner of (1, 4). Any blend of the twins is also a valid standing wave of the plate; the sand doesn't care which twin the bow excites.",
  },
  {
    id: 6, stage: 1, kind: "num",
    title: "The 3-4-5 rung",
    prompt: "On the square-plate model used in the lab, frequency = c\u00B7\u221A(m\u00B2 + n\u00B2), and here c = 64. The (1,1) mode hums near 90 Hz. What frequency, in Hz, does the (3,4) mode hum at?",
    numAnswer: 320,
    tol: 1.5,
    why: "\u221A(9 + 16) = 5 exactly, and 64 \u00D7 5 = 320 — the (3,4) rung is exact because 3-4-5 is a Pythagorean triple. Most rungs on the ladder are irrational; the sand notices nothing, but ears tuning instruments do.",
  },
  // ---- Stage 2 — The Two Chemicals ----
  {
    id: 7, stage: 2, kind: "mc",
    title: "The mixer that paints",
    prompt: "Diffusion is the great homogenizer: stir cream into coffee and it evens out. Turing's 1952 shock was that diffusion can also CREATE patterns from a uniform soup. What has to be true for the mixer to paint?",
    options: [
      "The two chemicals must be at very different temperatures",
      "The inhibitor must diffuse much faster than the activator — local activation, long-range inhibition",
      "Diffusion must be stopped halfway through the reaction",
      "One chemical must glow in ultraviolet light",
    ],
    answer: 1,
    why: "A spot of slow-diffusing activator grows where it is; its fast-diffusing inhibitor escapes outward and fences off the neighborhood. Spots settle one wavelength apart, never merging. Local self-activation plus long-range inhibition is the confirmed engine of zebrafish stripes, hair-follicle spacing and palate ridges.",
  },
  {
    id: 8, stage: 2, kind: "num",
    title: "Theory runs ahead",
    prompt: "Turing published the morphogenesis equations in 1952. The first laboratory Turing pattern — a chemical gel reaction — finally appeared in 1990. For how many years did the prediction wait for its experiment?",
    numAnswer: 38,
    tol: 0.01,
    why: "38 years: the equations predicted order before anyone had seen it in a dish. Nature had been running them all along — we just hadn't caught a reaction in the act until the CIMA gel experiment, and zebrafish ablation studies (2009) then confirmed the mechanism inside a living animal.",
  },
  {
    id: 9, stage: 2, kind: "mc",
    title: "The kill dial",
    prompt: "In the Gray\u2013Scott dish, F continuously feeds fresh chemical and k drains the pattern-maker away. You slide k upward past the survival band. What happens to the pattern?",
    options: [
      "It grows denser and denser until the dish fills",
      "It freezes exactly in place, unchanged",
      "It fades out entirely — a pattern needs the balance of feed and kill to persist at all",
      "It always turns into stripes first",
    ],
    answer: 2,
    why: "Patterns live inside a band of the F\u2013k plane: feed must replenish what the kill drains, at a rate the reaction can sustain. Step outside the band and there is no steady pattern to fall into — the dish returns to uniform. The whole zoo of cells, worms and coral is what happens INSIDE the band.",
  },
  // ---- Stage 3 — The Parameter Zoo ----
  {
    id: 10, stage: 3, kind: "fk",
    title: "Grow the coral reef",
    prompt: "The target dish grows a coral labyrinth: one endless connected network with no free-floating cells. Dial the chemistry (F, k) until your dish grows it — then press Check.",
    fkTarget: { F: 0.0545, k: 0.062 },
    fkTol: { F: 0.003, k: 0.002 },
    why: "Coral sits where feed is generous and kill is moderate: the growth front keeps advancing and fusing instead of isolating into cells. Verified preset for this exact dish: F = 0.0545, k = 0.062 (Karl Sims' classic parameters).",
  },
  {
    id: 11, stage: 3, kind: "fk",
    title: "Grow the dividing cells",
    prompt: "The target dish shows mitosis: isolated round cells that divide into pairs, again and again. Dial F and k until your dish does the same.",
    fkTarget: { F: 0.0367, k: 0.0649 },
    fkTol: { F: 0.0025, k: 0.0015 },
    why: "Barely enough feed: each cell can divide once, then the neighborhood starves and stops. Turing's equations perform biology's oldest move with no biologist present — F = 0.0367, k = 0.0649 in this dish.",
  },
  {
    id: 12, stage: 3, kind: "mc",
    title: "The coat puzzle",
    prompt: "The same chemistry runs everywhere in an animal's skin — yet a zebra's long neck and body carry stripes while broad rounded regions trend toward spots and rings. What best explains the difference?",
    options: [
      "Stripes grow only on skin exposed to sunlight",
      "Geometry: the chemistry fixes the pattern's wavelength, so narrow elongated regions fit stripes while broad regions fit spots or rings",
      "Genes paint each individual stripe by hand",
      "Blood vessels under the skin decide the layout",
    ],
    answer: 1,
    why: "Murray's 1988 insight: the reaction picks a wavelength, the DOMAIN picks what fits. A narrow tail can only fit bands across it; a broad flank lets spots close into rings. One mechanism, a thousand coats — and the same logic scales from fish to fingerprints.",
  },
]

export const KYMA_PRESETS: { name: string; F: number; k: number; note: string }[] = [
  { name: "Mitosis", F: 0.0367, k: 0.0649, note: "cells divide" },
  { name: "Coral", F: 0.0545, k: 0.062, note: "connected labyrinth" },
  { name: "Worms", F: 0.078, k: 0.061, note: "worms & loops" },
  { name: "Spirals", F: 0.014, k: 0.054, note: "flowing dots" },
]
