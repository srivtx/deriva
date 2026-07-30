# 11 — Appendix: Concrete Lesson Example

Reference implementation of a complete lesson module. This is the spec-validation
exercise: if the schema in 05 §3 can express this lesson faithfully, the design holds.
If not, the schema changes — not the lesson.

This example is **Trees 3: Returning Tuples** (the "Leap" beat for the Trees topic).
It is the most architecturally demanding lesson in the reference curriculum because it
introduces the *artifact builder* (Stage 4), the *design contract* (Stage 5), and the
*tuple visualization* (Stage 7) all at once.

---

## A. `curriculum/topics/trees/03-returning-tuples/lesson.ts`

```ts
import { defineLesson } from "../../../schema/lesson"
import { mdx } from "../../../schema/mdx"
import prose from "./prose.mdx?mdx"
import solution from "./solution.py?raw"
import harness from "./harness.py?raw"

export default defineLesson({
  id: "trees/03-returning-tuples",
  topic: "trees",
  beat: "leap",
  thinkingMove: "return multiple values",          // ≤8 words, Rule A1
  purpose: "Discover that one return value is sometimes not enough",  // Rule A5
  dependencies: ["trees/01-tree-traversal", "trees/02-measurement-pattern"],

  stages: {
    // ──────────────────────────────────────────────────────────
    // STAGE 1 — Understand
    // ──────────────────────────────────────────────────────────
    understand: {
      prose,   // <-- the MDX file; Stage 1 blocks are in prose.mdx

      examples: [
        {
          id: "balanced-demo",
          input: { tree: [3,9,20,null,null,15,7] },   // level-order, null = absent
          prediction: {
            type: "binary",
            prompt: "Is this tree balanced? (A balanced tree's left and right subtrees differ in height by ≤1 at every node.)",
            // The student clicks True/False BEFORE seeing the answer
            reveal: { kind: "sandbox-highlight", show: "subtree-heights" }
          }
        }
      ]
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 2 — Play
    // ──────────────────────────────────────────────────────────
    play: {
      sandbox: {
        type: "tree",
        initial: [1,2,3,4,5,6,7],
        tools: ["click-node", "edit-value", "toggle-null"],
        prompt: "Click any node. What single number could this node return to its parent that would help the parent decide 'am I balanced?'"
      },
      experiments: [
        {
          id: "height-only",
          prompt: "Try solving 'is this balanced?' by returning only height from every node. Where does it break?",
          scaffold: { returnType: "single", name: "height" }
        }
      ]
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 3 — Reason (Socratic ladder)
    // ──────────────────────────────────────────────────────────
    reason: {
      socraticLadder: [
        {
          id: "r1",
          question: "When node 20 checks its left child (15) and right child (7), what does it know about each?",
          type: "checkbox",
          options: [
            { label: "Its height", value: "height", correct: true },
            { label: "Whether it is balanced", value: "balanced", correct: true },
            { label: "The original tree root", value: "root", correct: false },
          ],
          feedback: {
            correct: "Exactly — it knows both pieces. But can it return both?",
            wrong: "Think about what a recursive call actually gives back."
          }
        },
        {
          id: "r2",
          question: "Can ONE return value carry both 'height' and 'balanced'?",
          type: "constructed-choice",
          options: [
            { label: "Yes — return a tuple (height, balanced)", value: "tuple" },
            { label: "Yes — return height; balanced is global state", value: "global" },
            { label: "No — we need two separate traversals", value: "separate" },
          ],
          correct: "tuple",
          followUp: "r3"
        },
        {
          id: "r3",
          question: "If a node's left subtree returns (height=2, balanced=false), what should this node return?",
          type: "constructed-choice",
          options: [
            { label: "(max(2,1)+1, false) — one child is unbalanced, so I am too", value: "propagate-false" },
            { label: "(max(2,1)+1, true) — check my own symmetry", value: "check-self" },
            { label: "Raise an error — unbalanced trees break recursion", value: "error" },
          ],
          correct: "propagate-false"
        }
      ]
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 4 — Discover (artifact builder)
    // ──────────────────────────────────────────────────────────
    discover: {
      artifact: {
        type: "return-type-builder",
        prompt: "Design the return type of the recursive function. What does each node report to its parent?",
        slots: [
          {
            name: "primary",
            label: "What is the main value?",
            options: [
              { label: "height (int)", value: "height" },
              { label: "size (int)", value: "size" },
              { label: "max value (int)", value: "max" },
            ],
            correct: "height"
          },
          {
            name: "extra",
            label: "What extra information is needed?",
            options: [
              { label: "is_balanced (bool)", value: "balanced" },
              { label: "sum of subtree (int)", value: "sum" },
              { label: "Nothing extra", value: "none" },
            ],
            correct: "balanced"
          }
        ]
      }
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 5 — Design (contract form)
    // ──────────────────────────────────────────────────────────
    design: {
      contract: {
        signature: {
          prompt: "Write the function signature based on your discovery.",
          expected: { name: "check_balance", params: ["root"], returns: "tuple" },
          // The checker accepts any name but validates return-type shape
        },
        state: {
          prompt: "What state does each recursive call carry? (Select all that apply.)",
          options: ["height", "balanced", "max_val", "visited_set"],
          correct: ["height", "balanced"]
        },
        traversal: {
          prompt: "Which traversal order?",
          options: ["preorder", "inorder", "postorder"],
          correct: "postorder",
          hint: "Children must report before the parent can decide."
        },
        complexity: {
          prompt: "Derive the time complexity from the trace you'll watch in Stage 7.",
          expected: "O(n)",
          derivation: "Each node is visited once; the work per node is O(1)."
        }
      }
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 6 — Implement
    // ──────────────────────────────────────────────────────────
    implement: {
      starter: `def check_balance(root):
    # Return (height, is_balanced) for the tree rooted at 'root'
    # A leaf has height 0 and is balanced.
    # An empty tree has height -1 and is balanced.
    
    # Your code here:
    `,
      harness,   // builds tree from input, calls check_balance, emits semantic events
      tests: [
        { input: { tree: [] },         expect: [-1, True] },
        { input: { tree: [1] },        expect: [0, True] },
        { input: { tree: [1,2,3] },   expect: [1, True] },
        { input: { tree: [1,2,null,3] }, expect: [2, True] },
        { input: { tree: [1,2,3,4,null,null,5,6] }, expect: [3, True] },
        { input: { tree: [1,2,2,3,null,null,3,4,null,null,4] }, expect: [3, False] },
      ],
      hints: [
        { level: 1, type: "question", text: "What should an empty tree return?" },
        { level: 2, type: "question", text: "After getting (left_h, left_b) and (right_h, right_b), what must be true for THIS node to be balanced?" },
        { level: 3, type: "question", text: "If left_b is False or right_b is False, can this node be balanced?" },
        { level: 4, type: "assertion", text: "Return (max(left_h, right_h) + 1, left_b and right_b and abs(left_h - right_h) <= 1)" },
      ],
      solution
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 7 — Execute
    // ──────────────────────────────────────────────────────────
    execute: {
      traceConfig: {
        language: "python",
        budget: 5000,
        semanticOps: ["tree.visit", "tree.return-tuple"],
        // The harness emits StructureOp events for the tree panel
      },
      vizPanels: ["tree", "call-stack", "tuple-watch"],
      // tuple-watch: a custom mini-panel showing the (height, balanced) pair
      // flowing up the tree as green chips, animated per return event
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 8 — Reflect
    // ──────────────────────────────────────────────────────────
    reflect: {
      prompts: [
        "Why does returning a single height value fail to solve this problem?",
        "In the trace, find a node where both children returned. How did the parent combine them?",
        "What would happen if we tried to solve this with two separate traversals (one for height, one for balance)?",
      ],
      pattern: "returning-tuples",   // Rule C2 — deposited into journal
    },

    // ──────────────────────────────────────────────────────────
    // STAGE 9 — Generalize
    // ──────────────────────────────────────────────────────────
    generalize: {
      related: [
        "advanced-trees/06-mastery/max-path-sum",    // same tuple idea, open vs closed
        "dp/02-state-design/house-robber",            // state design as the same move
      ],
      revisitInDays: [3, 7, 21],   // v1 spaced repetition hook
    }
  }
})
```

---

## B. `prose.mdx` (narrative blocks, imported by lesson.ts)

```mdx
# Returning Tuples

## Stage 1 — Understand

You already know how to measure a tree. `height()` returns a single number.
But some questions need more than one number.

> **Prediction**: Is this tree balanced?
> (Click nodes to inspect; submit your answer before revealing.)

{/* The prediction component is bound to lesson.understand.examples[0] */}

A balanced tree: every node's left and right subtrees differ in height by at most 1.

## Stage 2 — Play

Here is a tree. Click any node and try to answer: "if I can only return ONE thing
to my parent, can I report both my height and whether I'm balanced?"

{/* Sandbox bound to lesson.play.sandbox */}

You'll find that `height` alone can't carry "am I balanced?" — and "balanced" alone
can't carry "how tall am I?" to compute the parent's height.

## Stage 3 — Reason

Let's think about what information flows.

{/* Socratic ladder auto-rendered from lesson.reason.socraticLadder */}

## Stage 4 — Discover

Design the return type. What does each node give its parent?

{/* ArtifactBuilder: slot-machine UI from lesson.discover.artifact */}

## Stage 5 — Design

Fill in the algorithm contract.

{/* DesignForm from lesson.design.contract */}

## Stage 6 — Implement

Write your function. The editor appears now — not before.

{/* CodeMirror bound to lesson.implement.starter + harness */}

## Stage 7 — Execute

Watch your code run. The green chips are (height, balanced) tuples flowing upward.

{/* Transport + tree panel + tuple-watch panel */}

## Stage 8 — Reflect

Why did the single-value approach fail? What does the trace show?

{/* Reflection prompts from lesson.reflect.prompts */}

**Pattern earned**: *Returning Tuples* — when one value isn't enough, design a
return type that carries everything the parent needs.

## Stage 9 — Generalize

This pattern returns in Advanced Trees (max path sum) and DP (state design).
```

---

## C. `harness.py` (the semantic-event emitter)

```python
# This runs inside Pyodide. It builds the tree, calls the student's function,
# and emits StructureOp events into the trace alongside sys.settrace events.

def build_tree(data):
    # level-order list → TreeNode objects (null = None)
    ...

def run_harness(student_fn, input_data, emit):
    root = build_tree(input_data["tree"])
    emit({"t": "structure", "op": {"kind": "tree.visit", "node": id(root)}})
    result = student_fn(root)
    emit({"t": "structure", "op": {"kind": "tree.return-tuple", "node": id(root), "value": result}})
    return result

# The tracer wraps student_fn with settrace; harness just calls it.
```

---

## D. What this example validates about the schema

| Schema feature | Validated by |
|---|---|
| Multi-stage lesson structure | The 9 `stages.*` keys all populated |
| Socratic ladder as data | `reason.socraticLadder[]` with branching (`followUp`) |
| Artifact builder (constructed answers) | `discover.artifact` with slots + options |
| Design contract checker | `design.contract` with expected shapes |
| Harness separation from student code | `harness` vs `solution` vs `starter` |
| Semantic trace events | `execute.traceConfig.semanticOps` + harness emits them |
| Pattern journal deposit | `reflect.pattern` + `generalize.related` |
| MDX prose separation | `prose` imported, not inline strings |
| Prediction in Stage 1 | `understand.examples[].prediction` |
| Hint ladder (question-first) | `implement.hints[]` with `type: "question"` levels |

**If any of these fields were missing from the schema, this lesson could not be
expressed.** The fact that it can be expressed means the schema in 05 §3 is
sufficient for the most demanding lesson in the reference curriculum.
