# HAP Regulatory Advocacy 2026 (standalone microsite)

This folder is **self-contained** (local `vendor/` copies of D3, TopoJSON, and U.S. states topology). You can publish it as **its own GitHub repository** so GitHub Pages serves it **without** `340b-dashboard` in the URL.

## Live URL pattern

After you create a public repo (example name `hap-regulatory-advocacy-2026`) and turn on **GitHub Pages** from `main` / **root**:

- **Desktop:** `https://<your-username>.github.io/hap-regulatory-advocacy-2026/index.html`
- **Mobile:** `https://<your-username>.github.io/hap-regulatory-advocacy-2026/reg-advocacy-mobile.html`

Replace `<your-username>` with your GitHub username or org.

## One-time setup on GitHub

1. **New repository** on GitHub (empty, no README) — e.g. `hap-regulatory-advocacy-2026`.
2. From your machine, push **only the contents of this folder** as the repo root (see `publish-standalone.sh` below).
3. **Settings → Pages → Build and deployment:** Source **Deploy from a branch**, Branch **main**, folder **/ (root)**.
4. Wait a minute, then open the URLs above.

## Push script (optional)

From the **monorepo root** (`340b-dashboard`):

```bash
bash hap-regulatory-advocacy-2026/publish-standalone.sh git@github.com:YOUR_USER/hap-regulatory-advocacy-2026.git
```

Or create the repo on github.com, add the remote URL shown there, and push this directory’s files manually.

## Copy inside the 340B monorepo

This same folder still lives under `340b-dashboard` for development. Paths use `vendor/…` so nothing points at `../assets/vendor/`.
