<div align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="Deriva logo" />
  <h1>Deriva</h1>
  <p><strong>Derive the algorithm. Don't memorize it.</strong></p>
  <p>An interactive platform for mastering DSA, System Design, and Low-Level Design through first-principles reasoning.</p>
</div>

---

## What is Deriva?

Deriva trains you to *derive* solutions from first principles instead of memorizing patterns. Every track follows **7-stage slow scaffolding**: each stage reuses the skeleton from the previous one and adds exactly **one new mental model** — so you always think *"I already know 90% of this problem."*

Three tracks, one philosophy:

| Track | Problems | What you practice |
|---|---|---|
| **DSA** | 700 | 14 topics (Trees, Graphs, DP, Backtracking…) × 50 problems each, with in-browser Python execution |
| **System Design (HLD)** | 45 | Requirements → API contracts → capacity math → components → naive → optimized → full designs (URL shortener, Twitter, WhatsApp) on an interactive architecture canvas |
| **Low-Level Design (OOP)** | 35 | Entities → responsibilities → relationships → state machines → god classes → design patterns → full systems (parking lot, LRU cache, Splitwise) |

## The 7-Stage Scaffolding

Every topic moves through the same arc:

```
Reflex → Core Mechanic → Tool Building → Naive (feel the pain)
  → Optimization (fix the pain) → Mastery (compose everything)
```

- **Naive before optimized** — you build the O(n²) version first and *feel* why it breaks, so the optimization is a relief, not a trick.
- **Progressive hints** — 3 levels per problem: direction → specifics → near-solution.
- **Solutions revealed only on demand** — struggle first, always.
- **Everything runs locally** — progress persists in your browser. Nothing is uploaded.

## Tech Stack

- **Next.js 16** (App Router, static export-friendly) + **React 19** + **TypeScript**
- **Pyodide** (CPython WASM) — Python runs entirely in your browser
- **@xyflow/react** — the interactive system-design canvas (drag, connect, validate architectures)
- **Zero backend** — static site; localStorage/IndexedDB persistence
- **PWA** — installable, offline-capable shell

## Getting Started

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

```bash
pnpm build      # production build (static routes prerender)
pnpm start      # serve the production build
```

## Project Structure

```
src/
  app/
    page.tsx              # landing — all tracks
    practice/             # DSA: 14 topics × 50 problems, Pyodide execution
    design/               # HLD: React Flow canvas + checklists + estimation
    lld/                  # LLD: OOP design with test-driven execution
    topic/[id]/           # topic hub — stage map + progress
    dashboard/            # cross-track progress
  components/
    app-shell.tsx         # global header, breadcrumbs, progress
    mobile-problem-nav.tsx# mobile navigation (stage-grouped select)
    logo.tsx              # the ∂ mark
  data/
    *.ts                  # 14 DSA topic files (50 problems each)
    system-design.ts      # 45 HLD problems (7 stages)
    lld.ts                # 35 LLD problems (7 stages)
    index.ts              # topic registry
public/
  icons/                  # PWA icons (180/192/512)
  manifest.webmanifest
  sw.js                   # service worker — cache-first assets, offline pages
docs/                     # product & curriculum design docs
```

## Authoring Content

Each problem is typed data with the same shape:

```ts
{
  id, stage, title, pattern, skill,
  statement, examples, why,
  starterCode, hints[3], solution, walkthrough, testCode
}
```

`testCode` runs against the student's code in Pyodide; `All tests passed!` marks completion. HLD problems add `requiredNodes`/`requiredEdges` (canvas validation), `checklist` (requirement scoping), or `estimation` (capacity-math reveal).

## Roadmap

- [x] DSA track — 700 problems with Pyodide execution
- [x] HLD track — 45 problems with React Flow architecture canvas
- [x] LLD track — 35 problems with test-driven OOP design
- [x] PWA — installable, offline shell
- [ ] CS fundamentals track (OS / DB / networking / concurrency)
- [ ] Mock interview mode — timed random problems across tracks
- [ ] Pattern library — cross-topic mental models
- [ ] Trace-based visualizations (animate your own code's execution)

## License

MIT
