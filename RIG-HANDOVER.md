# RIG — HANDOVER
Aug 28 2026 (post-field-test) · Read this first, then `RIG-PLAN-V2.md` (§0a STATUS)
and `RIG-PLAN-V3.md`. Hand this to the executing agent as-is.

## WHAT RIG IS
A TE-styled remote coding cockpit: UI at `src/app/rig/` (route `/rig`, dark panel,
doesn't inherit Deriva's design tokens — closed system), daemon in `harness/`
(launchd `com.deriva.rig`, WS+HTTP on :8787, state in `~/.rig/`), Next.js dev server
on :3000 serves the UI.

## CURRENT STATE — CORE FLOW WORKS (verified, not assumed)
`harness/smoke.mjs` is SELF-SUFFICIENT: it drives the whole daemon-side flow over the
real WS (creates a throwaway engine if none is keyed; degrades live-stream to an
auth-error check; deletes everything it created). Run it after ANY harness change:
```
cd /Users/zen/projects/deriva/harness && node smoke.mjs
```
Latest run — ALL PASS, including: 31 real models fetched, `cwd:""`→homedir, history
restore, per-rig busy guard ("RIG IS BUSY — STOP FIRST"), approval card, STOP
mid-approval, delete rig, sessionId-routed errors.

**NOTE:** during UI testing the user's only stored engine (with its API key) was
deleted via the new DEL button BEFORE the backup mechanism existed → the key must be
re-pasted once (ENGINE → OPENCODE GO → key → CONNECT). `saveProviders` now keeps
`providers.json.bak` on every write and the empty ENGINES modal offers
"RESTORE LAST BACKUP" — this class of loss is now a one-tap recovery.

## HARD-WON BUG CLASS (do not regress)
**Token collision with Deriva globals (fixed Aug 28):** RIG tokens were declared on
`:root`, and `globals.css` ALSO declares `--ink` (dark!) / `--line` on `:root` — same
specificity, so stylesheet order decided text color → dark text on black canvas in
the real app while isolated previews looked fine. **Rule: all RIG tokens are declared
on `.rig-root` (direct declaration beats any inherited `:root` value).** Never move
them back to `:root`, and never trust a standalone-HTML preview alone — test against
globals.

## HARNESS TOOL UPGRADES (Aug 28, smoke + unit-verified)
- `bash`: `timeout` arg (seconds, default 60, clamped 5–300) — builds no longer die at 30s.
- `read`: `offset` (1-based line) for big files + actionable truncation note.
- `edit`: duplicate 'old' now REFUSES with guidance instead of silently replacing the
  first match; `all:true` replaces every occurrence; reports spot count.
- `grep`: clean 400-hit cap with a "narrow with path" note.
- Schemas in `buildTools()` advertise the new optional args (GO requires the
  parameters object per function — keep it complete).
- Folder picker: `/api/mkdir` (home-jail, recursive, own-machine guard) + "+ NEW
  FOLDER" in the picker; folder picking now works on MOBILE too (daemon-backed).

### What was broken (for the record — all fixed)
1. UI saved providers corrupted (`kind:"openai-compatible", baseUrl:""`) because the
   preset was looked up by kind instead of id → 401s everywhere.
2. Function tools were sent WITHOUT `parameters` JSON schema → every chat request
   400 "function parameters is empty" — the single deepest blocker ("ask → nothing").
3. Stored model `hy3-free` doesn't exist on the GO endpoint (31 real models).
4. ENGINE + ADD chip only rendered when providers.length===0 → one broken provider
   bricked all recovery; no engine manager existed.
5. No cwd default for `""`, no history on reopen, no reconnect, no delete, no
   per-rig busy, white-on-white autofill, modals under the app-shell header on mobile.
All of the above are FIXED and (daemon-side) verified. `repairProviders()` at boot
self-heals old corrupted `~/.rig/providers.json` rows (zen/go repaired by id, empty
baseUrls dropped).

## REMAINING WORK (in order)
1. **E — human acceptance** (`RIG-PLAN-V2.md` §3, steps 10–14): user re-pastes the
   API key, adds a rig, runs one real prompt + one approval on phone. Everything
   daemon-side is smoke-verified green.
2. **V3 — done** (see STATUS block at top of `RIG-PLAN-V3.md`). Optional eye-pass
   during step E only.
Nothing else pending.

## HARD RULES
- `pnpm exec tsc --noEmit` in `deriva/` AND `deriva/harness/` after every file.
- Daemon edits require `launchctl kickstart -k "gui/$(id -u)/com.deriva.rig"`, then
  `curl -s localhost:8787/api/health` → `{"ok":true}`. UI edits are HMR.
- Whole-file Writes for big rewrites; never rename daemon helpers
  (`runRig compactRig getRig refreshSummary listSummaries loadProviders saveProviders
  repairProviders deleteRig runTool MUTATING`) without grepping refs.
- RIG is a closed visual system: arbitrary hex inside `src/app/rig/*` is intended;
  Deriva's `docs/09` token rule does NOT apply there. Don't "fix" it into tokens.css.
- Protocol changes: edit `harness/shared/types.ts` FIRST (zod unions), then server,
  then UI. tsc will catch stragglers.

## ENDPOINT QUIRKS (learned the hard way — do not regress)
- `opencode.ai/zen/v1` `/models` NEEDS a bearer; `opencode.ai/zen/go/v1` `/models` is
  OPEN (send none) but `/chat/completions` needs `Authorization: Bearer <key>`.
- Chat tools MUST include `parameters` JSON schema per function (Go/Console upstream
  400s otherwise: "function parameters is empty (2013)"). Anthropic path uses the
  same schemas as `input_schema`.
- GO model ids are like `minimax-m3`, `kimi-k3`, `kimi-k2.7-code` — never invent one;
  always `fetch_models` and pick from the list.
- Chat replies may open with `<think>…</think>` (minimax) — UI currently renders it
  raw; a small "hide think block" polish is allowed in V3, not V2.

## FILE MAP
- `src/app/rig/page.tsx` — state, WS handler, all handlers, ALL CSS in `<Style>`.
- `src/app/rig/pickers.tsx` — PRESETS, ModelList/ModelPicker, FolderPicker,
  ProviderFlow, EnginesModal, NewRigModal, HelpModal.
- `src/app/rig/blocks.tsx` — Led/Chip/ModalShell/ToolCard/MsgRow. `composer.tsx` —
  input + slash palette. `commands.ts` — fuzzy + command list.
- `harness/daemon/` — server.ts (WS+HTTP, boot repair), session.ts (state, repair,
  deleteRig), loop.ts (agent loop), providers.ts (fetchModels/streamChat/buildTools),
  tools.ts (bash/read/write/edit/glob/grep), auth.ts (pairing token).
- `harness/shared/types.ts` — zod protocol (edit first on protocol changes).
- `harness/smoke.mjs` — acceptance harness (node smoke.mjs).
- Logs `/tmp/rig-launchd.log` · state `~/.rig/{providers.json,sessions.json,<id>.jsonl}`.
