# HAP Regulatory Advocacy 2026

Static executive brief for **Pennsylvania Department of Health** engagement: April 16, 2026 letter context, verified hospital statistics, national TJC ambulatory map snapshot, **three regulatory priorities**, PA vs Medicare/US comparison, and source-linked citations. **Not** the 340B dashboard product—this is its own advocacy brief. **No build step** — open `index.html` locally or host on **GitHub Pages**.

**Repository:** [https://github.com/jordanz00/hap-regulatory-advocacy-2026](https://github.com/jordanz00/hap-regulatory-advocacy-2026)

**GitHub “About” description:** copy the single line from [.github/ABOUT-DESCRIPTION.txt](.github/ABOUT-DESCRIPTION.txt) into **Settings → General** (Repository description), or run `gh repo edit jordanz00/hap-regulatory-advocacy-2026 --description "$(tr '\n' ' ' < .github/ABOUT-DESCRIPTION.txt)"` if you use the GitHub CLI.

---

## Quick setup (if you’ve done this before)

**Clone**

```bash
git clone https://github.com/jordanz00/hap-regulatory-advocacy-2026.git
cd hap-regulatory-advocacy-2026
```

**Run locally** — double-click `index.html`, or from this directory:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080) (desktop) or [http://localhost:8080/reg-advocacy-mobile.html](http://localhost:8080/reg-advocacy-mobile.html) (mobile shell).

**First push to an empty GitHub repo** (makes the “Quick setup / create a new file” page go away):

```bash
git clone https://github.com/jordanz00/hap-regulatory-advocacy-2026.git
cd hap-regulatory-advocacy-2026
# copy site files into this folder (repo root = site root: index.html, facts.js, vendor/, …)
git add -A
git commit -m "Add HAP Regulatory Advocacy 2026 site"
git push -u origin main
```

Or, from a machine that has the site folder elsewhere, use the included script (creates a clean repo and pushes). If GitHub already has a `main` branch (for example you clicked “Add README” on the empty-repo page), the script **replaces `main`** with this folder so the boilerplate screen goes away:

```bash
bash publish-standalone.sh https://github.com/jordanz00/hap-regulatory-advocacy-2026.git
```

---

## Live site (after Pages is enabled)

- **Desktop:** [https://jordanz00.github.io/hap-regulatory-advocacy-2026/](https://jordanz00.github.io/hap-regulatory-advocacy-2026/)  
- **Mobile shell:** [https://jordanz00.github.io/hap-regulatory-advocacy-2026/reg-advocacy-mobile.html](https://jordanz00.github.io/hap-regulatory-advocacy-2026/reg-advocacy-mobile.html)

## GitHub Pages

1. Repo **Settings → Pages → Build and deployment**  
   - **GitHub Actions** (uses `.github/workflows/deploy-pages.yml`), **or**  
   - **Deploy from a branch** → `main` → `/ (root)` — use one source only.

2. After the first successful deploy, wait a minute and open the live URLs above.

## Monorepo copy (340b-dashboard workspace)

The same files may live under **`340b-dashboard/hap-regulatory-advocacy-2026/`** for editing. That path is **not** the public product URL unless you deliberately publish the whole monorepo and accept a long path. For the **dedicated** regulatory-advocacy site, always mirror **this folder’s contents to the root** of **this** repo (`hap-regulatory-advocacy-2026` or your org’s equivalent) so `index.html`, `vendor/`, and `facts.js` paths match GitHub Pages.

## LICENSE

Add a `LICENSE` file when HAP legal/comms approves distribution terms (GitHub’s template reminder is optional for internal or pre-release repos).
