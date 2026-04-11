# Deploy NEXUS to GitHub Pages (`nexus-music-visualizer`)

The public URL **[https://jordanz00.github.io/nexus-music-visualizer/](https://jordanz00.github.io/nexus-music-visualizer/)** is served from the repository **`jordanz00/nexus-music-visualizer`**. This monorepo keeps source under **`NEXUS/`** inside **`jordanz00/340b-dashboard`**.

## Why you might see 404

| Cause | Fix |
|--------|-----|
| **Empty target repo** or no `index.html` at the published root | Deploy contents of this `NEXUS/` folder to the repo (see below). |
| **Pages source** points at wrong branch/folder | Use **`gh-pages`** branch, **`/` (root)** — see [Automated deploy](#automated-deploy-from-340b-dashboard). |
| **Jekyll** ate `vendor/` or paths | A **`.nojekyll`** file is included under `NEXUS/` so GitHub Pages does not run Jekyll on the upload. |
| **No trailing slash** on the project URL | Prefer opening **`…/nexus-music-visualizer/`** (trailing slash). `index.html` includes a `<base>` fix for script URLs. |

## Automated deploy (from `340b-dashboard`)

1. In GitHub: **`jordanz00/340b-dashboard`** → **Settings → Secrets and variables → Actions → New repository secret**
   - Name: **`NEXUS_MUSIC_VISUALIZER_DEPLOY_PAT`**
   - Value: a **fine-grained personal access token** (or classic PAT) with **Contents: Read and write** on **`jordanz00/nexus-music-visualizer`** only (least privilege).

2. In **`jordanz00/nexus-music-visualizer`**: **Settings → Pages**
   - **Build and deployment**: *Deploy from a branch*
   - **Branch**: **`gh-pages`** / **`/` (root)**  
   (The workflow pushes the contents of `NEXUS/` to the **`gh-pages`** branch.)

3. Push any change under **`NEXUS/`** to **`340b-dashboard`** `main`, or run workflow **Deploy NEXUS to nexus-music-visualizer** manually (**Actions** tab → **Run workflow**).

4. Wait for the **Pages build** (usually under a minute after the push to `gh-pages`).

Workflow file: **`.github/workflows/nexus-deploy-pages.yml`** in this repo.

## Manual deploy (one-time or without PAT)

From your machine, with **`NEXUS/`** as the only contents at the **root** of the target clone:

```bash
# 1) Clone the Pages repo
git clone https://github.com/jordanz00/nexus-music-visualizer.git /tmp/nexus-pages
cd /tmp/nexus-pages
git checkout -B gh-pages

# 2) Replace working tree with NEXUS (adjust SOURCE to your 340b-dashboard checkout)
SOURCE="/path/to/340b-dashboard/NEXUS"
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -R "$SOURCE"/. .
test -f .nojekyll || touch .nojekyll
git add -A
git status
git commit -m "chore: sync NEXUS from monorepo"
git push -u origin gh-pages --force
```

Then set **Pages** to **`gh-pages`** / **`/`** as above.

If you prefer **Pages from `main`** instead, push to **`main`** and set the Pages branch to **`main`** / **`/`** (same file layout: repo root = contents of `NEXUS/`).

## Verify

- Open [https://jordanz00.github.io/nexus-music-visualizer/](https://jordanz00.github.io/nexus-music-visualizer/) — splash **Launch** appears, no **NX undefined** in the console.
- **Network** tab: `js/engine.js`, `vendor/butterchurn.min.js` return **200** (not redirected to 404 HTML).

## Canonical URL in code

`js/nexus-version.js` defines **`NexusRelease.pagesBaseUrl`** and share-link rewriting. After the live site works, **Copy link** (session seed) targets this URL automatically.
