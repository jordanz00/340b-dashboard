# NEXUS Engine Pro — v1.0 ship criteria

This document defines what “shipped” means for the static-site NEXUS build (GitHub Pages or equivalent). It aligns with the supervisor plan: reliability, performance, licensing, operator UX, and QA.

## 1. Browser matrix (must document pass/fail)

| Browser | Desktop | Mobile / tablet | Notes |
|---------|---------|-----------------|--------|
| Chrome | Required | Android: required | WebMIDI, WebGL1, MediaRecorder baseline |
| Edge | Required | — | Same engine as Chrome for most checks |
| Safari | Best-effort | iOS: **required** for stated mobile support | WebGL watchdog, instant scene cuts, DPR caps (`engine.js` iOS profile) |
| Firefox | Best-effort | — | Verify WebGL + recording codec |

**Known limits (non-blocking if documented):** mic permission UX, `file://` vs `http(s)://`, GitHub Pages trailing slash / `<base>` (see `index.html` bootstrap comment), VP9→VP8 recorder fallback.

## 2. Performance SLOs (targets, not guarantees)

| Quality preset | Typical target | Action if sustained below |
|----------------|----------------|----------------------------|
| Performance | ≥ 36 FPS on mid laptop iGPU | User should use Perf lock + Performance preset |
| Balanced | ≥ 42 FPS | Adaptive GPU may lower internal render scale |
| Ultra | ≥ 30 FPS on discrete GPU | Downgrade preset or enable Perf lock |

**Show mode:** Present mode + Perf lock + `nexusVizPerformance` are first-class paths for live OBS; operators should validate on their hardware before a gig.

## 3. OBS / streaming path

- **Window capture** of browser tab/window with **Present mode** (`P` or `?obs=1`).
- Document virtual audio (VoiceMeeter / BlackHole) for line-in reaction (see main README).
- Optional: transparent keying on black background (README).

## 4. Pro vs Free boundaries

- **Free:** corner watermark; feature set as implemented in `watermark.js` + UI.
- **Pro:** unlock via documented dev/localStorage keys in README; no behavioral regression on Free tier without explicit changelog.

## 5. v1.0 feature freeze (suggested minimal scope)

**In scope for v1.0**

- WebGL scene stack + post chain + Butterchurn (Aurora) hybrid modes.
- MIDI learn + map persistence.
- Recording profiles (native / 1080p / stream / 4K) with codec fallback.
- Session seed + DNA uniforms + preset recall (see `session-seed.js`).
- Optional Meyda analysis module (lazy-loaded, off by default).

**Defer to v1.1+ unless critical**

- Second full compositor (Hydra / regl stack) — see [`OSS-SPIKE-2-COMPOSITOR.md`](OSS-SPIKE-2-COMPOSITOR.md).
- projectM WASM integration (LGPL review required).
- Full automated visual regression (screenshots).

## 6. Release checklist (human)

- [ ] Run [`scripts/nexus_smoke.py`](scripts/nexus_smoke.py) from repo root.
- [ ] Manual pass: Launch → mic → one random scene → one Aurora preset → REC 10s → stop.
- [ ] Safari iOS: Launch → no black canvas after rotate.
- [ ] Credits panel links match [`THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) (repo copy).

## 7. Versioning

Bump the string shown in UI / `nexus-brand.js` when cutting a release, and note changes in README changelog if you maintain one.
