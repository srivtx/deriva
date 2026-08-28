# RIG — PLAN V2 · MAKE IT WORK (production correctness)
Date: Aug 28 2026 · Precondition: v1 redesign code exists and typechecks.
**Mission: the product works end-to-end for a normal user. No aesthetics in this plan
(→ V3). No new features beyond what's needed to operate. Every phase has measurable
EXIT CRITERIA. Do not start the next phase before the current gate is green.**

---

## 0a. STATUS — EXECUTED Aug 28 (same day as plan)
**Verified by `harness/smoke.mjs` against the live daemon (real key, real endpoint):**
pair ✓ · provider repaired ✓ · 31 real models fetched ✓ · `cwd:""`→homedir ✓ ·
history frame ✓ · **live streamed reply** ✓ · delete rig ✓. tsc clean both projects.

Executed: Gate A (F0a/b/c: preset lookup by `provId`; bearer on `/models` except
`opencode-go`), F5, F18, F23, F1 (`delete_session` + two-tap ✕ UI),
F2 (`history` frame + transcript restore), B8 (reconnect w/ backoff + offline banner +
re-open current rig), D1–D6 (autofill/color-scheme/.hint/z-index 200-300/iOS 16px/tap),
F20b (full-args approval card), **F25** (ENGINES modal: USE/MODELS/DEL/ADD; ENGINE chip
always visible — was hidden whenever ≥1 provider existed, which bricked recovery),
**F26** (MODEL modal auto-fetches when empty), **F27** (auto-select first rig on
`sessions`; "NO RIG — TAP + NEW" toast instead of silent no-op), **F28** (boot-time
`repairProviders` — fixes pre-fix corrupted rows: `zen`/`go` by id get true
kind/baseUrl; unusable empty-baseUrl customs dropped), **F29 (CRITICAL, fixed)**:
`buildTools()` sent OpenAI function tools WITHOUT `parameters` schema → every chat
request 400 "function parameters is empty". Proven by endpoint probe (no-tools 200 /
no-params 400 / with-params 200). All six tools now carry JSON schemas; Anthropic
`input_schema` likewise. **F30**: user's stored model `hy3-free` doesn't exist on GO
(31 real models: minimax-m3, kimi-k3, kimi-k2.7-code…) → repaired to `minimax-m3`.

**REMAINING:** E (browser-side acceptance steps; daemon-side steps already green via
smoke.mjs), then V3.

## 0b. STATUS — EXECUTED Aug 28, round 2 (B3 + hardening)
**`smoke.mjs` is now self-sufficient** (registers hello-phase waiters before sending
hello; creates a throwaway `smoke-go` engine if no keyed engine exists; degrades
live-stream to an auth-error check; cleans up everything after). Latest run: ALL PASS.
Executed this round:
- **B3 complete:** per-rig `busy` map (UI) + `session_status {sessionId,busy}`
  broadcasts from runRig start/finally and around compact; `ready` no longer means
  "running" (focus only); server REJECTS prompt/compact/switch_provider/set_cwd while
  busy ("RIG IS BUSY — STOP FIRST"); STOP mid-approval works (abort resolves that
  session's pending approvals before aborting — verified by smoke).
- **F21 phone approvals:** permissions moved to a GLOBAL pend map + loop output is
  broadcast (not per-connection) — any paired device sees the stream and can approve;
  a disconnected desktop no longer kills a pending approval.
- **F12:** `error`/`info` carry optional `sessionId` — routed into the right
  transcript (verified: auth error landed with sessionId).
- **F31 misclick insurance:** every `saveProviders` keeps `providers.json.bak`;
  new `restore_providers` protocol + "RESTORE LAST BACKUP" button in the empty
  ENGINES modal. (Incident: during UI testing the user's only engine — with its API
  key — was deleted via DEL before the backup existed; key unrecoverable, user must
  re-paste once. The .bak mechanism now makes this a one-tap recovery.)
- **F26b:** MODEL modal empty state → RETRY FETCH + OPEN ENGINES (no dead ends).
- Per-rig LEDs (sidebar shows busy rigs), optimistic busy on send, top-bar STOP
  follows the current rig only.

**REMAINING:** E only (browser steps 10–14 with the user), then V3.

---

## 0. RUN & VERIFY (every phase)
```
cd /Users/zen/projects/deriva            && pnpm exec tsc --noEmit   # UI
cd /Users/zen/projects/deriva/harness    && pnpm exec tsc --noEmit   # daemon
launchctl kickstart -k "gui/$(id -u)/com.deriva.rig"                 # after harness edits
curl -s localhost:8787/api/health        # → {"ok":true}
tail -30 /tmp/rig-launchd.log
```
UI edits are HMR. Daemon edits REQUIRE the kickstart. State lives in `~/.rig/`.
Rules: whole-file Writes for big rewrites; tsc after every file; never rename daemon
helpers (`runRig`, `compactRig`, `getRig`, `refreshSummary`, `listSummaries`,
`loadProviders`, `saveProviders`, `runTool`, `MUTATING`) without grepping refs.

---

## 1. GATE A DIAGNOSIS — why "add key → pick model → ask a question" DOES NOT WORK

This is the reported killer. It is fully traced. Three linked defects; the first is
the root cause.

**Repro:** `/rig` → ENGINE +ADD → tile OPENCODE ZEN (or GO) → paste key → CONNECT →
(Go: model list appears; Zen: "model fetch failed 401") → pick model → +NEW → SPAWN →
type a question → "Provider error 401" (Go) or cryptic failure. Custom OpenAI-
compatible: dies earlier, at the model list (401).

**Root cause 1 — preset lookup never matches (page.tsx `onTile` / `connectProvider`).**
`onTile` stores `setProvKind(p.kind)` (e.g. `"opencode-zen"`) — but `connectProvider`
does `PRESETS.find((p) => p.id === provKind)` and ProviderFlow's key step does the
same `PRESETS.find((p) => p.id === kind)`. It looks the preset up by `id` while
holding the `kind`. **`preset` is always `undefined`.**

**Root cause 2 — the provider is saved corrupted.** With `preset === undefined`,
`connectProvider` saves `kind: "openai-compatible"` for EVERY tile, and the key step
sends `preset?.baseUrl || ""` → `baseUrl: ""`. So every UI-added provider is
mislabeled and base-URL-less. (The env-seeded providers work — that's why the daemon
ever functioned at all.)

**Root cause 3 — downstream each kind fails differently (providers.ts):**
- `fetchModels` attaches `Authorization` only for kinds zen/go → Zen without the
  header = 401 ("model fetch failed"). Custom OpenAI-compatible never gets a bearer
  either = 401 at the same step.
- `baseURL()` silently maps `baseUrl:""` → `ZEN_BASE` for any non-go/zen kind → a GO
  provider (GO key) POSTs to the ZEN chat endpoint = 401 at first prompt.
- `streamChat` ignores an explicit `provider.baseUrl` for zen/go (hardcoded consts).

**Fix contract (all of it, or the flow stays broken):**
1. Rename UI state `provKind` → `presetId`; `onTile` stores `p.id`; ALL three
   consumers (`connectProvider`, ProviderFlow key step, pick step title) derive
   `preset = PRESETS.find(p => p.id === presetId)` and take `kind/label/baseUrl`
   from it. Custom tile (`openai`) keeps its manual BASE URL field.
2. `fetchModels`: always send `Authorization: Bearer <key>` (harmless on the
   unauthenticated Go endpoint).
3. `baseURL()`: no silent ZEN fallback — throw `new Error("provider has no baseUrl")`;
   `streamChat` uses `baseURL(provider)` for zen/go too (explicit base wins).
4. Safari-safe notifications: `Promise.resolve(Notification.requestPermission?.()).catch(…)`
   and same guard before `new Notification(...)`.

**GATE A EXIT (all must pass manually):**
- [ ] Zen key → CONNECT → model list appears → pick → spawn rig → question answered
      with at least one tool call executed.
- [ ] Same with a GO key.
- [ ] Same with custom OpenAI-compatible (base URL + key entered by hand).
- [ ] `~/.rig/providers.json` shows the correct `kind` and `baseUrl` for each.

---

## 2. PHASES

### PHASE A — Core flow (Gate A above) — files: `page.tsx`, `pickers.tsx`, `providers.ts`
Fix contract 1–4 + F5 (server defaults/validates `cwd`; `""` → homedir; stat-check is
directory; NewRigModal shows `~` for empty) + F18 (loop errors clearly when
`effectiveModel()` is `""`: "NO MODEL SET — /model").
**EXIT = GATE A EXIT + tsc clean both projects.**

### PHASE B — Session lifecycle is real — files: `shared/types.ts`, `session.ts`,
### `loop.ts`, `server.ts`, `tools.ts`, `auth.ts`, `page.tsx`
- **B1 delete rig (F1):** protocol `delete_session`; session.ts `deleteRig(id)`
  (resolve pends false → abort → `rigs.delete` → unlink `<id>.jsonl` → drop row from
  sessions.json); server broadcasts `sessions` + `session_deleted`; UI: `✕` per rig
  row, two-tap confirm (row turns red `SURE?`, 2.5 s reset); if current deleted →
  focus most recent other rig or empty state.
- **B2 history restore (F2):** new `history { sessionId, messages }` ServerMessage;
  sent by `open_session` and after reconnect for the focused session. UI maps
  persisted messages → items; assistant `tool_calls` render as HISTORICAL cards
  (`historical: true` → LED off, never "running…"); tool msgs → result blocks by
  `tool_call_id`; non-initial system msgs → "COMPACTED SUMMARY" sys bubble.
- **B3 busy + stop (F4, F3, F21):** loop emits `session_status { sessionId, busy }`
  (start + finally) and no longer sends `ready`; `ready` = "focus/open" only. Server
  rejects `prompt`/`compact`/`switch_provider`/`set_cwd` while `rig.busy`. Global
  `pend` map `{ callId → { sessionId, call, resolve } }` + broadcast
  `permission_request` (phone can approve desktop's request); `permission` resolves
  from the global map; `abort`/`delete_session` resolve that session's pends false
  BEFORE aborting; pending requests re-emitted on `hello`. UI: `busyMap` per session
  (optimistic on send), STOP/composer follow `busyMap[current]`.
- **B4 reconnect + offline truth (F8, F10, F12, F13, F19):** `send()` returns bool →
  toast "NOT CONNECTED" when dropped; offline banner; local auto-reconnect with
  backoff (1→2→4→8 s, cap 8) instead of dumping to the pair card; after `paired`
  re-open `current` (B2 restores transcript); token persisted at `~/.rig/token`
  (0600) so phone links survive restarts; `error`/`info` gain optional `sessionId`
  and route correctly (never into the invisible `log[""]`); tool blocks upserted by
  `call.id` (no duplicates after reconnect); `sessions` broadcast, not per-conn.
- **B5 daemon hygiene (F11, F17):** bash tool PATH prepend `/opt/homebrew/bin:/
  usr/local/bin:` (launchd PATH is minimal — this is why the agent's shell fails);
  `ClientMessage.safeParse` on inbound frames.
**EXIT:** acceptance scenarios 4–8 (§3) green + tsc clean.

### PHASE C — Pickers & engine management — files: `pickers.tsx`, `page.tsx`
- **C1 no dead ends (F7):** provider-flow pick step renders the error + RETRY (re-send
  `fetch_models`) + BACK; MODEL modal auto-fetches when its cache is empty on open;
  its empty-state button REALLY opens the provider flow.
- **C2 engine manager (F20, M2):** ENGINE chip in the top bar → EnginesModal: each
  provider row shows label · kind · model with USE / REFETCH / DELETE (delete_provider
  is already on the wire, unused today). `/provider` opens it, with ADD ENGINE →
  existing 3-step flow.
- **C3 model list sanity (F16):** `fetchModels` filters zen/go models to
  `endpoint === undefined || "chat_completions"` (the others 404 at chat time).
- **C4 approval readability (F20b):** ToolCard shows FULL args when `needPerm`
  (bash → command; write/edit → path; cap ~240 chars) — the operator must read what
  they're approving.
**EXIT:** acceptance scenario 9 + tsc clean.

### PHASE D — Visual correctness (legibility ≠ aesthetics) — `page.tsx` CSS, `blocks.tsx`
- **D1 (V1):** `input:-webkit-autofill { -webkit-box-shadow: 0 0 0 1000px #050505
  inset; -webkit-text-fill-color: #fff; }` — the site's light `color-scheme` makes
  autofill white with our white text.
- **D2 (V2):** `color-scheme: dark` on `.rig-root` (UA widgets, scrollbars, keyboards).
- **D3 (V3/V4):** generic `.hint{color:#b8b8b8}`; explicit `color` on
  `.rig-modal-card`, explicit bg on `.connect-card`, `.rig-item` — no inherited text
  on implied surfaces.
- **D4 (V5):** `.rig-modal{z-index:200}`, `.toast{z-index:300}` — app-shell's mobile
  header is z-100 and currently covers our modals.
- **D5 (V6/F15):** 16px inputs on ≤700px (stops iOS focus zoom).
- **D6 (V8):** `-webkit-tap-highlight-color: transparent; touch-action: manipulation`
  on buttons/rows.
- **D7 (V7 audit):** render and LOOK: light theme (`paper`) + dark (`nothing`) ×
  1440×900 + 390×844 × states {empty, provider flow ×3, model, folder, new-rig, help,
  transcript+tool cards, pair, toast, offline}. Fix every contrast defect found.
**EXIT:** D7 audit clean, no white-on-white anywhere.

### PHASE E — Sign-off: run §3 end to end, fix what falls out, re-run until green.

---

## 3. ACCEPTANCE SCRIPT (definition of DONE for V2)
1. Fresh state (`~/.rig` providers empty) → add ZEN key → model list → pick → spawn →
   "create hello.py that prints hi, then run it" → streams; tool cards readable;
   file created; bash output visible.
2. Same with GO key. 3. Same with custom OpenAI base+key. 4. `providers.json` kinds/baseUrls correct.
5. Ask-mode rig → write triggers approval card on desktop; same card on the paired
   phone; approve FROM THE PHONE → proceeds.
6. STOP while an approval is pending actually stops. 7. Prompt-while-running → clean rejection, no corruption.
8. Reload mid-run → reconnects, history restored, stream continues, no duplicate tool cards.
9. Sidebar ✕ (two-tap) deletes; jsonl gone; list updates on both devices.
10. `/model` after fresh reload auto-fetches; failed fetch → RETRY works; ENGINE
    manager deletes a provider.
11. `kickstart` the daemon mid-session → offline banner → auto-reconnect → current
    rig reopens with history.
12. `/api/pair-qr` URL host = Mac's LAN IP (not localhost); phone scan pairs; links
    survive a daemon restart.
13. D7 visual audit clean (both themes, both sizes). 14. tsc clean in both projects.

## 4. DEFECT REGISTER (traceability; IDs stable across docs)
| ID | Defect | Phase |
|----|--------|-------|
| F0a/b/c | preset lookup mismatch → corrupted kind/baseUrl → 401s (THE core-flow killer) | A |
| F5 | spawn with cwd:"" → tools all fail | A |
| F18 | empty effectiveModel → cryptic provider 400 | A |
| F23 | Safari Notification guard | A |
| F1 | no delete rig | B |
| F2 | reopened rigs show empty transcript | B |
| F3 | approvals per-conn; STOP dead while approval pending | B |
| F4 | no busy guard; global not per-rig status | B |
| F8 | silent send drops; no reconnect; wrong screen | B |
| F10 | token rotates each boot | B |
| F11 | launchd PATH → agent's bash can't find brew/node/pnpm | B |
| F12 | error/info no sessionId → invisible | B |
| F13 | duplicate tool blocks after reconnect | B |
| F17 | zod never enforced | B |
| F19 | sessions per-conn → stale second device | B |
| F7 | model-fetch dead ends; lying button | C |
| F16 | endpoint-incompatible models listed | C |
| F20 | approval args unreadable; no engine manager | C |
| V1–V8 | white-on-white family, z-index, iOS zoom | D |

## 5. EXPLICIT NON-GOALS (diversion guards)
No markdown rendering, no cost/token dashboards, no multi-model compare, no themes,
no sound design, no refactor of Deriva docs/, no renames of working helpers. Those
belong to V3 (design) or never.
