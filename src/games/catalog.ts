// The Game Mode curriculum map. Each game engine owns a family of mental
// models; one engine can host many short levels without turning concepts into
// disconnected trivia.

export type GameEngine = {
  id: string
  title: string
  verb: string
  description: string
  patterns: string[]
  status: "playable" | "prototype" | "next"
  href?: string
}

export const GAME_ENGINES: GameEngine[] = [
  {
    id: "algorithm-relay",
    title: "Algorithm Relay",
    verb: "compose the system",
    description: "Carry one solution through representation, invariant, frontier, state, and proof rooms.",
    patterns: ["Representation Choice", "Invariant-Driven Structure", "Greedy Frontier", "State Design", "Exchange Argument"],
    status: "prototype",
    href: "/games/pattern-relay",
  },
  {
    id: "stack-climber",
    title: "Stack Climber",
    verb: "descend, stop, return",
    description: "Make recursion physical: shrink the problem, find the floor, and send answers back up.",
    patterns: ["Recursive Leap of Faith", "Traversal-as-Skeleton", "Upward Aggregation", "Returning Tuples", "Path-as-Array + Prefix-on-Path", "Function-as-List"],
    status: "playable",
    href: "/games/stack-climber",
  },
  {
    id: "invariant-inspector",
    title: "Invariant Inspector",
    verb: "protect the rule",
    description: "Watch a structure break, locate the first illegal state, and repair the operation that caused it.",
    patterns: ["Invariant-Driven Structure", "Downward Constraints", "Pointer Surgery", "Sentinel Thinking", "Representative Trees"],
    status: "next",
    href: "/games/invariant-inspector",
  },
  {
    id: "frontier-runner",
    title: "Bike Route Runner",
    verb: "move the boundary",
    description: "Push a frontier through a graph and learn when layers, costs, or events change the next move.",
    patterns: ["Layer Argument", "Frontier Maintenance", "Greedy Frontier", "Relaxation Rounds"],
    status: "playable",
    href: "/games/frontier-runner",
  },
  {
    id: "decision-garden",
    title: "Decision Garden",
    verb: "choose and prune",
    description: "Grow a decision tree, undo choices cleanly, and cut branches only when you can prove they cannot work.",
    patterns: ["Decision Tree", "Choose-Explore-Unchoose", "Pruning", "Visited/Canonical Form", "Bit-as-Membership Enumeration"],
    status: "next",
    href: "/games/decision-garden",
  },
  {
    id: "state-forge",
    title: "State Forge",
    verb: "remember what matters",
    description: "Design the smallest state that keeps a future answer recoverable, then compress the table around it.",
    patterns: ["Overlap → Memoization", "State Design (amnesia test)", "Ending at i", "Table-as-Product", "Cancellation Algebra (XOR → mod-k)"],
    status: "next",
    href: "/games/state-forge",
  },
  {
    id: "compression-workshop",
    title: "Compression Workshop",
    verb: "store the useful frontier",
    description: "Replace repeated scanning with structures that remember exactly the operations the problem asks for.",
    patterns: ["Structure-as-Compression (Trie)", "Local-Rules-Global-Answer (Heap)", "Masks & Stencils", "Elimination"],
    status: "next",
    href: "/games/compression-workshop",
  },
  {
    id: "proof-arena",
    title: "Proof Arena",
    verb: "challenge the shortcut",
    description: "Construct counterexamples, compare naive and optimal traces, and earn an optimization only when it is safe.",
    patterns: ["Exchange Argument", "Invariance-Preserving Reduction (Euclid)", "Halve-the-Work (Squaring)"],
    status: "next",
    href: "/games/proof-arena",
  },
]
