import { STAGES_TREES, PROBLEMS_TREES, buildTreeCode } from "./trees"
import { STAGES_LINKED_LISTS, PROBLEMS_LINKED_LISTS, linkedListHelperCode } from "./linked-lists"
import { STAGES_BST, PROBLEMS_BST, buildTreeCode as bstBuildCode } from "./bst"
import { STAGES_TRIE, PROBLEMS_TRIE, buildTrieCode } from "./trie"
import { STAGES_HEAP, PROBLEMS_HEAP, buildHeapCode } from "./heap"
import { STAGES_ADVANCED_TREES, PROBLEMS_ADVANCED_TREES, buildTreeCode as atBuildCode } from "./advanced-trees"
import { STAGES_BACKTRACKING, PROBLEMS_BACKTRACKING } from "./backtracking"
import { STAGES_GRAPHS, PROBLEMS_GRAPHS } from "./graphs"
import { STAGES_DP, PROBLEMS_DP } from "./dp"
import { STAGES_GREEDY, PROBLEMS_GREEDY } from "./greedy"
import { STAGES_INTERVALS, PROBLEMS_INTERVALS } from "./intervals"
import { STAGES_ADVANCED_GRAPHS, PROBLEMS_ADVANCED_GRAPHS } from "./advanced-graphs"
import { STAGES_BIT, PROBLEMS_BIT } from "./bit-manipulation"
import { STAGES_MATH, PROBLEMS_MATH } from "./math"
import { STAGES_ICPC, PROBLEMS_ICPC } from "./icpc"

export interface Problem {
  id: number; stage: number; title: string; pattern: string; skill: string
  statement: string; examples: { input: string; output: string; explain?: string }[]
  why: string; starterCode: string; hints: string[]; solution: string; walkthrough: string; testCode: string
  difficulty?: string
}
export interface Stage { id: number; name: string; desc: string }
export interface Topic { id: string; name: string; stages: Stage[]; problems: Problem[]; buildCode: string }

export const TOPICS: Record<string, Topic> = {
  trees:           { id: "trees",           name: "Trees",                stages: STAGES_TREES,           problems: PROBLEMS_TREES,           buildCode: buildTreeCode },
  "linked-lists":  { id: "linked-lists",    name: "Linked Lists",         stages: STAGES_LINKED_LISTS as Stage[],    problems: PROBLEMS_LINKED_LISTS,    buildCode: linkedListHelperCode },
  bst:             { id: "bst",             name: "Binary Search Trees",  stages: STAGES_BST as Stage[],            problems: PROBLEMS_BST,            buildCode: bstBuildCode },
  trie:            { id: "trie",            name: "Trie",                 stages: STAGES_TRIE as Stage[],           problems: PROBLEMS_TRIE,           buildCode: buildTrieCode },
  heap:            { id: "heap",            name: "Heap",                 stages: STAGES_HEAP as Stage[],           problems: PROBLEMS_HEAP,           buildCode: buildHeapCode },
  "advanced-trees":{ id: "advanced-trees",  name: "Advanced Trees",       stages: STAGES_ADVANCED_TREES as Stage[], problems: PROBLEMS_ADVANCED_TREES,  buildCode: atBuildCode || buildTreeCode },
  backtracking:    { id: "backtracking",    name: "Backtracking",         stages: STAGES_BACKTRACKING as Stage[],   problems: PROBLEMS_BACKTRACKING,   buildCode: "" },
  graphs:          { id: "graphs",          name: "Graphs",               stages: STAGES_GRAPHS as Stage[],         problems: PROBLEMS_GRAPHS,          buildCode: "" },
  dp:              { id: "dp",              name: "Dynamic Programming",  stages: STAGES_DP as Stage[],             problems: PROBLEMS_DP,              buildCode: "" },
  greedy:          { id: "greedy",          name: "Greedy",               stages: STAGES_GREEDY as Stage[],         problems: PROBLEMS_GREEDY,          buildCode: "" },
  intervals:       { id: "intervals",       name: "Intervals",            stages: STAGES_INTERVALS as Stage[],      problems: PROBLEMS_INTERVALS,       buildCode: "" },
  "advanced-graphs":{id: "advanced-graphs", name: "Advanced Graphs",      stages: STAGES_ADVANCED_GRAPHS as Stage[],problems: PROBLEMS_ADVANCED_GRAPHS, buildCode: "" },
  "bit-manipulation":{id:"bit-manipulation",name: "Bit Manipulation",     stages: STAGES_BIT as Stage[],            problems: PROBLEMS_BIT,             buildCode: "" },
  math:            { id: "math",            name: "Math",                 stages: STAGES_MATH as Stage[],           problems: PROBLEMS_MATH,           buildCode: "" },
  icpc:            { id: "icpc",            name: "ICPC Ladder",          stages: STAGES_ICPC,                      problems: PROBLEMS_ICPC,           buildCode: "" },
}

export const TOPIC_LIST = Object.values(TOPICS)
