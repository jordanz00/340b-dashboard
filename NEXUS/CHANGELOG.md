# Changelog — NEXUS Engine Pro

All notable product changes are listed here. Version in UI matches `js/nexus-version.js` (`NexusRelease.version`).

## 1.0.2 — 2026-04-10

### Added

- **`DEPLOY.md`** — GitHub Pages setup, PAT secret, and manual sync for **`jordanz00/nexus-music-visualizer`**.
- **`.github/workflows/nexus-deploy-pages.yml`** (in `340b-dashboard`) — pushes `NEXUS/` to **`gh-pages`** on the visualizer repo when `NEXUS_MUSIC_VISUALIZER_DEPLOY_PAT` is set.
- **`NEXUS/.nojekyll`** — disables Jekyll so `vendor/` and paths are not stripped on Pages.
- **`NEXUS/404.html`** — redirects unknown paths to the canonical live URL.

## 1.0.1 — 2026-04-10

### Changed

- Canonical public URL **[nexus-music-visualizer](https://jordanz00.github.io/nexus-music-visualizer/)** wired into `NexusRelease.pagesBaseUrl`, `<link rel="canonical">` / Open Graph in `index.html`, README/OBS docs, and **Copy link** (session seed) so shared URLs always target the live product site.

## 1.0.0 — 2026-04-10

### Added

- **Shipping defaults**: Curated cold-start scene when `?seed=` is absent; mild bloom/trail/Aurora speed tuning for 1080p-style output; default REC profile **1080p @ 60fps**.
- **First-run onboarding** after Launch (skippable; stored in `localStorage` under `nx_onboard_done_v1`).
- **Showfile v1** (JSON export/import): preset snapshot + show clock mode + post chain bypass flags (`NX.Showfile`).
- **Recording brand** (composite resolutions only): optional **opening title card** (~1.2s) and **logo corner** (PNG/JPEG/WebP, max 2MB).
- **URL hardening**: `?demo=` values restricted to known demo ids (`NX.BootstrapQuery`).
- **Product docs**: `README.md`, `CHANGELOG.md`, `docs/PRIVACY-DATA.md`, `docs/PRO-OUTPUT-WORKFLOWS.md`.
- **Automated tests**: Vitest unit tests (`tests/nexus/`); Playwright smoke (`NEXUS/e2e/`).

### Changed

- `NexusEngine.version` string now follows `NexusRelease.version` + `-pro` suffix.

### Notes

- **NDI / Syphon**: not shipped in-browser; OBS capture is the supported path (documented).