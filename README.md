# Deriva

**Derive the algorithm.** An interactive platform for learning data structures
and algorithms through first-principles derivation — the trace is the product,
code is the last stage, and every visualization is a pure function of
`(trace, cursor)`.

## What makes Deriva different

- **Concepts → Reasoning → Patterns → Implementation.** Every problem follows a
  nine-stage derivation flow; each stage teaches exactly one thinking move.
- **Naive before optimized**, wherever the contrast teaches something (Rule A3).
- **Typed curriculum.** Lessons are zod-validated data — content errors are
  build errors.
- **No gamification debt.** Progress is what you can derive again, not points.

## Product surface

| Area | Route | What it is |
| --- | --- | --- |
| Drill mode | `/practice`, `/topic/*` | Topic drills with full 9-stage derivations |
| Guided lessons | `/learn/*` | Concept-first interactive lessons |
| Daily challenge | `/daily` | One spaced pick per day, streak-tracked |
| Review queue | `/review` | Spaced repetition over solved problems |
| ICPC ladder | `/icpc` | 75 contest problems, ranked by difficulty |
| Pattern quiz | `/patterns/quiz` | Recognition training across pattern families |
| Algorithm Atlas | `/atlas` | Watch algorithms move, step by step |
| Contest simulator | `/contest` | Three problems, one clock |
| Mock interview | `/interview` | Timed hints-locked practice |
| Complexity lab | `/complexity` | Interactive cost curves |
| Playground | `/playground` | Python execution in a Web Worker (Pyodide) |
| **Glyph Studio** | `/glyph` | Dot-matrix editor — draw light, animate frames, export PNG/SVG/JSON |
| Focus Dial | `/focus` | Braun-style rotary timer that re-tints the shell while running |
| Toolkit | `/toolkit` | Life toolkit: tasks, habits, focus and more |
| Settings | `/settings` | Full appearance system + workspace identity, searchable |

## Appearance system

Everything visual is user-owned and device-local:

- **14 themes** (Moss, Paper, Nothing, OP-1, Swiss, Nord, Solarized, Braun…),
  each combinable with accent colors, type voices (including Doto *Dot Matrix*
  and Space Grotesk *Instrument*), density, shape and texture.
- **4 icon-pack languages**: Classic strokes, Nothing dot-matrix bitmaps,
  OP-1 thin-line pictograms, and a **Personal pack** you draw yourself.
- **Customizable bottom navigation**: choose up to four slots, drag to reorder,
  and pick each slot's icon style (Auto / Classic / Dots / Line / Mark).
- **Logo marks**: Classic cipher, Nothing dot-D, or OP-1 line-D — one source
  feeds the header, favicon, apple-touch-icon and installed-app icon.
- A pre-paint boot script applies theme/pack/scale from localStorage before
  first paint (no flash of default theme). Don't remove it.
- Preferences never leave the device. Share codes (`deriva-theme:v1:…`) are
  opt-in QR/portable strings that merge through the same normalize pipeline.

## Architecture notes

- Next.js App Router + TypeScript + pnpm. `pnpm build` fails on any curriculum
  or type error by design.
- Design tokens in `src/app/globals.css` theme blocks; icons always render via
  `currentColor` so packs adapt to every theme and active-tab tinting.
- Service worker (`public/sw.js`): network-first HTML, cache-first immutable
  assets, versioned cache bumped with every deploy. Self-healing guards
  (`src/lib/recovery.ts`) detect stale-deploy chunk failures, purge caches once
  and reload — plus an error ring-buffer (`src/lib/diagnostics.ts`) surfaced in
  Settings → System for on-device debugging.
- Android TWA under `android/deriva-twa` ships three launcher-icon product
  flavors: `classic`, `nothing`, `opone`
  (`./gradlew bundle<Variant>Release`).

## Development

```bash
pnpm install
pnpm dev        # local dev server
pnpm typecheck  # tsc --noEmit
pnpm test       # vitest
pnpm build      # production build (also runs validation)
```

## Documentation

The `docs/` suite is the constitution — start at `docs/01-product-requirements.md`
and follow the reading order there. UI/appearance conventions live in
`docs/09-ui-ux-design-system.md`; when work touches anything described in docs,
update the corresponding doc in the same change.

## License

Private project © srivtx. All rights reserved.
