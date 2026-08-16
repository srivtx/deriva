# 09 — UI/UX Design System

**Design thesis:** *a calm academic page fused with a precise instrument.*
The student should feel they are reading a beautiful textbook that happens to contain a
laboratory. Every visual decision serves one of two masters: **narrative** (the story of
the idea) or **instrumentation** (the state of the execution). Nothing serves decoration.

---

## 1. Experience Principles

1. **The stage is the screen.** Each of the 9 stages has a distinct layout grammar. The
   student always knows *where in the act of discovery* they are, before reading a word.
2. **Two surfaces, one mind.** The **textbook surface** (narrative, questions) and the
   **workbench surface** (sandbox, editor, visualization) are both visible whenever both
   are alive. Thinking happens in the seam between them; we never make the student
   alt-tab between explanation and experiment.
3. **The student is the protagonist.** Their code, their constructed answers, their
   trace — always rendered with more care than ours. Reference solutions look *plain*;
   student work looks *important*.
4. **Calm by default, vivid at the moment of insight.** Neutral palette; the one accent
   color is spent almost exclusively on "this is the discovery" moments and active
   execution state.
5. **No dark patterns of engagement.** No streak flames, no XP bars, no red notification
   badges. Progress visualization = the journey rail and the pattern journal — intrinsic
   artifacts, not slot-machine chrome.

## 2. The Core Navigation Metaphor: The Stage Rail

The persistent left rail is the product's compass:

```
  TREES · 5 Optimization          ┌──────────────────────────────┐
  ────────────────────────────    │                              │
   1 Understand  ✓                │        STAGE SURFACE         │
   2 Play        ✓                │      (per-stage grammar)     │
   3 Reason      ✓                │                              │
   4 Discover    ✓                │                              │
   5 Design      ✓                │                              │
   6 Implement   ●  ← you are here│                              │
   7 Execute     ○                │                              │
   8 Reflect     ○                │                              │
   9 Generalize  ○                │                              │
                                  │                              │
  pattern so far:                 │                              │
  ▣ Returning Tuples              │                              │
```

- Completed stages: check. Current: filled dot + the rail expands its one-line
  purpose. Locked: hollow, with the gate requirement on hover ("Design your return
  type to unlock").
- Below the rail: the **pattern strip** — patterns earned so far in this topic
  (Rule C2 made visible). The rail quietly teaches the course outline.
- The rail is also the *only* way stages are navigated — and it enforces gates
  (locked stages are unreachable except via "test me out", Rule B1).

## 3. Per-Stage Layout Grammar

| Stage | Textbook surface | Workbench surface | Dominant verb |
|---|---|---|---|
| 1 Understand | Problem narrative + interactive examples | Example instances the student can scrub inputs on | predict |
| 2 Play | Minimal — a single experiment prompt at a time | **Full-bleed sandbox** (click/drag/mutate structure) | touch |
| 3 Reason | Socratic dialogue (one question visible at a time) | The sandbox, now with the question's focus *highlighted* | answer |
| 4 Discover | Question recap | **Artifact builder** (slot-machine construction, Rule B5) | construct |
| 5 Design | Contract explainer | Structured design form (signature/state/traversal/complexity) | specify |
| 6 Implement | Tests + hint ladder (collapsed) | **Code editor takes over the workbench** | write |
| 7 Execute | Minimal | **Visualizer full-bleed** + transport (play/step/scrub) + panel dock | watch |
| 8 Reflect | Guided reflection prompts | The student's own trace, annotated side-by-side with the naive trace (when applicable, Rule A3) | explain |
| 9 Generalize | Pattern card + related problems | — (textbook-only stage) | connect |

Desktop: resizable split (textbook 40% / workbench 60%, draggable seam, remembered per
stage). Mobile (<768px): stacked, workbench first for Play/Execute stages, textbook
first otherwise; the rail collapses to a horizontal stepper.

### 3.1 Mobile PWA delivery contract

The installed phone experience is an app surface, not a squeezed desktop page:

- A safe-area-aware app bar holds only the current destination, a home affordance, and
  a compact progress signal. Desktop utility links never appear in this bar.
- Primary destinations live in a persistent bottom tab bar: Home, Learn, Patterns, Progress,
  and More. The active destination is the only accented tab; labels remain visible so icons
  are never the sole cue. More contains HLD, LLD, Expedition, Games, and Settings.
- Native `<select>` menus are not used for curriculum navigation on phones. Topic and
  problem choice open an in-app bottom sheet, grouped by curriculum beat, with the
  current item and completed work visible before selection.
- The primary stage action stays above the tab bar and respects the device safe area.
  On implementation screens, Run is the full-width first action; secondary actions
  remain available without competing with it.
- Mobile content scrolls inside the viewport between the app bar and tab bar. Page-owned
  sticky action bars are not allowed to float over reading content; stage actions remain in
  document flow and the scroll frame reserves the tab-bar inset.
- Completion must create a learning checkpoint, not merely a green pass state: name
  the reusable pattern and orient the learner to the next variation. This makes the
  curriculum's repeat-the-thinking rule visible in daily use.
- Dark mode swaps every surface through semantic tokens. No light-only card fills or
  low-contrast secondary text may be introduced in a component.
- Color is motivational when it marks a meaningful state: active work, correct work, earned
  patterns, and trace insight. Topic identity may use small muted markers, but full-page
  rainbow cards and ambient gradients must not compete with the learning action.

## 4. Tokens

```css
/* color — light "paper" theme (default) */
--paper:        #FAF9F6;   /* page */
--paper-raised: #FFFFFF;   /* cards, editor */
--ink:          #1A1D21;   /* primary text */
--ink-soft:     #5C6470;   /* secondary text */
--line:         #E4E1DA;   /* hairlines */

--accent:       #2E5AAC;   /* discovery blue — insight + active execution ONLY */
--accent-soft:  #E3EBF7;

/* viz state grammar (identical meanings in dark theme) */
--viz-untouched:#9AA3AD;   /* not yet visited */
--viz-active:   #2E5AAC;   /* currently visiting / on call stack */
--viz-settled:  #2F8F5B;   /* returned / finalized / correct */
--viz-cached:   #B07C24;   /* memoized / amber = "we already knew this" */
--viz-pruned:   #C34A3D;   /* killed branch / eliminated region */
--viz-pointer:  #7A4FA3;   /* named pointers (slow, fast, cur) — purple family */

/* dark "ink" theme: page #14161A, raised #1C1F24, text #E8E6E1,
   viz hues preserved, lightness inverted toward theme */

/* type */
--font-narrative: "Newsreader", serif;     /* textbook surface */
--font-ui:        "Inter", sans-serif;     /* controls, rail, forms */
--font-code:      "JetBrains Mono", mono;  /* editor, traces, complexity */

/* space & shape */
--sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-6: 24px; --sp-8: 32px;
--radius: 10px;            /* calm, not playful */
--shadow-raised: 0 1px 2px rgb(26 29 33 / .06), 0 4px 16px rgb(26 29 33 / .06);

/* motion */
--dur-fast: 150ms; --dur-med: 250ms; --dur-slow: 400ms;
--ease-standard: cubic-bezier(.2, 0, 0, 1);
```

Tailwind exposes these as semantic utilities only (`bg-paper`, `text-ink-soft`,
`text-viz-active`…). **Arbitrary hex values in components are a lint error** — the
grammar stays coherent mechanically (07 D7).

### 4.1 Personal Theme Profile

Settings may change the token profile without changing curriculum behavior. The
supported presets are `system`, `paper`, `ink`, `moss`, `violet`, and `sunset`.
Accent choices are `cobalt`, `ember`, `violet`, `mint`, `gold`, or a validated
custom hex color. Type voice choices are `editorial`, `technical`, and
`humanist`. The profile also owns the workspace name, tagline, logo mark, and a
local image logo capped at 240 KB. Surface language can be `calm`, `focused`,
or `compact`; shape can be `soft` or `precise`; texture can be `plain` or a
subtle study grid.

These values are stored in the versioned preferences boundary, applied through
root data attributes and CSS custom properties, and migrated from the original
`system/light/dark` preference values. Components must consume semantic tokens;
they must not branch on a user's selected preset or embed a second palette.

## 5. Typography Rules

- **Narrative is serif, instruction is sans.** The moment the platform *asks the student
  to do something*, it speaks in Inter. Ideas are Newsreader. The student can
  subconsciously sort "read this" from "do this" — a zero-cost cognitive off-load.
- Code is always JetBrains Mono, including inline code in prose and trace values.
- Scale: narrative 19–21px body (long-form comfort), UI 14px, code 14px. One fluid
  scale, no exceptions per-component.

## 6. The Visualization Grammar (the instrument language)

Consistent across ALL panels (tree, list, heap, grid, DP table, decision tree — 06
`viz/`). A student who learns the grammar in Trees reads DP tables fluently.

| Encoding | Meaning |
|---|---|
| grey | untouched / not yet visited |
| **blue** | active — on the call stack, currently compared, frontier head |
| **green** | settled — returned, finalized, part of the answer |
| **amber** | cached — memo hit, previously computed, "no work happened here" |
| **red + fade** | pruned/eliminated — murdered branches, discarded halves |
| **purple chip** | a named pointer (`slow`, `fast`, `cur`, `prev`) with its label traveling with it |
| **call-stack left edge** | the stack panel is always the leftmost dock panel; a node's blue ring pulses in sync with its frame |

Motion rules:
- Animate **only state changes** (color, position, pointer movement). Nothing idles,
  nothing floats. Ambient motion is banned.
- 150–400ms per transition, `ease-standard`. Scrubbing bypasses transitions (instant
  render at cursor t) — dragging time must feel like dragging time.
- The **transport** (play / step / step-back / scrub / speed) is one shared component
  under every visualization; keyboard: `space` play-pause, `←/→` step, `↑/↓` call depth.
- Every animated change has an optional **narrated caption** ("fib(3) returned 2 — from
  cache, no recursion") — this is also the screen-reader track (§8).

## 7. Component Inventory (build order follows roadmap)

**Primitives** (Radix-based): Button, Card, Tooltip, Dialog, Tabs, Slider, Select,
ResizablePanel, Toast(quiet).
**Product components:**
- `StageRail` (§2) — the compass.
- `SocraticDialog` — one question at a time; constructed-answer slots; the "why do you
  ask?" affordance that reveals what the question is probing (never the answer).
- `ArtifactBuilder` — Discover stage slot-machine (e.g., drag "height" and "balanced?"
  into the return tuple).
- `DesignForm` — Stage 5 contract with live structural feedback.
- `HintLadder` — levels unfold one at a time; each level a question (Rule B3); reveal
  button visually *costly* (quiet confirmation, logged — not punished).
- `Transport` — §6.
- `TracePanel` dock — tabs per structure + call stack; resizable.
- `PatternCard` / `PatternJournal` — the earned-pattern artifact; Stage 9 writes to it.
- `CounterexampleBuilder` — Greedy/BST stages: the student constructs inputs that break
  a proposed rule (the "spring the trap" tool — pedagogically central, Rule B2).
- `CurriculumMap` — the story-as-graph home screen: topics as chapters, patterns as the
  thread running through them.

## 8. Accessibility (non-negotiable, budgeted in every viz task)

- Keyboard: full flow operable without a pointer — rail navigation, sandbox nodes are
  focusable buttons, transport keys as above.
- Screen readers: `aria-live="polite"` narration channel mirroring §6 captions; SVG
  panels get `role="img"` + a generated text summary of current state ("heap array:
  9, 5, 7, 1; comparing index 1 and 3").
- Reduced motion: `prefers-reduced-motion` → instant transitions, captions carry
  sequence.
- Color never the sole channel: state grammar pairs color with shape/label (pruned =
  strikethrough edge, cached = dotted border, pointer = labeled chip).
- Contrast: all token pairs ≥ WCAG AA (checked in CI on token change).

## 9. The One Screen That Sells It

If a stranger sees one screen, it's **Stage 7 on Trees-05**: the student's own one-pass
diameter code animating — call stack growing, tuples flowing up as green chips, beside
the grayed ghost of their Stage-4 naive trace with its re-computed subtrees flashing
amber, and the counter showing 9 calls vs 25. That screen is the pitch: *you invented
this, and here is the proof of why it wins.*
