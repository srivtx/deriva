// ── PDB — the debugging ladder ───────────────────────────────────────────────
// 41 problems, 11 stages, strictly linear: every problem hands you a broken
// module and a failing test suite, and teaches exactly one debugging move —
// from reading your first red test to hunting five root causes in unfamiliar
// code under a clock. Tests are the spec; the traceback is the map; the
// debugger is the flashlight. Execution: real Python + NumPy in the Pyodide
// worker, with a scripted-pdb harness for the in-browser debugger panel.

export interface PdbProblem {
  id: number; stage: number; title: string; pattern: string; skill: string
  file: string; bugCount: number
  statement: string; diagram?: string; examples: { input: string; output: string; explain?: string }[]
  why: string; starterCode: string; hints: string[]; solution: string; walkthrough: string
  testCode: string; entry?: string; pdbLoad?: string[]
}

export const STAGES_PDB = [
  {
    id: 0, name: "Read the Red", desc: "the failure is the spec",
    creed: "Most people see a failing test and start editing code. Debuggers read first. A red test is not an accusation — it is the most precise specification you will ever get: this input, this expectation, this actual value.\n\nThis stage installs the reflexes: read the assert message before the code, walk the traceback bottom-up to the first line YOU own, trust the test over the prose, and when several tests bleed, suspect one wound. No pdb yet — just eyes.\n\nThe bar to leave: given a wall of red, your first question is 'what exactly does the failure say?', not 'what should I change?'.",
  },
  {
    id: 1, name: "One-Line Lies", desc: "single local bugs, pure Python",
    creed: "The most common bugs are one line long and completely invisible until you compare the code with what the test demands: an off-by-one slice, a <= that should be <, a mutable default that remembers yesterday, a // that eats the decimal.\n\nThis stage trains the fundamental sweep: read the spec, form one hypothesis, verify it at the exact line, make the smallest correct fix. No cleverness — one lie, one truth.\n\nThe bar to leave: for a single-function bug you can name the violated expectation in one sentence and repair it in one line.",
  },
  {
    id: 2, name: "Watch the State", desc: "stop guessing, start inspecting",
    creed: "When reading fails, watch the machine. Print is the poor man's debugger; pdb is the real one: step line by line, print any variable, walk up the call stack, and find the exact moment a value becomes wrong.\n\nThis stage teaches pdb as a working tool, not vocabulary: args to see what came in, n to advance, p to interrogate, w/u/d to climb frames. Every drill ships a scripted debugger — type commands, read the transcript, catch the lie red-handed.\n\nThe bar to leave: your default response to 'this value is wrong' is 'let me watch it change', not 'let me stare harder'.",
  },
  {
    id: 3, name: "The Shape Law", desc: "shapes broadcast silently",
    creed: "NumPy almost never complains when the shapes are wrong in a way that still broadcasts — it just returns confidently wrong numbers. axis=0 answers 'one number per column', axis=1 'one per row', and a (n,) result broadcast against (n, m) slides across rows, not columns.\n\nThis stage drills the habit: before any reduction or reshape, say the shape out loud and check what lands where. The bug is never in the data; it is in which axis you trusted.\n\nThe bar to leave: when a result is the wrong shape or wrong orientation, you ask 'what shape did each operand have?' before touching anything else.",
  },
  {
    id: 4, name: "The NaN Swamp", desc: "not-a-number is a number that lies",
    creed: "NaN poisons everything it touches and equals nothing, including itself. One unreadable sensor turns a month of averages into NaN. One 0 * log(0) turns a clean entropy into nan. An all-NaN column happily reports min != max because nan != nan is true.\n\nThis stage makes you fluent in the swamp: isnan instead of ==, nan-aware reductions instead of raw ones, and the discipline of asking 'did a NaN swim into this pipeline?' whenever an answer comes back unreadable.\n\nThe bar to leave: nan in your output triggers 'where did it enter?', never 'weird'.",
  },
  {
    id: 5, name: "The Dtype Trap", desc: "numbers are typed, and the types bite",
    creed: "A float16 overflows to inf where a float64 shrugs. A numpy scalar silently demoted to a Python float loses the dtype a test demands. An int64 division truncates the fraction you needed, and an array cast to int before comparison judges 49.999 as if it were 49.\n\nThis stage teaches you to inspect dtype as routinely as value: p type(x), p x.dtype — because two numbers can be equal and still live in different worlds.\n\nThe bar to leave: 'the value is right but the type is wrong' is a bug report you can both read and fix.",
  },
  {
    id: 6, name: "Ghosts & Aliases", desc: "one object, many names",
    creed: "Python never copies unless you ask. [[0]*cols]*rows is one row with many nametags. A function that mutates its argument rearranges the caller's data. A cache that hands out the same list poisons itself the first time a caller appends. A shared RandomState makes 'deterministic' mean 'deterministic, in the order nobody uses'.\n\nThis stage trains the identity reflex: is this the same object or a new one, and who else holds a reference to it?\n\nThe bar to leave: before mutating or caching anything, you ask 'who else can see this object?' — and the debugger's `is` check is a reflex, not a novelty.",
  },
  {
    id: 7, name: "Recursion & Control", desc: "the floor, the identity, the early return",
    creed: "Recursive code fails at its edges: a base case missing entirely, a base case returning the wrong identity (0 instead of 1), a depth limit off by one comparison. Iterative code fails at its exits: a return placed inside the loop that leaves after one lap.\n\nThis stage walks every edge: watch the recursion depth hit the floor, watch an accumulator start from the wrong identity, watch a loop return halfway. Off-by-one is not bad luck — it is a specific, findable line.\n\nThe bar to leave: for any recursive or early-returning function, you can name its base case and its exit, and verify both with a debugger step.",
  },
  {
    id: 8, name: "The Cascade", desc: "many reds, one root",
    creed: "The assessment's signature move: ten tests fail, but only one thing is broken. A weighted average that ignores its weights drags grades, thresholds and pass/fail flags down with it. A missing normalization leaves predictions green and probabilities red. A shared helper with a bad index breaks every consumer at once.\n\nThis stage trains triage: find the failure most upstream, fix the invariant, and watch half the suite turn green for free. Chasing symptoms is how time dies.\n\nThe bar to leave: you treat 'N failing tests' as 'how few bugs produce these N?', never as 'N fixes to write'.",
  },
  {
    id: 9, name: "The Mask", desc: "booleans are the sharpest tool",
    creed: "A boolean mask is an invisible loop, and inverting it silently selects the complement of your intention. `and` between arrays raises ValueError (truth is ambiguous) where `&` selects elementwise — and the parentheses around each comparison are not optional.\n\nThis stage drills mask mechanics: invert with ~, combine with & and |, route with np.where, and read 'ambiguous truth value' as a signpost, not a wall.\n\nThe bar to leave: when a mask yields the wrong rows, you print the mask itself — not the rows — and read it element by element.",
  },
  {
    id: 10, name: "The Gauntlet", desc: "unfamiliar code, several roots, one clock",
    creed: "The finale composes everything: an unfamiliar module, four or five interacting bugs, failures that cascade and symptoms that mislead. No stage labels the bugs. You triage with the full kit — read the suite, walk the stack, inspect state, check shapes, dtypes, NaNs, identities, masks — and fix root by root until the whole board is green.\n\nThis is the shape of the real sixty minutes. The ladder taught the moves; the gauntlet teaches the order.\n\nThe bar to leave: handed a broken module you have never seen, you start with the test output — calmly — and end with all tests passed.",
  },
]

export const PROBLEMS_PDB: PdbProblem[] = []

export { PROBLEMS_PDB_A } from "./pdb-a"
export { PROBLEMS_PDB_B } from "./pdb-b"
export { PROBLEMS_PDB_C } from "./pdb-c"
export { PROBLEMS_PDB_D } from "./pdb-d"

import { PROBLEMS_PDB_A } from "./pdb-a"
import { PROBLEMS_PDB_B } from "./pdb-b"
import { PROBLEMS_PDB_C } from "./pdb-c"
import { PROBLEMS_PDB_D } from "./pdb-d"

PROBLEMS_PDB.push(...PROBLEMS_PDB_A, ...PROBLEMS_PDB_B, ...PROBLEMS_PDB_C, ...PROBLEMS_PDB_D)
