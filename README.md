<div align="center">
  <img src="public/favicon.svg" width="96" height="96" alt="Deriva logo" />
  <h1>Deriva</h1>
  <p><strong>Derive the algorithm. Don't memorize it.</strong></p>
  <p>An interactive platform for mastering DSA, System Design, and Low-Level Design through first-principles reasoning.</p>
</div>

---

## What is Deriva?

Deriva trains you to *derive* solutions from first principles instead of memorizing patterns. Every lesson follows a **9-stage guided flow**: each stage reuses the skeleton from the previous one and adds exactly **one new mental model** — so you always think *"I already know 90% of this problem."*

Three tracks, one philosophy:

| Track | Problems | What you practice |
|---|---|---|
| **DSA** | 700 | 14 topics (Trees, Graphs, DP, Backtracking…) × 50 problems each, with in-browser Python execution |
| **System Design (HLD)** | 45 | Requirements → API contracts → capacity math → components → naive → optimized → full designs (URL shortener, Twitter, WhatsApp) on an interactive architecture canvas |
| **Low-Level Design (OOP)** | 35 | Entities → responsibilities → relationships → state machines → god classes → design patterns → full systems (parking lot, LRU cache, Splitwise) |

## The 9-Stage Guided Flow

Every problem moves through the same arc:

```
Understand → Play → Reason → Discover → Design
  → Implement → Execute → Reflect → Generalize
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

Validation commands:

```bash
pnpm typecheck
pnpm test
node scripts/extract-bank.mjs
python3 scripts/verify-bank.py /tmp/deriva-bank.json
```

## Android App

The signed Android Trusted Web Activity is available at [/android](/android), with the
APK served from [/downloads/deriva-android.apk](/downloads/deriva-android.apk). The
Digital Asset Links declaration lives at `public/.well-known/assetlinks.json`.

To rebuild the release APK locally, keep the keystore outside the repository and expose
its password through the macOS Keychain entry used by the project:

```bash
JAVA_HOME="$(/usr/libexec/java_home -v 17)" \
ANDROID_HOME="$HOME/.bubblewrap/android-sdk" \
DERIVA_KEYSTORE_PATH="$HOME/.config/deriva-android/deriva-release.jks" \
DERIVA_KEYSTORE_PASSWORD="$(security find-generic-password -s deriva-android-keystore -w)" \
android/deriva-twa/gradlew -p android/deriva-twa assembleRelease
cp android/deriva-twa/app/build/outputs/apk/release/app-release.apk public/downloads/deriva-android.apk
```

If the signing key changes, update `public/.well-known/assetlinks.json` with the new
SHA-256 certificate fingerprint before publishing the APK.

The green Android page also offers a browser-installed app using the logo saved in
Settings. That custom-icon install is separate from the signed APK, whose launcher icon
is packaged at build time.

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
    logo.tsx              # editorial d monogram and wordmark
  data/
    *.ts                  # 14 DSA topic files (50 problems each)
    system-design.ts      # 45 HLD problems
    lld.ts                # 35 LLD problems
    index.ts              # topic registry
public/
  favicon.svg             # browser favicon
  icons/                  # PWA icons (180/192/512 + maskable)
  manifest.webmanifest
  .well-known/assetlinks.json # Android app/site association
  downloads/deriva-android.apk # signed Android release artifact
  sw.js                   # service worker — cache-first assets, offline pages
android/deriva-twa/       # repeatable Trusted Web Activity release project
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
- [x] Signed Android app — TWA build, download page, and app/site verification
- [x] Reference nine-stage guided lesson — Trees recursion reflex (`/learn/trees/sum-1-to-n`): derive the contract before the editor exists
- [ ] Port remaining topics into nine-stage lesson modules
- [ ] CS fundamentals track (OS / DB / networking / concurrency)
- [ ] Mock interview mode — timed random problems across tracks
- [ ] Trace-based visualizations for all structure families

## License

MIT
