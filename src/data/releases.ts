export type ReleaseEntry = {
  version: string
  date: string
  title: string
  tagline: string
  highlights: { title: string; body: string }[]
}

export const RELEASES: ReleaseEntry[] = [
  {
    version: "1.6",
    date: "2026-10-14",
    title: "Pattern Cards & Smart Python Editor",
    tagline: "A 60-second reflex deck built for handheld phone use, and real Python code-intelligence across every practice workspace.",
    highlights: [
      { title: "Pattern Cards (/cards)", body: "A phone-first reflex deck of 36 flashcards matching every curriculum pattern. Trains the thinking move and underlying invariant instead of code memorization." },
      { title: "Phone-first ergonomics", body: "3D flip card physics, touch swipe gestures (left to revisit, right for got-it), haptic feedback, and one-thumb intuition probes." },
      { title: "Leitner spaced repetition", body: "5-box local-first scheduling with streaks, daily targets, and 3 session modes: Quick 5 (subway sprint), Due Reps, and All 36." },
      { title: "Python auto-indentation", body: "Drill mode (/practice), PDB drills, and Ultron AI workbenches gain automatic indentation on Enter after colons (:), bracket expansion for (), [], {}, and indentation preservation." },
      { title: "Tab & Shift+Tab indentation", body: "Indent and dedent single lines or multiline selections smoothly without browser focus-trapping." },
      { title: "Smart backspace & bracket pairing", body: "Backspace deletes full 4-space tab stops at indent levels, and typing (), [], {}, \"\", '' auto-pairs, wraps selection, and steps over closing characters." },
      { title: "⌘+Enter to run & error line gutter", body: "Run test suites directly from the keyboard. A synchronized line-number gutter highlights the exact traceback error line in red on failure." },
      { title: "Mobile quick-keys ribbon", body: "A dedicated key strip for phone coding with one-tap access to Tab, Dedent, :, (), [], {}, def, return, for, and if." },
    ],
  },
  {
    version: "1.5",
    date: "2026-08-26",
    title: "Ghost, the offline tutor",
    tagline: "A real language model living inside your phone — no cloud, no account, and it nudges with questions instead of handing you answers.",
    highlights: [
      { title: "Ghost", body: "Summon an offline AI tutor from the Studio drawer or App Center. One opt-in download (SmolLM2 Nano 101 MB or Lite 258 MB), then it works in airplane mode forever." },
      { title: "Two brains, your pick", body: "Nano for speed on any phone, Lite for deeper reasoning. Swap anytime from GHOST SETTINGS — install, switch, delete, all with verified storage numbers." },
      { title: "Hints only, always", body: "Ghost answers with one guiding question or the invariant to notice. The derivation stays yours — that is the whole point." },
      { title: "Real conversations", body: "Auto-titled history, reopen any past chat, new-chat without losing anything, and a stop button that actually stops." },
      { title: "Glyph Studio in the drawer", body: "The dot-matrix studio joined the home app library too, with its own icons in every icon-pack language." },
      { title: "Honest engineering", body: "Deletes verify bytes are gone (and sweep old leftovers), downloads show live MB progress, and every failure tells you why instead of staying silent." },
    ],
  },
  {
    version: "1.4",
    date: "2026-08-25",
    title: "The Super App drop",
    tagline: "Deriva becomes a daily habit: a challenge every day, a memory that reviews itself, and contests in your pocket.",
    highlights: [
      { title: "Daily Challenge", body: "One deterministic problem per day, same for everyone. Calendar history, streak-free tracking, and native share on Android." },
      { title: "Pattern Review Queue", body: "Spaced repetition for the patterns you have earned. Grade yourself, intervals adapt, everything stays local." },
      { title: "Contest Simulator", body: "Pick an ICPC section, get three problems and a live timer. Solves are detected automatically and scored with real penalties." },
      { title: "Mock Interview", body: "Random problem, countdown clock, hints locked. Self-score the debrief and watch your interview average improve." },
      { title: "Cheatsheet Hub", body: "Ten contest templates — binary search to KMP — each one tap from copy or the related practice set." },
      { title: "Python Playground", body: "A free sandbox with no problem attached. Run anything, keep the worker warm." },
      { title: "Android shortcuts + haptics", body: "Long-press the app icon for Daily, Practice, and ICPC. Solving now buzzes. New signed APK." },
      { title: "Life Toolkit", body: "Tasks, focus timer, habits, calculator, unit converter, regex tester, JSON formatter, password generator — everyday utilities, all local." },
      { title: "Complexity Lab + Notebook", body: "Time real executions at growing sizes and watch the Big-O curve appear. Every theory note you write lands in one searchable notebook." },
      { title: "Playground 2.0", body: "Line numbers, autosave, ⌘+Enter, copy and download — a real sandbox instead of a bare textarea." },
      { title: "Floating focus timer", body: "Start a 25-minute session and a quiet chip follows you across every screen — the clock never resets." },
      { title: "OS home screen", body: "Deriva opens onto a launcher: widgets, an app library with badges and filters, and apps that morph open." },
    ],
  },
  {
    version: "1.3",
    date: "2026-08-25",
    title: "The ICPC Ladder",
    tagline: "Seventy-five contest problems curated into a linear ladder.",
    highlights: [
      { title: "13 linear sections", body: "From ad-hoc warmups through geometry and game theory — each section assumes exactly the ones before it." },
      { title: "75 verified problems", body: "Every solution executed against its tests in real Python before shipping." },
      { title: "Load into editor", body: "Solutions can be loaded straight into the practice editor — no retyping." },
      { title: "Difficulty tags", body: "Easy, Medium, and Hard markers across the ladder and drill mode." },
    ],
  },
  {
    version: "1.2",
    date: "2026-08-25",
    title: "Moss identity",
    tagline: "A calmer, greener, more technical Deriva.",
    highlights: [
      { title: "Moss by default", body: "The whole workspace ships in opaque moss green with the new geometric mark." },
      { title: "Technical voice", body: "One precise sans-serif becomes the default reading voice." },
      { title: "Native icon settings", body: "The Android APK gains seven launcher icons, previewed and applied in-app." },
    ],
  },
  {
    version: "1.1",
    date: "2026-08-25",
    title: "Android, for real",
    tagline: "A signed app you can install, with its own identity controls.",
    highlights: [
      { title: "Signed APK", body: "A Trusted Web Activity served from the site itself, with Digital Asset Links verification." },
      { title: "Install page", body: "A green landing page with the download, install steps, and the browser-PWA alternative." },
    ],
  },
  {
    version: "1.0",
    date: "2026-08-24",
    title: "Foundations",
    tagline: "The workspace: drill mode, guided derivation, and a local-first promise.",
    highlights: [
      { title: "Drill mode", body: "775 problems across 14 DSA topics with in-browser Python and instant tests." },
      { title: "Nine-stage lessons", body: "The reference derivation: understand, play, reason, discover, design — before code exists." },
      { title: "Local-first", body: "Progress, notes, and identity never leave the device. No account, no upload." },
    ],
  },
]
