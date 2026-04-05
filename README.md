# HAP 340B Advocacy Dashboard

A single-page dashboard for lawmakers and hospital CEOs on the 340B Drug Pricing Program. Built for the Hospital and Healthsystem Association of Pennsylvania.

**Communications & CEO briefings — start here:** **[340b-BASIC.html](340b-BASIC.html)** is the primary, IT-safe product (local scripts, interactive map, full advocacy story). **[340b.html](340b.html)** is the **advanced** dashboard (Print/PDF, share, PDF download, live simulators). See **[docs/CEO-SHOWCASE.md](docs/CEO-SHOWCASE.md)** for talking points and deployment guidance.

**Maintainers:** **[NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md)** (what to edit), **[docs/INDEX.md](docs/INDEX.md)** (all docs), **[GLOSSARY.md](GLOSSARY.md)** (terms), **[CONFIG-INDEX.md](CONFIG-INDEX.md)** (settings).

**Cursor / AI copilot:** **[JARVIS.md](JARVIS.md)** — how **Jarvis** (always-on supervisor + assistant) uses this repo; pair with `.cursor/rules/jarvis-supervisor-assistant.mdc` and [docs/SUPERVISOR-SYSTEM.md](docs/SUPERVISOR-SYSTEM.md).

## Files

| File | Purpose |
|------|---------|
| `340b.html` | Main page structure and content |
| `340b.css` | All styling (design system, layout, components) |
| `340b.js` | Interactivity: map, filters, animations, buttons |
| `state-data.js` | **Edit this** for dates and state law data |
| `DATA-UPDATE.md` | Step-by-step guide to update state data |
| `NOVICE-MAINTAINER.md` | **Start here** — maintainer guide, code map, protected systems |
| `GLOSSARY.md` | Definitions for CONFIG, print snapshot, simulators, etc. |
| `CONFIG-INDEX.md` | Which file holds each kind of setting |
| `docs/INDEX.md` | Documentation navigation hub |
| `docs/POWER-BI-READINESS-PLAYBOOK.md` | **Power BI + warehouse:** day-one readiness, IT handoff, links to `powerbi/` artifacts |
| `powerbi/` | Theme JSON, DAX samples, Gold DDL/views reference, `metric-registry.json` — see [powerbi/README.md](powerbi/README.md) |
| `docs/CEO-SHOWCASE.md` | CEO/comms brief, BASIC-first, talking points |
| `docs/DESIGN-ITERATION-CHECKLIST.md` | Design pass each release |
| `docs/340b-js-map.md` | Full-dashboard `340b.js` function map (advanced) |
| `340b-BASIC.html` | **Primary for comms** — IT-safe (local scripts only); see [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md), [docs/CEO-SHOWCASE.md](docs/CEO-SHOWCASE.md) |
| `QA-CHECKLIST.md` | Pre-push verification checklist |
| `dashboard-audit.py` | Lightweight self-audit for dashboard regressions |
| `THREAT-MODEL.md` | Static-site threat model and security boundaries |
| `AI-HANDOFF.md` | AI memory structure and project context |
| `print.html` | Dedicated print view (map + data from localStorage); used by Print / PDF |
| `print-view.css` | Print view layout and print-specific styles |
| `EXECUTIVE-READY-UPGRADE.md` | Executive-ready improvements and implementation log |
| `assets/vendor/` | Local map libraries and U.S. atlas data |
| `340b-advocacy-lab.html` | **Developer / PBI reference:** PA hospital map (verified points), KPI bar chart via `DataLayer`, story JSON, print export — `modules/advocacy-lab.js`, `advocacy-lab.css` |
| `SECURITY.md` | Static-host security and audit notes |
| `config.json` | Multi-agent and self-upgrade config: archive_path, daily_update, ultra_prompt_wave_size, rules_per_wave, security_checks |
| `ultra_prompts.json` | Self-improvement waves (root copy; also in self_upgrade/). 10 waves, agent file names. |
| `OPERATIONS_MANUAL.md` | Root entry point; full manual in [docs/OPERATIONS_MANUAL.md](docs/OPERATIONS_MANUAL.md) |
| `modules/` | Simulators — see [modules/README.md](modules/README.md) |
| `config/` | Dashboard settings — `config/settings.js` |
| `data/` | Dataset metadata — `data/dataset-metadata.js` |
| `analytics/` | Validation and policy insights |
| `docs/` | [docs/INDEX.md](docs/INDEX.md), [docs/README.md](docs/README.md), [OPERATIONS_MANUAL.md](docs/OPERATIONS_MANUAL.md), [PROMPTS.md](docs/PROMPTS.md) |
| `self_upgrade/` | Self-improvement waves: [ultra_prompts.json](self_upgrade/ultra_prompts.json), [self_update.js](self_upgrade/self_update.js) |
| `agents/` | Multi-agent system: 10 agents + [run-waves.js](agents/run-waves.js). See [docs/MULTI_AGENT_SYSTEM.md](docs/MULTI_AGENT_SYSTEM.md). |
| `ui/` | [ui/README.md](ui/README.md) — UI docs; main dashboard files stay at root |

## Quick edits (beginner-friendly)

If you are new to this repo, use **[GLOSSARY.md](GLOSSARY.md)** when a term is unclear.

- Change facts and dates in `state-data.js`
- Change high-salience intro or trust-copy defaults in `state-data.js`
- Change visible copy or section order in `340b.html`
- Change layout and print appearance in `340b.css`
- Change buttons, map behavior, filters, sharing, or print logic in `340b.js`

### Update dates
Open `state-data.js` and change:
- `dataFreshness` — e.g. `"March 2026"`
- `lastUpdated` — e.g. `"March 2026"`
- `shareUrlBase` — if the public dashboard URL changes
- `copy` — if the intro, HAP ask, source summary, or executive-scan wording needs to change

### How to update state law data
1. Open **state-data.js**
2. Find the state in `STATE_340B` (e.g. `PA: { y: null, pbm: false, cp: false, notes: "In progress." }`)
3. Change `cp: true` if they now have contract pharmacy protection
4. Update `y` (year), `pbm`, and `notes` as needed
5. Sync `CONFIG.lastUpdated` and `data/dataset-metadata.js` if dates change
6. Run `python3 dashboard-audit.py`
7. Test the dashboard: map, filters, Print/PDF, Download PDF

See **DATA-UPDATE.md** for full instructions.

## Running locally

**Use a local web server** so all scripts load and the dashboard matches the [live site](https://jordanz00.github.io/340b-dashboard/340b.html). If you open `340b.html` directly (file://), you may see "Dashboard data didn't load" and a blank map because browsers can block loading other local scripts.

```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve
```

Then visit `http://localhost:8000/340b.html` (or the URL `npx serve` prints).

Do not rely on opening the file from the file browser when checking interactive behavior.

## Dependencies

- Local copies of D3, TopoJSON Client, and U.S. Atlas data in `assets/vendor/`
- System fonts only for privacy and simpler hosting

No package install is required for the dashboard itself.

## Protected systems

Do **not** modify these without explicit need — they are finalized:

- **Print system** — `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` localStorage, `print.html`
- **PDF image export** — `downloadPdfAsImage()`, html2canvas, jsPDF layout
- **Map** — SVG structure, injection logic; never add `overflow:hidden` to `.map-wrap` or `.us-map-wrap`

See **NOVICE-MAINTAINER.md** and **CHATGPT-PROJECT-HANDOFF.md** for full constraints.

## Features

- **Pennsylvania Impact Mode** — PA-specific estimates: hospitals, pharmacies, patient access, community benefit
- **Policy Impact Simulator** — National scenarios (expand, current, remove protections)
- Interactive US map (click states for details)
- State list buttons sync with map and detail panel
- Filter states by `All`, `Protection`, or `No protection`
- Keyboard navigation
- Share link (copies a canonical URL with selected state hash)
- Print / PDF: 2-page polished layout, final-state snapshot
- Executive scan strip with policy, national, and trust cues
- Selected-state summary near the map
- Selected-state map context that tightens the story when a state is chosen
- Local map fallback summary if the map cannot load
- Hash deep-links like `#state-PA`
- Responsive (mobile-friendly)

## Security and hosting

- See `SECURITY.md` for recommended static-host headers and audit checks.
- See `THREAT-MODEL.md` for the current security boundaries and highest-risk surfaces.
- Vendor asset provenance is recorded in `assets/vendor/README.md`.

## Highest-risk surfaces

If you are deciding where to be most careful, use this order:

1. print/PDF preparation and page flow
2. high-salience copy, source dates, and legal-status wording
3. URL hash state and selection recovery
4. share-link behavior and fallback copy
5. map rendering and local vendor assets

## Executive Mode and daily improvement

For structured upgrades and periodic polish, use the **Executive Mode** / **daily improvement workflow**: run the next ULTRA wave from `ULTRA-prompts.md`, apply changes, then audit and update handoff. See [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md) for the full flow.

## Maintenance workflow

Use this order to keep the project easy to maintain:

1. Update content in `state-data.js` or structure in `340b.html`.
2. Update behavior in `340b.js` only if the change is interactive.
3. If the change affects layout or print appearance, check `340b.css` before editing JavaScript.
4. Open the dashboard locally and test the exact feature you changed.
5. Open `Print / PDF` and confirm the PDF-only reader still sees the real intro cards, the map, final metric values, and Pennsylvania as the default print context when no state is selected live.
6. Run `python3 dashboard-audit.py`.
7. Use `QA-CHECKLIST.md`.
8. For deeper static analysis after security-sensitive changes, run `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .`.
9. Publish only after the manual print and source checks pass.

If the dashboard or PDF would confuse a lawmaker, hospital CEO, or hospital administrator, treat that as a release blocker.

## Common fixes

### If print preview is wrong

Check these files in this order:

1. `340b.html` — confirm the real intro cards still exist and there is no duplicate print-only copy.
2. `340b.css` — check the `@media print` section for anything hiding content, causing page breaks, or making print-only summaries too large.
3. `340b.js` — check `preparePrintSnapshot()`, `preparePrintSelectionState()`, `updateExecutiveProofStrip()`, `updateMapContext()`, and `finalizeCountUpValues()`.

### If source guidance needs updating

Check these files in this order:

1. `340b.html` in the `About this data` section
2. `state-data.js` for dates, executive-scan copy, and legal-status notes
3. `QA-CHECKLIST.md` for release verification wording

### If the map is missing

- If you see **"Dashboard data didn't load"** in the map area, you are likely opening the page via file://. Use a local server (see **Running locally** above).
- Otherwise check these files in this order:

1. `assets/vendor/states-10m.js`
2. `340b.html` script tags
3. `340b.js` function `drawMap()`

### If a button stopped working

Check these files in this order:

1. `340b.html` for the button `id`
2. `340b.js` for the related `init...` function
3. browser console warnings
