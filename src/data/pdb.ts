// ── PDB — the debugging ladder ───────────────────────────────────────────────
// 92 problems, 24 stages, strictly linear: every problem hands you a broken
// module and a failing test suite, and teaches exactly one debugging move —
// from reading your first red test to hunting five root causes in unfamiliar
// code under a clock, and past it: masked roots hiding behind swallowed
// exceptions, algorithms lying about their invariants, and code that is
// correct but too slow. Tests are the spec; the traceback is the map; the
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
  {
    id: 11, name: "The Broken Text", desc: "strings are data you can point at",
    creed: "Text bugs are uniquely findable: every wrong answer is a string you can print and read character by character. split() without arguments collapses runs of whitespace — split(' ') happily manufactures empty tokens. A slice that ends one short drops exactly one item, and a case-sensitive key splits one person into three.\n\nThis stage trains point-at-it debugging: p line, p tokens, p s[i:i+2] — the evidence is the string itself.\n\nThe bar to leave: when text comes out wrong, you print the smallest piece that is wrong, not the whole page.",
  },
  {
    id: 12, name: "The Pattern", desc: "the regex means what it matches",
    creed: "A regex has no intentions. .* will eat everything up to the LAST quote, a bare . matches any character including the dot you meant, and a pattern without anchors matches happily in the middle of garbage. findall with groups returns tuples, not strings — and pretending otherwise produces keys nobody can read.\n\nThis stage drills reading the pattern as a machine reads it: greed, anchors, escapes, and the shape of what comes back.\n\nThe bar to leave: before blaming the code around it, you run the regex alone against the input and read what it actually returns.",
  },
  {
    id: 13, name: "The Shared Shelf", desc: "who owns this object?",
    creed: "Class attributes live on the class; instances that only read them share one object. __eq__ without __hash__ makes an object unfindable in sets. A method that forgets return self breaks every chain downstream, and a subclass that skips super().__init__ inherits a half-built self.\n\nThis stage installs the ownership question: is this attribute on the class or the instance, and who else holds it?\n\nThe bar to leave: 'works for one object, corrupts with two' instantly suggests shared state — and p self.__dict__ is the reflex.",
  },
  {
    id: 14, name: "The Dry Well", desc: "iterators are one-shot",
    creed: "A generator is a well: sum it and it is dry. Reading it twice yields the second-best bug class in Python — totals that are right and counts that are zero. One stray yield turns a normal function into a generator factory, zip quietly stops at the shorter list, and removing from a list while looping over it skips half the victims.\n\nThis stage teaches consumption-awareness: who is iterating, how many times, and what is left afterward.\n\nThe bar to leave: 'len() of a generator' or 'the second read is empty' immediately means materialize once, or fix the yield.",
  },
  {
    id: 15, name: "The Swallowed Signal", desc: "exceptions are information",
    creed: "An exception is a diagnosis. A bare except buries it, returns a default, and lets the patient walk out with the wrong prescription. Catching the wrong type misses the real crash, a broad handler placed before a narrow one makes the narrow one dead code, and a return in finally overwrites whatever the try decided.\n\nThis stage trains exception literacy: read what flew, catch exactly that, and keep the narrow handlers reachable.\n\nThe bar to leave: you treat 'it silently returns a default' as a bug in itself — and the pdb transcript showing the original exception as the proof.",
  },
  {
    id: 16, name: "The Slow March", desc: "correct is not enough",
    creed: "These drills pass every value test and still fail — on time. The brute force is not wrong; it is O(n²) where the input demands O(n). The fix is never a micro-optimization: it is a different shape — a counter instead of a double loop, a set instead of a scanned list, a table instead of a re-derivation, one pass instead of every window.\n\nThis stage teaches counting operations before counting seconds.\n\nThe bar to leave: when a test says 'too slow', you name the redundant work out loud before touching the code.",
  },
  {
    id: 17, name: "The Boundary", desc: "bugs live at the edges",
    creed: "Binary search dies at its bounds: an exclusive hi paired with a closed-interval loop silently skips the last candidate. A window that shrinks one step too late carries an extra element. Pointers that step the wrong way miss the pair that was there, and a range that forgets its +1 loses the day at the fencepost.\n\nThis stage drills edge-case thinking: empty, single, all, none, first, last.\n\nThe bar to leave: for any search, window or range, you can name what happens at both ends and at length 0 and 1.",
  },
  {
    id: 18, name: "The Number Line", desc: "arithmetic has defaults, and defaults lie",
    creed: "int() truncates toward zero — floor does not. round() is a banker: 2.5 rounds to 2. 0.1 + 0.2 is not 0.3, and abs() is not how you wrap a clock — modular arithmetic is.\n\nThis stage replaces trust in defaults with deliberate choices: math.floor for floors, an explicit half-up for money and stars, tolerance for floats, % for cycles.\n\nThe bar to leave: before comparing or rounding a number, you can say which convention the code uses and which the spec demands.",
  },
  {
    id: 19, name: "The Algorithm's Heart", desc: "the method itself is lying",
    creed: "Sometimes the implementation matches the textbook and the textbook is what got misremembered: Bellman-Ford run once when it needs n-1 passes, a find() that follows the parent chain exactly one step, a sift that swaps once and quits, a memo keyed on half its arguments.\n\nThis stage drills algorithm-level reading: know what invariant the method maintains, then check the code keeps it.\n\nThe bar to leave: you can state each algorithm's invariant in one sentence — and spot the line that lets it break.",
  },
  {
    id: 20, name: "The Statistician's Trap", desc: "the formula is the bug",
    creed: "Statistics has its own bug classes: n where the spec says n-1, E[X²] − E[X]² annihilating itself on large means, a wheel whose r compares against the wrong accumulator, a scaler that peeks at the test set.\n\nThis stage teaches formula audits: which estimator, which population, which statistics may be used at which time.\n\nThe bar to leave: 'the numbers are plausible but wrong' makes you ask which formula and which data it was computed from — in that order.",
  },
  {
    id: 21, name: "The Invariant", desc: "structures under contract",
    creed: "A cache that forgets recency on get evicts the wrong tenant. A matcher that pops without comparing accepts lies. A deque that slopes the wrong way reports the wrong maximum, and a shallow copy hands out the original's nested shelves.\n\nThis stage is about contracts between operations: what each method promises the others.\n\nThe bar to leave: for any small structure, you can write the two-call sequence that exposes a broken invariant — then fix the operation, not the caller.",
  },
  {
    id: 22, name: "The NumPy Depths", desc: "views, wraps, and unstable ties",
    creed: "Advanced NumPy fails silently in new ways: a slice is a view, so the 'copy' you mutate rewrites the original; an int32 cumsum wraps into negatives at two billion; searchsorted's side decides where equals land; argsort reversed breaks ties backwards.\n\nThis stage drills the array contract: memory ownership, dtype ceilings, tie conventions.\n\nThe bar to leave: 'the value is right but the array changed' or 'right until it overflows' sends you straight to .base, dtype, side and kind.",
  },
  {
    id: 23, name: "The Masked Root", desc: "bugs that hide bugs",
    creed: "The advanced finale: bugs that cooperate. A swallowed exception hides a typo so well that fixing the wrong thing first changes nothing. A zero total hides a wrong tax formula. One shared sort key breaks two consumers at once — and the vault composes five of these, one per move you learned after the gauntlet.\n\nThis stage trains sequential revelation: fix the net, read what it was hiding, fix that, keep going.\n\nThe bar to leave: after every fix you re-run the suite and read the NEW failures as progress, not punishment.",
  },
]

export const PROBLEMS_PDB: PdbProblem[] = []

export { PROBLEMS_PDB_A } from "./pdb-a"
export { PROBLEMS_PDB_B } from "./pdb-b"
export { PROBLEMS_PDB_C } from "./pdb-c"
export { PROBLEMS_PDB_D } from "./pdb-d"
export { PROBLEMS_PDB_E } from "./pdb-e"
export { PROBLEMS_PDB_F } from "./pdb-f"
export { PROBLEMS_PDB_G } from "./pdb-g"
export { PROBLEMS_PDB_H } from "./pdb-h"
export { PROBLEMS_PDB_I } from "./pdb-i"
export { PROBLEMS_PDB_J } from "./pdb-j"
export { PROBLEMS_PDB_K } from "./pdb-k"

import { PROBLEMS_PDB_A } from "./pdb-a"
import { PROBLEMS_PDB_B } from "./pdb-b"
import { PROBLEMS_PDB_C } from "./pdb-c"
import { PROBLEMS_PDB_D } from "./pdb-d"
import { PROBLEMS_PDB_E } from "./pdb-e"
import { PROBLEMS_PDB_F } from "./pdb-f"
import { PROBLEMS_PDB_G } from "./pdb-g"
import { PROBLEMS_PDB_H } from "./pdb-h"
import { PROBLEMS_PDB_I } from "./pdb-i"
import { PROBLEMS_PDB_J } from "./pdb-j"
import { PROBLEMS_PDB_K } from "./pdb-k"

PROBLEMS_PDB.push(...PROBLEMS_PDB_A, ...PROBLEMS_PDB_B, ...PROBLEMS_PDB_C, ...PROBLEMS_PDB_D, ...PROBLEMS_PDB_E, ...PROBLEMS_PDB_F, ...PROBLEMS_PDB_G, ...PROBLEMS_PDB_H, ...PROBLEMS_PDB_I, ...PROBLEMS_PDB_J, ...PROBLEMS_PDB_K)
