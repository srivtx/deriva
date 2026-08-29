import type { Problem, Stage } from "./index"
import { PROBLEMS_ONE_A } from "./one-a"
import { PROBLEMS_ONE_B } from "./one-b"
import { PROBLEMS_ONE_C } from "./one-c"
import { PROBLEMS_ONE_D } from "./one-d"
import { PROBLEMS_ONE_E } from "./one-e"
import { PROBLEMS_ONE_F } from "./one-f"
import { PROBLEMS_ONE_G } from "./one-g"
import { PROBLEMS_ONE_H } from "./one-h"
import { PROBLEMS_ONE_I } from "./one-i"
import { PROBLEMS_ONE_J } from "./one-j"

export type OneProblem = Problem

export const STAGES_ONE: Stage[] = [
  { id: 0, name: "Big-O & Counting", desc: "see the cost before you write the loop" },
  { id: 1, name: "Arrays & Two Pointers", desc: "converge, squeeze, overwrite" },
  { id: 2, name: "Sliding Window & Hashing", desc: "grow right, shrink left, remember" },
  { id: 3, name: "Sorting & Intervals", desc: "order creates structure" },
  { id: 4, name: "Binary Search", desc: "halve until the answer confesses" },
  { id: 5, name: "Prefix Sums & Differences", desc: "precompute once, answer free" },
  { id: 6, name: "Stacks & Queues", desc: "last in, first out, monotonic" },
  { id: 7, name: "Linked Lists", desc: "pointers are the data" },
  { id: 8, name: "Recursion & Backtracking", desc: "choose, explore, unchoose" },
  { id: 9, name: "Trees", desc: "recursion that branches" },
  { id: 10, name: "Heaps & Priority", desc: "the best element, always on top" },
  { id: 11, name: "Graph Search", desc: "BFS, DFS, and the visited set" },
  { id: 12, name: "Shortest Paths", desc: "weights change everything" },
  { id: 13, name: "Union-Find & Structure", desc: "who belongs to whom" },
  { id: 14, name: "DP Foundations", desc: "remember, don't recompute" },
  { id: 15, name: "DP II — Tables & Trees", desc: "two strings, a set, a tree" },
  { id: 16, name: "Expert Structures", desc: "tries, bounds, borders, bits" },
  { id: 17, name: "Flows & Matching", desc: "capacity is the last boss" },
  { id: 18, name: "Greedy", desc: "prove the local choice safe" },
  { id: 19, name: "Bit Manipulation", desc: "the mask is the data" },
  { id: 20, name: "Math & Numbers", desc: "Euclid, primes, exponents" },
  { id: 21, name: "Strings Deep", desc: "hashes, borders, calculators" },
  { id: 22, name: "BST & Serialization", desc: "order, stored and rebuilt" },
  { id: 23, name: "DP III", desc: "circles, squares, intervals, stars" },
  { id: 24, name: "Advanced Graphs", desc: "reverse the search, model the state" },
  { id: 25, name: "Design & Amortized", desc: "structures you invent" },
]

export const PROBLEMS_ONE: Problem[] = [
  ...PROBLEMS_ONE_A,
  ...PROBLEMS_ONE_B,
  ...PROBLEMS_ONE_C,
  ...PROBLEMS_ONE_D,
  ...PROBLEMS_ONE_E,
  ...PROBLEMS_ONE_F,
  ...PROBLEMS_ONE_G,
  ...PROBLEMS_ONE_H,
  ...PROBLEMS_ONE_I,
  ...PROBLEMS_ONE_J,
]
