# NEXUS Engine Pro

Browser-based live VJ suite: **WebGL** shader scenes, **Aurora Field** (Butterchurn / MilkDrop-class spectrum layer), **hybrid** compositing, **MIDI**, show clock (**LTC / MTC**), clips, **WebM recording**, and **Present** mode for clean output.

| | Link |
|---|------|
| **Live (canonical)** | [https://jordanz00.github.io/nexus-music-visualizer/](https://jordanz00.github.io/nexus-music-visualizer/) |
| **Source repo** | [github.com/jordanz00/nexus-music-visualizer](https://github.com/jordanz00/nexus-music-visualizer) |

The canonical URL is also defined in `js/nexus-version.js` (`NexusRelease.pagesBaseUrl`) and used for **Copy link** (session seed) plus `<link rel="canonical">` in `index.html`.

**Deploy / fix 404:** see **[DEPLOY.md](DEPLOY.md)** — GitHub Actions sync from this monorepo (secret `NEXUS_MUSIC_VISUALIZER_DEPLOY_PAT`) plus Pages branch settings.

## Audience

- DJs, VJs, and streamers who want a **single static page** (no install) with pro-grade visuals.
- Developers extending `window.NX` / `NexusEngine` (plain scripts, **no default bundler**).

## Hosting

| Surface | Notes |
|--------|--------|
| **GitHub Pages (production)** | **[nexus-music-visualizer](https://jordanz00.github.io/nexus-music-visualizer/)** — project site; keep a **trailing slash** on the folder URL so relative scripts resolve (see `<base>` in `index.html`). |
| **Local** | `cd NEXUS && python3 -m http.server 4173` then open `http://127.0.0.1:4173/`. |
| **OBS** | Browser Source → **live URL** above; enable **Present** (or press `P`) to hide chrome. See `docs/PRO-OUTPUT-WORKFLOWS.md`. |

## Browser support

| Browser | WebGL scenes | Aurora Field | WebGPU WGSL | Recording |
|--------|--------------|--------------|-------------|-------------|
| **Chrome / Edge** (desktop) | Yes | Yes | Yes (flags may apply) | WebM VP9/VP8 |
| **Firefox** | Yes | Yes | Limited / evolving | WebM |
| **Safari (macOS)** | Yes | Yes | When enabled | Varies |
| **Safari iOS** | Yes (coarse caps) | Yes | Usually off | Device-dependent |

WebGL is **required**; without it the app shows a fatal message. **Mic** and **MIDI** require HTTPS or localhost and user permission.

## Version

Shipping version is defined in `js/nexus-version.js` (also shown next to **Pro** in the top bar). Human-readable changes: `CHANGELOG.md`.

## Query parameters (allowlisted)

| Param | Purpose |
|-------|---------|
| `?seed=` | Deterministic session seed (unsigned 32-bit integer or string hashed to seed). |
| `?demo=` | Auto-play a built-in demo sequence: `drop`, `festival`, `genres`, `ai`, `resolume` only. Unknown values are **ignored**. |
| `?soak=1` | Internal soak flag. |
| `?director=1` | Enables AI director mode on boot. |

Do not add new query handlers without updating the allowlist logic in `js/nexus-bootstrap-query.js` and tests under `tests/nexus/`.

## Licenses

Third-party components (Butterchurn, preset packs, optional Meyda) are listed in **`THIRD_PARTY_NOTICES.md`**. Preset **content** may have varied community authorship; the notices file is the compliance anchor.

## Privacy

Mic audio stays in the browser; presets and seeds may use **localStorage**. See **`docs/PRIVACY-DATA.md`**.

## Showfiles

Under **System → Showfile & recording brand**, export/import JSON (`nxShowfile` v1) for engine + scene + stack + clock + post FX bypass. Not a substitute for full project files in desktop VJ apps—see roadmap in `CHANGELOG.md`.

## Tests

From the **repository root** (parent of `NEXUS/`):

```bash
npm run test:nexus
npm run test:nexus:e2e
```

Unit tests live in `tests/nexus/`. E2E uses Playwright against a local static server (`NEXUS/`).

## Security

No secrets in static assets. Logo upload for recording is **local file → object URL** only (no upload). Prefer allowlisted URLs for any future network features.
