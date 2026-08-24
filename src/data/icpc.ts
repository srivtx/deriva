import { PROBLEMS_ICPC_A, type ICPCProblem } from "./icpc-a"
import { PROBLEMS_ICPC_B } from "./icpc-b"
import { PROBLEMS_ICPC_C } from "./icpc-c"
import { PROBLEMS_ICPC_D } from "./icpc-d"

export type { ICPCProblem }

export const STAGES_ICPC = [
  { id: 0, name: "Warmup: Ad-hoc & Simulation", desc: "read precisely, simulate faithfully" },
  { id: 1, name: "Sorting, Sweeps & Two Pointers", desc: "order creates locality" },
  { id: 2, name: "Binary Search on the Answer", desc: "monotone feasibility" },
  { id: 3, name: "Prefix Sums & Difference Arrays", desc: "precompute, query O(1)" },
  { id: 4, name: "Stacks, Queues & Union-Find", desc: "amortized power tools" },
  { id: 5, name: "Heaps & Tree Techniques", desc: "order statistics and trees" },
  { id: 6, name: "Shortest Paths & Topology", desc: "BFS, Dijkstra, DAG order" },
  { id: 7, name: "Components, MST & Matching", desc: "structure of the graph" },
  { id: 8, name: "Dynamic Programming I", desc: "linear and capacity states" },
  { id: 9, name: "Dynamic Programming II", desc: "grids, digits, bits, intervals" },
  { id: 10, name: "Strings & Hashing", desc: "borders, windows, tries" },
  { id: 11, name: "Numbers & Combinatorics", desc: "mod arithmetic that scales" },
  { id: 12, name: "Geometry & Games", desc: "cross products and Grundy" },
]

export const PROBLEMS_ICPC: ICPCProblem[] = [
  ...PROBLEMS_ICPC_A,
  ...PROBLEMS_ICPC_B,
  ...PROBLEMS_ICPC_C,
  ...PROBLEMS_ICPC_D,
]
