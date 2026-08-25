# Changelog

## v1.5.0 — Lucent Lab (2026-08-25)

### New
- **Glyph Studio** (`/glyph`): standalone dot-matrix editor — 7/12/16 grids, drag draw/erase, undo, transforms (flip/rotate/shift), onion skinning, multi-frame animation (8 frames, 2–12 fps), Glyph-Toy light patterns (Comet/Pulse/Rain/Spiral), color/glow/scale/roundness controls; export PNG / animated SVG / JSON (+ import); save 7×7 glyphs into your Personal pack.
- **Personal icon pack** — draw your own 7×7 nav glyphs in-app.
- **Focus Dial** (`/focus`) — Braun-style rotary timer that re-tints the whole shell while running.
- **Appearance share codes** — QR/paste-code carries your full look between devices safely.
- **Settings search** — every section is indexed; plus reordered sections and anchor TOC.
- **NEW badges** on recently added themes, voices, packs and atmospheres (all atmospheres now unlocked).

### Fixed
- Curated logos (Nothing/OP-1) no longer break navigation: React-19-owned `<head>` nodes are mutated in place instead of removed; manifest icons rasterized to real PNGs for installability.
- Stale-deploy self-healing: chunk failures after deploys purge caches and reload once — no more blank routes or dead clicks.
- Contrast engine: `--on-accent` computed from live accent luminance across all themes/custom colors; NEW badge legibility everywhere.
- Mobile logo rounding, overlay dead-clicks on route change, stuck nav drags.

### Performance
- Logo uploads ~17× smaller (256px JPEG), preferences parse cache, memoized hot components, debounced manifest rebuilds, `content-visibility` on settings sections.

### Internals
- Android TWA icon flavors: classic / nothing / opone.
- Service worker v20; error ring-buffer surfaced in Settings → System.
