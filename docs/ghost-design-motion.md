# Ghost — Design & Motion Research Notes

Branch: `ghost/faster-smarter`
Scope: the v16 polish pass. What the current motion/interaction design
literature says (2025–26 sources, deliberately recent), which principles we
adopted, which we rejected, and exactly what shipped. Companion to
`ghost-optimization.md` (performance) — this file is about *feel*.

The one-line thesis from every source below, paraphrased: **the difference
between "works" and "feels expensive" is choreography** — where things
enter from, how they settle, whether state changes are continuous or
teleporting, and whether any of it janks. Motion is the product.

## 1. Sources (recent, read before designing)

### Motion engineering

| Source | Date | The usable idea |
|---|---|---|
| *Springs and Bounces in Native CSS* — joshwcomeau.com | Oct 2025 | `linear()` lets CSS express real spring physics (damped oscillator), not just cubic-béziers. Springs read as "physical" because position is continuous through the whole curve; béziers read as "computed". Generate stops from the physics, don't eyeball them. |
| *Using CSS linear() for spring animations in UI* — ics.media | Apr 2026 | Practical recipes: short springs (≤0.55s) for enter-animations, near-critical damping for large surfaces (sheets), underdamped for small elements (chips, avatars). Overshoot on big surfaces feels broken; overshoot on small elements feels alive. |
| `<easing-function>` reference — MDN, updated | Apr 2026 | `linear()` is baseline-safe across the 2025+ browser set. Unknown easing values invalidate a whole shorthand — declare fallbacks as separate longhand declarations. |
| Chrome Developers, *complex animation curves with linear()* | 2023→2025 | The generator math: sample the physics at N points, emit percentages. Same math we used (see `scripts/ghost_spring_curves.py` in the workspace). |

### AI-chat interaction patterns (what a chat surface owes the user)

| Source | Date | The usable idea |
|---|---|---|
| *AI Chat UI Best Practices* — thefrontkit.com | Feb 2026 | Streaming should render token-by-token; a **visible stop control during generation is non-negotiable**; typing/thinking state must appear *where the reply will land*, not in a toolbar. |
| *15 Chatbot UI Design Best Practices* — conferbot.com | Nov 2025 | Latency 1–3 s: thinking indicator. >3 s: progress text ("first reply warms the engine"). The indicator must appear **within 100 ms** of send or the tap feels dead. |
| *Chatbot UI Design Patterns and Best Practices* — fuselabcreative.com | 2026 | Quick-reply chips stagger in and steer the first message; typing indicator is "the conversation is still moving" — motion itself carries the affordance. |
| *How to Design Chatbot UX: 2026 Conversational UI Patterns* — parallelhq.com | May 2026 | Clean surface beats feature density; legible type, consistent spacing, one accent. |
| *What I've learned from 18 months of AI conversational UI design* (r/UI_Design round-up) | Apr 2025 | In-chat elements (chips, stop, copy) beat chrome buttons; artifacts/inline blocks are where quality is *felt*. |

### Sheets & mobile ergonomics

| Source | Date | The usable idea |
|---|---|---|
| *Bottom Sheets: Definition and UX Guidelines* — NN/g | classic, still canonical | Sheets are "temporary context, parent stays reachable": dim + blur backdrop, drag handle as affordance, dismiss must mirror the entry gesture (swipe down), exit faster than entry. |
| *How to design bottom sheets* — LogRocket blog | May 2025 | Cap at ~85 dvh, contain internal scroll, and **animate the exit** — instant unmount is the #1 reported "glitchy" complaint. |
| *Bottom Sheet UI patterns* — mobbin.com, ripplix.com galleries | 2025–26 | Settle spring with ~4–8% overshoot max; backdrop opacity tracks drag progress 1:1 during a swipe. |

### Accessibility & restraint

| Source | Date | The usable idea |
|---|---|---|
| *prefers-reduced-motion* — web.dev | canonical | Design a reduced-motion variant: keep opacity, drop transforms/parallax. Never remove feedback — replace motion with an equivalent static state. |
| *Design accessible animation* — pope.tech blog | Dec 2025 | Every animation we ship must answer "what does a motion-sensitive user get instead?" — ours: fades only, no entrance travel, no shimmer. |
| Micro-interaction round-ups — medium.muz.li (Mar 2026), IxDF (Dec 2025), userpilot (Aug 2026) | 2025–26 | Micro-interactions have four parts (trigger, rules, feedback, mode); feedback that arrives <100 ms is perceived as "part of the tap", not a response to it. |

## 2. Principles adopted (and the ones we rejected)

**Adopted:**

1. **Physics, not curves.** All enter-animations use generated spring
   `linear()` stops (damped oscillator, sampled at 27 points):
   `--g-ease-settle` (ζ 0.86 — sheets and large surfaces, no visible
   bounce), `--g-ease-pop` (ζ 0.60 — messages, pills), `--g-ease-micro`
   (ζ 0.68, 340 ms — chips, icon confirms). Nothing eases "in-out" —
   real objects enter fast and settle.
2. **Continuity of state.** Every surface change is animated through the
   change, never teleported: sheets enter *and* exit, send↔stop morphs
   in one button, the thinking state appears where the reply will land
   and dissolves into the streamed text, the caret rides inside the text
   flow.
3. **100 ms rule.** Thinking indicator mounts instantly (no fade-in
   delay); presses confirm within one frame; the download screen's
   indeterminate state starts moving the moment "connect" begins, so 0%
   never looks frozen.
4. **Small things bounce, big things settle.** The 425 MB model card
   doesn't bounce; the copy-check does. Overshoot budgets: 0% on sheets,
   ~9% on message pop, ~5% on micro.
5. **Motion carries hierarchy.** Suggestion chips stagger 45 ms apart —
   they read as a list of *options*, not one block. Empty-state greeting
   rises as the face's ping rings out. Errors slide in and stay red-dot
   marked — they're worth seeing.
6. **Reduced motion is a first-class variant.** One media-query block
   swaps springs for `ease-out`, kills travel/shimmer/float, keeps every
   opacity fade. Feedback survives; physics doesn't.
7. **Exit = entry, accelerated.** Sheets enter 420 ms (settle spring),
   exit 200 ms ease-in. Backdrops fade out. Nothing just disappears —
   disappearing is what users report as "glitchy".

**Rejected (with reasons):**

- **Full page view-transitions between app phases** — React state churn
  (streaming, progress) fights cross-document snapshots; risk >> polish
  for a chat surface. The phase containers animate themselves instead.
- **Per-token JS-staggered reveals with Framer Motion** — a 300-token
  reply would mount 300 animated components at 90 ms flush intervals;
  on mid-tier Android that's jank we can't take back. We reveal at word
  granularity with pure-CSS fades on appended spans (cheap, no library).
- **Typewriter (character-by-character) streaming** — every source above
  treats token-stream rendering as the honest signal; faking a slower
  typewriter *adds* latency. We stream as fast as the model produces,
  and spend the animation budget on *how* words materialize instead.
- **Bounce on the model cards / summon button** — big surfaces, per
  principle 4.
- **Confetti / emoji reactions / sound** — not this product's voice.

## 3. What shipped (v16)

Motion system (globals.css, Ghost v16 block — append-only, house style):

- `--g-ease-settle / --g-ease-pop / --g-ease-micro` spring easings
  (generated, see above) + reduced-motion fallbacks.
- Phase containers (`intro / downloading / loading / ready`) rise+fade
  in on mount; intro children stagger.
- Messages: user bubble pops (spring, 9% overshoot), assistant fades;
  **word-level reveal** — appended words materialize with a 260 ms fade
  and 2 px rise, keyed by char offset (append-only streaming makes the
  key free), no re-mount of revealed text.
- Caret: soft rounded block with a breathing pulse, rendered inline as
  the last child of the live paragraph (it rides the text, no line
  drop).
- Thinking indicator moved to **the bottom of the stream** (was floating
  at the top of the scroller — out of view after send, read as "did the
  tap work?"); mounts instantly, shows elapsed→tok/s, dissolves when
  tokens land.
- Download bar: clean fill + moving sheen, honest indeterminate shimmer
  during connect/verify/store, width eased with the settle spring.
- Sheets (settings + history): spring entry, **animated exit**,
  drag-to-dismiss on the whole sheet (backdrop opacity tracks the drag
  1:1), Escape closes, focus returns to the invoker.
- Send↔stop: one button, icon crossfade + 90° rotate morph.
- Jump pill: sticky inside the scroller (can never overlap the composer
  when the textarea grows), spring pop.
- Micro: copy→✓ check morph, chip stagger, icon-button press springs,
  model-card press, Ghost-face idle float (subtle 3 s), haptics kept.
- A11y: `:focus-visible` rings on every control, `role="dialog"` +
  `aria-modal` on sheets, 40 px icon buttons, `touch-action:
  manipulation` (kills double-tap-zoom on buttons).
- Modern CSS, progressive: `text-wrap: balance` on the hero lines,
  `field-sizing: content` assists the auto-grow textarea where
  supported, `linear()` guarded by `@supports` with ease-out fallback.
- Dead CSS pruned: ten selectors the UI no longer renders (spec rows,
  gauge, gear, msg-tag, brains wrapper…) — less cascade, less override
  fragility.
- `interactiveWidget: "resizes-content"` in the viewport export — the
  Android keyboard now resizes the composer instead of covering it.

Bugs found during the v16 review pass (all fixed, E2E-verified):

- **Duplicated history rows.** `persistSession` called `setActiveId`
  inside a `setSessions` updater and was invoked again from the
  completion path with a stale `activeId` closure — every first message
  of a new chat spawned 2–3 sessions (2 from the double-call, a 3rd
  under StrictMode). Fixed with a ref-mirrored active id (no stale
  closures), the session id generated outside the updater, and a
  guarded, idempotent insert. Verified: one send → exactly one row.
- **App header floated above the sheet scrim.** The app-mode header
  sits at z-index 100; the sheet backdrop was z-index 60 — the modal
  dimmed the page but left the header bright. Backdrop is now 130
  (above the shell's more-menu at 120), verified by hit-testing and
  pixel-brightness comparison (header band 246 → 140 with the scrim).
- **Thinking indicator lived at the top of the scroller** — out of
  view after send, which reads as "did the tap work?". It now mounts
  where the reply will land, shows elapsed → tok/s, and dissolves
  when tokens arrive.
- **Brain-row text could overflow** the sheet's narrow columns —
  name/meta now ellipsize.

Every animation above has a reduced-motion variant; every interactive
state change has both an enter and an exit. The rule for the next person
adding motion here: **if a state change can't be animated through, change
the state later.**
