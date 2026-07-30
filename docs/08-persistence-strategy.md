# 08 — Persistence Strategy

**Decision: local-first (IndexedDB via Dexie) in v0, with a Postgres-shaped schema and a
single, typed sync seam for v1 (Supabase). No backend database in v0.**

---

## 1. What actually needs persisting (data inventory)

| Data | Shape | Write pattern | Read pattern | Size |
|---|---|---|---|---|
| **Lesson progress** | per (user, lesson): stage reached, stage artifacts (constructed answers, design contract), completion, timestamps | append/upsert on stage events | per-lesson on load; aggregated on curriculum map | tiny |
| **Code drafts** | per (user, lesson): latest source, history ring (last 10) | debounced on edit | on Stage 6 load | small |
| **Hint & reveal ledger** | events: hint level reached, solution revealed, mastery-probe attempts (pass/fail) | append-only | Stage-gate analytics, reflect stage, v1 spaced repetition | small |
| **Pattern journal** | per (user, pattern): earned-at, source lesson, revisit schedule, self-explained note | on Stage 8–9 completion | pattern library, practice queue | tiny |
| **Reflection notes** | free text per lesson | on Stage 8 | reflect stage, journal | small |
| **Saved traces** | recent N per lesson (N=3, capped bytes) | on run | Stage 7 reload, "compare traces" (v1) | **largest** — must be capped |
| **Preferences** | theme, motion, font scale, keyboard hints | on change | app boot | bytes |

Two properties jump out: everything is **per-user siloed**, and only traces have size
risk. Both point to the same design.

## 2. Why not the alternatives

| Option | Verdict | Reason |
|---|---|---|
| **Postgres/Supabase from day one** | ❌ v0 | No auth, one user, and PRD says avoid backend computation. Cold-start latency on free tier hurts the tight Stage-6 run loop. Adds operational surface (migrations, RLS, keys) before it adds value. |
| **localStorage only** | ❌ | 5MB cap, synchronous, string-only — traces and drafts outgrow it immediately. Fine for *preferences only*. |
| **SQLite (wa-sqlite / sql.js)** | ❌ now, 👀 later | Real SQL locally is appealing, but it's another WASM payload, query ergonomics over document-shaped data buy us nothing yet, and Dexie gives indexed queries + versioned migrations natively. Revisit if trace querying becomes analytical. |
| **File system (JSON files)** | ❌ as primary | Browser sandboxes make files awkward; but JSON **export/import** is a first-class feature (backup + migration insurance). |

## 3. v0 Schema (Dexie), designed as future Postgres tables

The one discipline that makes v1 cheap: **every table carries `userId` from day one**
(constant `"local"` in v0), and **learning events are append-only** (event-sourced) so
sync is replay, not conflict resolution.

```ts
// persistence/db.ts — Dexie schema (v1 of migrations)
db.version(1).stores({
  progress:      "[userId+lessonId], userId, lessonId, updatedAt",
  drafts:        "[userId+lessonId], userId, updatedAt",
  events:        "++id, [userId+lessonId], userId, kind, at",        // append-only ledger
  journal:       "[userId+patternId], userId, earnedAt",
  reflections:   "[userId+lessonId], userId, updatedAt",
  traces:        "[userId+lessonId+createdAt], userId, lessonId"      // capped ring per lesson
});

type ProgressRow = {
  userId: UserId                    // "local" in v0
  lessonId: LessonId
  stageReached: StageNumber         // 1..9 — the gate state
  artifacts: {                      // constructed student work per stage
    reasonAnswers?: ConstructedAnswer[]
    discoveredArtifact?: ArtifactSpec      // e.g. invented return type
    designContract?: DesignContract
  }
  completedAt?: ISODate
  updatedAt: ISODate
}

type EventRow = {                   // the learning-signal ledger (PRD §7 metrics live here)
  id?: number
  userId: UserId
  lessonId: LessonId
  kind: "hint.used" | "solution.revealed" | "probe.passed" | "probe.failed"
      | "stage.entered" | "stage.completed" | "naive.submitted" | "optimized.submitted"
  payload?: Record<string, unknown> // e.g. { hintLevel: 2 }
  at: ISODate
}

type TraceRow = {
  userId: UserId
  lessonId: LessonId
  createdAt: ISODate
  trace: Trace                      // 05 §2 format, JSON
  byteSize: number                  // enforced ≤ 512KB; ring keeps ≤ 3 per lesson
}
```

**Policies:**
- Draft writes: debounced 1s; history ring of 10 via `payload` rotation — cheap insurance
  against "I destroyed my own code."
- Trace retention: newest 3 per lesson, hard byte cap, oldest evicted on insert.
  Pedagogically sufficient (compare recent attempts) and size-safe.
- Events are never updated or deleted — the metrics in PRD §7 (discovery rate, hint
  depth, naive-first compliance) are pure folds over this table.
- Preferences: `localStorage` key `deriva:prefs:v1`, JSON, read once at boot.

## 4. Export / import (migration insurance)

- **Export:** one JSON file `{ version, exportedAt, tables: {...} }` — full profile.
- **Import:** validates against zod schemas, merges by `(userId, *)` keys with
  last-write-wins on documents and union on events.
- This is the escape hatch that makes "local-first" honest: the user's practice history
  is never locked in, and the v1 migration path is "export → import into cloud account"
  if all else fails.

## 5. The v1 seam (Supabase), designed now, built later

`persistence/sync/` is an empty, typed module in v0:

```ts
interface SyncAdapter {
  push(batch: EventRow[]): Promise<void>          // events: append-only → trivially syncable
  pull(since: ISODate): Promise<SyncDelta>        // documents: LWW by updatedAt
}
```

Why Supabase when the time comes:
- **Postgres** — the v0 schema already *is* Postgres-shaped (compound keys, JSONB
  payloads); migration is a schema port, not a redesign.
- **Auth + Row-Level Security** — `userId` scoping becomes a policy, not application code.
- **Free tier** fits v1 scale; self-hostable if it ever matters.
- Realtime exists but is *not* needed — sync is opportunistic (on boot, on stage
  completion), never live collaboration.

**Conflict model (decided now to avoid future archaeology):** documents (progress,
drafts, reflections, journal) are last-write-wins per key — acceptable because a single
user's devices rarely write the same lesson concurrently; events are immutable and merge
by id — no conflicts by construction.

## 6. Privacy posture (v0 → v1)

- v0: data never leaves the device. There is no analytics (07 D11). The hint/reveal
  ledger is a *learning instrument the student can inspect*, not telemetry.
- v1: sync is opt-in per account; events remain the student's own learning record,
  exportable and deletable (GDPR-shaped from birth, cheap because the schema is small).

## 7. Failure modes & mitigations

| Failure | Mitigation |
|---|---|
| IndexedDB eviction under storage pressure | `navigator.storage.persist()` requested at first run; export reminders in journal UI |
| Schema drift across versions | Dexie versioned migrations; every migration ships with an upgrade test on fixture data |
| Trace bloat | byte cap + ring eviction (§3) |
| "Local" userId collides with future accounts | `userId` is a branded type; v1 sync maps `"local"` → account id once, then rewrites keys in a single migration transaction |
