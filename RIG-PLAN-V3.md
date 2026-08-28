# RIG — PLAN V3 · DESIGN SYSTEM (TE × Nothing)
Date: Aug 28 2026 · **Precondition: RIG-PLAN-V2 acceptance script fully green.**
Design never blocks function and never touches harness code. All work stays in
`src/app/rig/*` (CSS + small presentational tweaks in `blocks.tsx`/`pickers.tsx`).
Vanilla CSS inside `page.tsx`'s `<Style>` — no Tailwind, no CSS framework, no new deps
except one font (below).

> **STATUS — EXECUTED Aug 28.** Tokens swapped in (`:root` V3 block, `--ink-faint`
> bumped to `#7a7a82` for ≥4.5:1 contrast). Doto loads via `next/font/google`
> (self-hosted, variable class on `.rig-root`). Type roles applied (Doto brand/state
> word/modal titles; stencil labels 9–10px; body 13px; tabular data). LED §4 complete
> incl. new `pending` state (glyph-pulse) used on approval cards. Sidebar is a
> patch list (hairline cells, active = s2 + 3px orange inset edge, 44px ✕ on mobile).
> Assistant msgs render markdown via a dep-free `RichText` parser (bold/em/inline
> code/lists/headings/fences) and `<think>…</think>` folds into a collapsed REASONING
> block. Assistant streaming rule = 3px green inset edge (`live` flag, cleared on
> done/tool_call). SEND inverts; running composer shows red STOP (haptics on
> approve/reject/stop). Modals: s1 + 1px orange header rule + Doto titles; pair QR on
> white pad; empty state = Doto RIG + one dot-grid zone. Reduced-motion kills all
> animation. QA renders verified desktop+mobile (Chrome headless). Remaining: §7.6
> human eye-pass on a live session.

---

## 1. RESEARCH DIGEST (why these choices)

**Teenage Engineering** (OP-1 field / TX-6 / Pocket Operators):
- "Constraints as aesthetic": a **five-color palette** — orange, true black, white,
  aluminum, OLED green — used across every product; instantly recognizable.
  Orange comes from industrial safety equipment: it says *engineered / important /
  not to be ignored*. True black, never dark gray.
- **Monospaced-only typography**: precision without narrative; tabular alignment for
  free; tight deliberate scale (9 / 11 / 13 / 16 / 22 px), uppercase labels at
  ~0.12em tracking, mixed-case only for prose.
- **Color = function**: on the OP-1 the four encoders are color-coded to on-screen
  parameters (blue, ochre, gray, orange). Interfaces "show exactly what is
  happening" — visible screws, honest materials, zero radius, 1px gaps between
  spec cells.
- Mechanical feedback: blink/step animations, no springs, no easing theatrics.

**Nothing (OS / Glyph):**
- **Monochrome-first with a single signal accent** (their red `#FF3030`): the accent
  appears ONLY as a signal — needs-decision, recording, over-limit — *0–2 accent
  elements per screen*. It is never decoration, never on hover states.
- **Active states INVERT black↔white; they do not colorize.**
- **Dot-matrix display type** (Ndot 55/57) for identity moments — clocks, product
  names — ≥24px only; not for body. Substitutes: **Doto** (variable round-dot font,
  on Google Fonts) or Silkscreen.
- Uppercase mono 11px @ 0.08–0.12em carries every label/button; borders 1px solid
  `#2E2E2E`; no shadows, no rounded cards; `glyph-pulse` keyframe (opacity 1→0.3→1,
  ~2s linear) for attention; dot-grid texture used sparingly — one zone per view.
- Motion: 150–400ms, cubic-bezier, **no bounce, no spring**.

**Synthesis for RIG:** TE's hardware palette + material honesty, Nothing's
typographic discipline and accent-as-signal rule. RIG's accent is **TE orange
`#FF4F00`** (identity/action), **OLED green `#00FF66`** = success/streaming (the
"screen"), **red `#FF3030`** = danger only. One dot-matrix identity moment per view
(wordmark + big status numerals) via **Doto**.

---

## 2. TOKENS (replace the current `:root` block in `<Style>`)

```css
:root{
  /* canvas + surfaces (true black, never dark gray) */
  --bg:#000; --s1:#0a0a0b; --s2:#141416; --s3:#1c1c1e;
  /* lines */
  --line:#26262a; --line-strong:#3a3a3f;
  /* ink */
  --ink:#f4f3ef; --ink-dim:#8e8e93; --ink-faint:#55555c;
  /* signals — TE palette, Nothing usage rules */
  --orange:#ff4f00; --green:#00ff66; --red:#ff3030;
  --font-mono:ui-monospace,"JetBrains Mono",Menlo,monospace;
  --font-dot:"Doto",var(--font-mono);
}
```
Rules: ≤4 greys visible per view; **orange appears 0–2 times per view** (primary CTA,
active selection, brand); green only for success/streaming/OK LEDs; red only for
danger/FAIL; nothing else gets color. Radius 0 everywhere. Borders 1px. No shadows.

## 3. TYPE (load Doto via `next/font/google`, weight ≤ 700, subsets latin)
| Role | Font | Size | Case/Tracking | Used for |
|---|---|---|---|---|
| Display/dot | Doto | 22–48px | uppercase, 0.02em | `RIG` wordmark, empty-state numerals, big READY/RUNNING state word |
| Label | mono | 9–10px | uppercase, 0.14em | chip labels, field labels, column heads |
| Meta | mono | 10–11px | uppercase, 0.12em | buttons, tabs, sys lines |
| Body | mono | 13px | none | transcript text, tool output |
| Data | mono | 12px | tabular-nums | paths, args, diffs, timestamps |

## 4. LED SEMANTICS (the whole status system — keep consistent)
| LED | Meaning | Animation |
|---|---|---|
| off (dim square) | idle rig / historical tool | none |
| on (green) | ready / tool OK | none |
| busy (orange) | streaming / running | `steps(2)` blink 1s |
| warn (red) | error / FAIL | `steps(2)` blink .6s |
| pending (orange, glyph-pulse 2s) | awaiting approval | slow pulse — distinct from busy |
LEDs are 9px squares, `box-shadow: inset 0 0 2px #000`, glow only via colored shadow.

## 5. COMPONENT SPECS (existing components, restyled — no rebuilds)
- **Top bar = transport bar:** `RIG` in Doto orange; chips are stencil labels
  (label 9px dim / value 11px ink) — active chip inverts (ink bg, black text), hover
  = border-color only; STOP is the only red-bordered control.
- **Sidebar = patch list:** rows as cells separated by 1px gaps (TE specs-grid), not
  floating cards; active row inverts to `--s2` with orange 3px left edge; ✕ and
  rename affordances 44px touch targets; relative time in `--ink-faint` 10px.
- **Transcript:** user bubble = `--s1` + aluminum border; assistant = plain ink text
  (no box) with a 3px green left rule while streaming, rule disappears on done;
  sys/err as 10px uppercase stencil lines. Dot-grid texture (`radial-gradient`
  dots at 8% opacity) allowed ONLY behind the empty state — one zone.
- **Tool cards = module cards:** 1px `--line` cell on `--s1`; header row = LED +
  stencil tool name + args summary; result in a black "screen" window (`--bg`,
  green-tinted text for OK, red for FAIL); diffs keep +/- coloring; tap-to-expand.
- **Composer = input strip:** `--s1` bg, orange border on focus; SEND inverts
  (white bg, black text) while running it becomes STOP; slash palette = `--s1`
  card, selected row inverted.
- **Modals = cards:** `--s1`, 1px orange header rule, Doto title, ESC/✕; overlay
  `rgba(0,0,0,.85)`.
- **Pair screen:** QR on white 8px pad (scannability beats theme), URL shown as text
  under it in green.
- **Empty state:** Doto "RIG" + dot-grid zone + one stencil instruction line. Nothing
  else.

## 6. MOTION & FEEL
- Allowed: opacity/border-color/color transitions 120–150ms linear; `steps(2)` blinks;
  `glyph-pulse` for approval-pending; instant state inversion.
- Forbidden: springs, bounces, transforms >2px, background-color flashes on hover,
  easing curves >200ms.
- Haptics (phone only, 3 sites): `navigator.vibrate?.(10)` on approve, reject, stop.
  Sound: none (explicitly out).

## 7. IMPLEMENTATION ORDER (each step: edit → tsc → look at the render)
1. Tokens + fonts (Doto) + type roles → sweep all class styles to tokens.
2. Transport bar + chips + sidebar (invert semantics, patch list).
3. Transcript + module cards + composer + palette.
4. Modals, pair screen, empty states, dot-grid zone.
5. Motion pass + haptics + reduced-motion respect
   (`@media (prefers-reduced-motion: reduce){ animation:none }`).
6. **Design QA (exit):** same state matrix as V2-D7 (2 themes × 2 sizes × all
   states) — check: contrast ≥4.5:1 for all text; orange count ≤2 per view; green/red
   only per §4; radius 0; borders 1px; no shadows; tap targets ≥44px; uppercase
   tracking consistent; exactly one dot-matrix zone per view; reduced-motion clean.

## 8. NON-GOALS
No themes, no light mode, no sound design, no animations library, no illustration,
no mascot, no refactor of Deriva's design tokens (RIG is a closed instrument panel —
it deliberately does NOT inherit Deriva's `--paper/--ink` system).
