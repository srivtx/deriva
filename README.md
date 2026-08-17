<div align="center">
  <img src="public/icons/icon-moss.svg" width="96" height="96" alt="Deriva moss logo" />
  <h1>Deriva</h1>
  <p><strong>Derive the algorithm. Don't memorize it.</strong></p>
  <p>A reasoning-first workspace for DSA, system design, low-level design, and AI/ML systems.</p>
  <p>
    <a href="https://deriva.srivtx.xyz">Open Deriva</a>
    &nbsp;&middot;&nbsp;
    <a href="https://deriva.srivtx.xyz/android">Android install</a>
    &nbsp;&middot;&nbsp;
    <a href="https://deriva.srivtx.xyz/downloads/deriva-android.apk">Download APK</a>
  </p>
</div>

<p align="center">
  <strong>Moss green by default.</strong> Technical voice. Local-first progress. Python in the browser.
</p>

## The Product

Most learning platforms show an algorithm and ask you to recognize it later. Deriva reverses
that order. It creates the need for the idea, gives you a small space to experiment, and
only exposes implementation after you have designed the reasoning.

Every lesson follows the same nine-stage arc:

```text
Understand -> Play -> Reason -> Discover -> Design
    -> Implement -> Execute -> Reflect -> Generalize
```

The goal is not to finish another list. The goal is to leave with a method you can recreate
on a problem you have never seen.

## What You Can Do

| Surface | What it is for |
| --- | --- |
| DSA | 700 problems across 14 topics, with first-principles scaffolding and in-browser Python |
| System Design | 45 architecture problems with requirements, capacity math, components, and validation |
| Low-Level Design | 35 object-design problems with entities, relationships, state machines, and patterns |
| AI/ML Systems | Labs, question tracks, production projects, and systems scenarios |
| Pattern Journal | A personal record of the reusable thinking moves you have earned |
| Learning Observatory | Progress, next actions, review cues, and transfer evidence in one view |
| Game Mode | Interactive practice for invariants, decisions, compression, and system behavior |

## The Learning Contract

- Concepts come before reasoning, patterns, and implementation.
- Hints are questions before they become explanations.
- Naive solutions appear before optimizations when the contrast teaches something.
- Your own execution produces the trace and the visualization.
- Progress stays local to the browser in the v0 product.
- There are no streaks, leaderboards, or urgency mechanics.

## Install

### Web App

Open the production app at [deriva.srivtx.xyz](https://deriva.srivtx.xyz). The site is
installable as a PWA and can use a logo saved from Settings when Chrome offers the browser
install prompt.

### Android APK

Use the [Android install page](https://deriva.srivtx.xyz/android) to download the signed
Trusted Web Activity APK. The current release is version `1.2` with package ID
`xyz.srivtx.deriva`.

The installed APK includes native launcher icon controls. Open Settings inside the app and
choose **Change app icon in Android app** to preview and apply:

- Moss green
- Deriva blue
- Ember warm
- Violet night
- Cipher deep green
- Crypto gold
- Orbit electric blue

The APK also lets you choose a local image and pin it as a custom home-screen shortcut on
supported launchers. The signed APK launcher icon itself uses the bundled choices above;
arbitrary APK resource replacement requires rebuilding and signing a new release.

## Local Development

Requirements: Node.js, pnpm, and Python 3 for the optional curriculum-bank checks.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Production build and server:

```bash
pnpm build
pnpm start
```

Validation:

```bash
pnpm typecheck
pnpm test
node scripts/extract-bank.mjs
python3 scripts/verify-bank.py /tmp/deriva-bank.json
```

## Android Release Build

The repeatable Trusted Web Activity project lives in `android/deriva-twa`. The signing
keystore stays outside the repository and its password is read from the macOS Keychain.

```bash
JAVA_HOME="$(/usr/libexec/java_home -v 17)" \
ANDROID_HOME="$HOME/.bubblewrap/android-sdk" \
DERIVA_KEYSTORE_PATH="$HOME/.config/deriva-android/deriva-release.jks" \
DERIVA_KEYSTORE_PASSWORD="$(security find-generic-password -s deriva-android-keystore -w)" \
android/deriva-twa/gradlew -p android/deriva-twa assembleRelease

cp android/deriva-twa/app/build/outputs/apk/release/app-release.apk \
  public/downloads/deriva-android.apk
```

If the signing key changes, update `public/.well-known/assetlinks.json` with the new
SHA-256 certificate fingerprint before publishing. Never commit the keystore or its
password.

## Architecture

```text
typed curriculum
      |
      v
9-stage learning engine -----> local progress and preferences
      |
      v
Pyodide in a Web Worker -----> immutable execution trace
                                    |
                                    v
                         visualizers, replay, reflection
```

The application has no runtime backend in the v0 architecture. Python execution runs in a
dedicated worker, progress is local-first, and the visualization layer reads traces rather
than executing student code itself.

## Repository Shape

```text
src/app/                 Next.js routes and product surfaces
src/curriculum/          Typed lesson and question data
src/learning/             Nine-stage learning engine
src/execution/            Pyodide bridge, tracing, and simulation runtime
src/viz/                  Pure trace replay and visualization panels
src/persistence/          Local preferences and progress boundaries
public/                   PWA assets, manifest, APK, and Asset Links
android/deriva-twa/       Rebuildable signed Android project
docs/                     Product, curriculum, and architecture constitution
```

## Roadmap

- [x] DSA, HLD, LLD, AI/ML, games, and pattern surfaces
- [x] Nine-stage reference lesson for tree recursion
- [x] PWA install flow with local identity customization
- [x] Signed Android APK with native icon settings
- [x] Moss-green product identity and technical default voice
- [ ] Port every legacy problem into the full nine-stage lesson engine
- [ ] Trace-based visualizations for every structure family
- [ ] CS fundamentals track: operating systems, databases, networking, and concurrency
- [ ] Mock interview mode without turning practice into a leaderboard

## License

MIT
