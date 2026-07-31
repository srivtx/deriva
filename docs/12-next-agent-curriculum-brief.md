# Next Agent Brief — Build the First Real Nine-Stage Lesson

## Objective

Replace the current direct-to-editor Trees practice experience with **one complete,
phone-first, typed nine-stage lesson**. This is the reference implementation for every
later lesson; do not broaden the task into converting the whole problem bank.

Use the first Trees lesson that teaches the recursion reflex (for example, sum from 1 to
N). The lesson must make the student derive the recursion contract before implementation.

## Why this is next

The current UI has a polished mobile shell, topic navigation, preferences, and a
next-problem path. Its core learning engine is still missing: learners can see the code
editor and solution before they have constructed the idea. That violates the product's
central order:

```
Concepts → Reasoning → Patterns → Implementation
```

Do not add more problem-bank content before this reference lesson proves the delivery
model.

## Required reading

Read these before editing anything, in this order:

1. `docs/01-product-requirements.md`
2. `docs/02-learning-philosophy.md`
3. `docs/03-curriculum-design-rules.md`
4. `docs/04-curriculum-architecture.md`
5. `docs/05-system-architecture.md`
6. `docs/06-folder-structure.md`
7. `docs/09-ui-ux-design-system.md`

## Scope

### Build

1. A typed lesson module for one Trees recursion-reflex problem, validated at build time.
2. A stage state machine with these exact ordered stages:
   - Understand
   - Play
   - Reason
   - Discover
   - Design
   - Implement
   - Execute
   - Reflect
   - Generalize
3. Phone-first stage surfaces:
   - Workbench before prose only for Play and Execute.
   - One active task/question at a time.
   - Primary action remains above the bottom tab bar and safe area.
   - The stage rail becomes a horizontal, gate-aware stepper on phones.
4. Gates that prevent entering Implement until the learner has constructed and passed a
   minimal Design artifact (function signature, base case, recursive step).
5. A small interactive sandbox for Play and a constrained answer builder for Discover.
   They must let the learner generate the recursion idea; they must not state it first.
6. Question-first hints: at least three question levels before an assertion.
7. A Reflect screen that saves/names the pattern **Recursive Leap of Faith**, plus a
   Generalize screen that links two later uses of the same pattern.

### Preserve

- Existing `/practice`, `/topic/[id]`, Settings, PWA app shell, and bottom navigation.
- Existing topic/problem data while the reference lesson is introduced alongside it.
- The execution boundary: Python runs outside the visualization; visualizers consume
  trace data and never execute student code.

### Do not build yet

- AI tutoring or generated explanations
- Cloud sync/authentication
- A generic lesson authoring CMS
- Conversion of every topic/lesson
- More visual polish unrelated to the first nine-stage learning loop

## Acceptance criteria

- The code editor and solution control do not exist before Stage 6.
- Every one of the nine stages is reachable only in order, except a documented mastery
  probe escape route.
- The learner performs one thinking move per stage; each move is named in ≤8 words.
- The naive/optimized contrast is not applicable to the recursion-reflex reference
  lesson; explicitly record that exception in its lesson data.
- The lesson works at a 390px-wide viewport without native select dialogs or content
  behind the bottom navigation.
- Keyboard flow, reduced motion, and dark mode remain usable.
- Lesson schema validation and relevant unit tests run in CI/build.

## Suggested implementation order

1. Define lesson and stage schema plus one validated Trees module.
2. Add the stage machine and persistence for stage artifacts.
3. Build Understand through Design on mobile first; verify the editor is absent.
4. Connect the existing editor as Stage 6 only.
5. Add a minimal deterministic Execute trace/replay surface.
6. Add Reflect/Generalize pattern handoff.
7. Add tests, then replace the old route only once the reference flow is complete.

## Verification

Run at minimum:

```bash
pnpm typecheck
pnpm build
git diff --check
```

Manually test at 390px width in light and dark mode. Confirm that completing a stage
unlocks only the next stage and that no solution is visible before Implement.

## Definition of done

One learner can start the Trees recursion-reflex lesson on a phone, construct a recursive
design before writing code, run their Python, explain the pattern, and leave with a
specific next transfer problem. The rest of the curriculum should be able to copy this
module's shape without inventing a new learning flow.
