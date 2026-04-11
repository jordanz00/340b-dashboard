# Third-party notices — NEXUS Engine Pro

This file consolidates open-source components shipped with or referenced by the NEXUS static app. Keep it updated when adding vendored scripts.

## Shipped in `NEXUS/vendor/`

| Component | Source | License | Notes |
|-----------|--------|---------|--------|
| **Butterchurn** | [github.com/jberg/butterchurn](https://github.com/jberg/butterchurn) | MIT | WebGL MilkDrop-class player (“Aurora Field” in UI). Do not fork upstream; upgrade via vendored releases. |
| **butterchurn-presets** (bundled `.min.js`) | [github.com/jberg/butterchurn-presets](https://github.com/jberg/butterchurn-presets) | MIT (pack); preset **content** may have varied community authorship | Full preset map via `getPresets()` per README. |
| **Meyda** (optional `meyda.min.js`) | [github.com/meyda/meyda](https://github.com/meyda/meyda) | MIT | Lazy-loaded when the user enables “Meyda analysis” in Audio settings. |

Optional extra preset packs (if you add them per README) should be listed here with the same pattern: name, URL, license, file path.

## In-app credits

The **More** tab includes a short credits disclosure. This file is the **authoritative** list for compliance review.

## Engineering references (not vendored)

- WebGL scenes use common SDF / raymarching patterns; educational references include [Inigo Quilez — articles](https://iquilezles.org/articles/).

## LGPL / projectM stance (research only)

**projectM** ([projectM-visualizer/projectm](https://github.com/projectM-visualizer/projectm)) is a powerful MilkDrop-family implementation often distributed under **GNU LGPL**. NEXUS **does not** ship projectM in this repository snapshot.

- **Before** embedding projectM (e.g. WASM) in a downloadable or commercial “Pro” product, obtain **legal review** for LGPL static linking, modification, and attribution obligations.
- **Technical overlap:** Butterchurn already covers MilkDrop-class presets in-browser; adopt projectM only for a **specific** compatibility or quality goal, not by default.

## Hydra / regl / ogl / three.js

No runtime dependency on Hydra, regl, ogl, or three.js is required for v1.0. Evaluation notes: [`docs/OSS-SPIKE-2-COMPOSITOR.md`](docs/OSS-SPIKE-2-COMPOSITOR.md).
