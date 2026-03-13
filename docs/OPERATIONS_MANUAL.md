# 340B Dashboard — Operations Manual

Step-by-step instructions for maintainers. For architecture and data flow, see [README.md](../README.md).

---

## 0. Project structure (CEO-ready layers)

The dashboard is organized in logical layers. **File locations are kept at repo root where needed** so GitHub Pages and local servers can serve the site without path changes.

| Layer | Purpose | Current paths |
|-------|---------|---------------|
| **Data** | State law data, metadata, versioning, trends | `state-data.js`, `data/dataset-metadata.js`, `data/versioning.js`, `data/historical-trends.js`, `data/raw/`, `data/processed/`, `data/archive/` |
| **Logic** | Map, analytics, validation | `340b.js`, `logic/analytics.js`, `analytics/policy-insights.js`, `analytics/validate-data.js`, `config/settings.js` |
| **UI** | Markup, styles, components | `340b.html`, `340b.css`, `ui/components/` (see ui/components/README.md) |
| **Print** | Print/PDF view and styles | `print/print.html`, `print/print.css` (primary); root `print.html`, `print-view.css` (fallback) |
| **Docs** | Operations manual, change log, security | `docs/operations_manual.md`, `docs/OPERATIONS_MANUAL.md`, `docs/CHECK_CHECK_CHUCK.rtf`, `docs/SECURITY.md` |

**Configuration:** `config.json` holds agent and dashboard settings (update frequency, colors, defaults, `print_view_path`). `config/settings.js` holds runtime feature flags and map/chart options loaded by the dashboard.

**Protected systems:** Do not casually edit the print/PDF flow (`print.html`, `print-view.css`, `print/print.html`, `print/print.css`), the Download PDF (image) path (html2canvas + jsPDF in 340b.js), or the map rendering pipeline (`drawMap`, vendor assets). These are fragile and tightly coupled; changes require manual print-gate verification.

### 100X upgrade layout

- **Print:** The app opens **print/print.html** (with **print/print.css**) for PDF export; root **print.html** remains as a fallback.
- **Trends:** **data/historical-trends.js** provides year-over-year adoption data; **logic/analytics.js** re-exports POLICY_INSIGHTS and HISTORICAL_TRENDS for the logic layer.
- **Components:** Reusable boundaries (map, charts, ranked table, KPI cards) are documented in **ui/components/README.md**; implementation stays in 340b.html and 340b.js.

---

## 1. Adding or updating data

### 1.1 Update state law data (STATE_340B)

1. Open **state-data.js**.
2. Find the state entry (e.g. `PA: { ... }`) or add a new one. Each entry should have:
   - `cp`: `true` if the state has contract pharmacy protection, else `false`
   - `pbm`: optional PBM law flag
   - `y`: year enacted (number, e.g. `2024`), or omit if not enacted
   - `notes`: optional short note
3. Save the file.
4. Open **data/dataset-metadata.js** and set `lastUpdated` and `datasetVersion` to match (e.g. current date and a version you choose).
5. Load the dashboard in a browser and check the console for validation warnings from **analytics/validate-data.js**. Fix any mismatches (e.g. state in STATE_340B but not in STATE_NAMES).

### 1.2 Update dates and copy (CONFIG)

1. In **state-data.js**, update `CONFIG`:
   - `lastUpdated`, `dataFreshness` — e.g. "March 2025"
   - Any copy in `CONFIG.copy` used by the dashboard
2. Keep **data/dataset-metadata.js** `lastUpdated` and `datasetVersion` in sync with the actual data change.

### 1.3 Update methodology or sources

1. Edit **data/dataset-metadata.js**: `methodology`, `sources`, `usageNote`, and optionally `downloadLink`.
2. These values drive the "About Data" panel and any validation messages.

---

## 2. Updating charts and UI

### 2.1 Change dashboard copy or labels

- **340b.html** — headings, section text, button labels, table headers, and "About Data" / methodology structure.
- **state-data.js** — CONFIG.copy and any text that is data-driven (e.g. executive strip).

### 2.2 Change map or filter behavior

- **config/settings.js** — map tooltip delay, animation toggles, feature flags (count-up, scroll reveal, print, share, export SVG), and performance options (e.g. `deferSecondaryPanels`).
- **340b.js** — map drawing, filter logic, state selection, tooltips. The state filter dropdown is synced with the filter buttons in `initStateFilter()`; the ranked table is filled in `fillRankedStateTable()`.

### 2.2b Code clarity (340b.js)

- Section headers (e.g. `/* ===== MAP INITIALIZATION ===== */`) mark logical blocks.
- Magic numbers are replaced with named constants (e.g. `PDF_PAGE1_FALLBACK_RATIO` for page-break calculations).
- Variable names use clear descriptors (e.g. `page1EndY` instead of `break1Y`).

### 2.3 Add a new metric or panel

1. Add the HTML structure in **340b.html** (e.g. a new section with an id for the value).
2. In **340b.js** (or a script in **analytics/** if it's a computation), add a function that reads from CONFIG/STATE_340B/DATASET_METADATA (or POLICY_INSIGHTS) and sets `textContent` on the new element. Use `safeText()` for any string that might ever come from external or user input.
3. Call that function from `init()` — either directly or inside the deferred "secondary panels" block if it's below the fold (see **config/settings.js** `performance.deferSecondaryPanels`).
4. Add styles in **340b.css** if needed.

### 2.3b Pennsylvania Impact Mode (PA Impact)

PA Impact Mode is in `modules/pa-impact-*`. It is fully isolated from 340b.js, map, and print/PDF. Edit **pa-impact-data.js** — `PA_ANCHORS` and `PA_SCENARIO_ESTIMATES` — to change scenario labels or PA-specific estimates. The engine and UI should not be edited unless fixing a bug. Scenario keys must match impact-data.js: `EXPAND_PROTECTIONS`, `CURRENT_STATUS`, `REMOVE_PROTECTIONS`.

### 2.3c Policy Impact Simulator (national)

The national simulator is in `modules/impact-*` and is fully isolated from core dashboard logic:

- **impact-data.js** — Scenario labels and estimated values. Edit `SCENARIOS` and `SCENARIO_ESTIMATES` to change copy or numbers.
- **impact-simulator.js** — Pure logic; returns scenario impact. Do not edit unless fixing a bug.
- **impact-ui.js** — Renders the panel and scenario buttons. Do not edit unless fixing a bug.

Values are illustrative for advocacy storytelling, not predictive. **Safe-edit workflow for scenarios:** (1) Edit `SCENARIOS` and `SCENARIO_ESTIMATES` in impact-data.js; (2) Keep scenario IDs stable (`EXPAND_PROTECTIONS`, `CURRENT_STATUS`, `REMOVE_PROTECTIONS`); (3) Update pa-impact-data.js `PA_SCENARIO_ESTIMATES` to match narrative tone. Do not change `getScenarioIds()` or the engine/UI unless fixing a bug.

### 2.4 Policy insights (national benchmark, adoption summary)

- Logic lives in **analytics/policy-insights.js** (POLICY_INSIGHTS). The main dashboard calls `applyPolicyInsights()` in 340b.js to fill the national policy strip. To change formulas or add metrics, edit **analytics/policy-insights.js** and then the corresponding placeholders in **340b.html** and the fill logic in **340b.js**.

---

## 3. Republishing (e.g. GitHub Pages)

1. **Commit** all changes (state-data.js, dataset-metadata.js, 340b.html, 340b.js, 340b.css, config, analytics, docs).
2. **Push** to the branch that GitHub Pages uses (often `main` or `gh-pages`).
3. **Verify** the live URL (e.g. `https://jordanz00.github.io/340b-dashboard/340b.html`): load the page, run filters, check "About Data," print/PDF, and the ranked table.
4. **Check** the browser console for validation warnings and fix any before or after publish as appropriate.

### Optional pre-publish checklist

- Run **dashboard-audit.py** if available.
- Confirm all external links use `rel="noopener noreferrer"`.
- Confirm PDF/print view shows correct counts and selected state.
- See **SECURITY.md** (root) or **docs/SECURITY.md** for the full static audit checklist.

---

## 4. Security and HTTPS

- **HTTPS requirement:** In production, serve the dashboard over **HTTPS** only. GitHub Pages provides HTTPS by default. For self-hosting, use a TLS certificate and redirect HTTP to HTTPS. Document the canonical URL in CONFIG.shareUrlBase (state-data.js) and in meta og:url (340b.html).
- **Content Security Policy (CSP):** 340b.html and print.html include a CSP meta tag (`Content-Security-Policy`) that restricts script sources to `'self'` and (for the main page) `https://unpkg.com` for PDF libraries. Do not relax CSP for untrusted domains. See **docs/SECURITY.md** for details.
- **Data and DOM:** Validate all data from JSON/CSV before use. Use `textContent` or `safeText()` for dynamic content; never `innerHTML` with user or external data. See **docs/SECURITY.md** for XSS prevention.

---

## 5. Running self-update waves (optional)

The dashboard has a **self-upgrade** system that tracks improvement waves (architecture, analytics, UX, performance, docs). **Requires Node.js** (e.g. `node --version` to check).

1. **See next wave:** From project root run `node self_upgrade/self_update.js`. It prints the next wave and its prompts.
2. **Apply the prompts:** Edit the files as described (or use an AI assistant to apply the changes).
3. **Test:** Load the dashboard, run filters, check print/PDF.
4. **Record:** Run `node self_upgrade/self_update.js --record-wave=N` (e.g. `--record-wave=1`) to log completion. The log is written to `data/archive/upgrade-log.json`.
5. **Validate:** Run `node self_upgrade/self_update.js --validate` to check that key files and the prompts file are in place.

See **[docs/PROMPTS.md](PROMPTS.md)** for the full workflow and wave order.

---

## 6. Running the multi-agent system (optional)

**10 specialized agents** propose improvements by wave; **Agent 9** validates and approves; **Agent 10** scores the CEO experience. Requires Node.js.

1. **Run all waves:** `node agents/run-waves.js` — runs agents 1–8, then Agent 9 (cross-validator), then Agent 10 (CEO auditor). Writes logs to **data/archive/agents/** and **data/archive/approved-changes-&lt;timestamp&gt;.json**.
2. **Single wave:** `node agents/run-waves.js --wave=3` — runs only the agent for that wave.
3. **Dry run:** `node agents/run-waves.js --dry-run` — no files written; summary on stdout.
4. **Apply approved changes:** Review **data/archive/approved-changes-*.json** and apply the listed proposals (manually or with tooling). Then run the dashboard audit and print gate.

See **[docs/MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md)** for agent roles, scoring, and outputs.

---

## 7. Daily self-improvement (novice maintainers)

- **Data:** When you get new state law or date info, update **state-data.js** and **data/dataset-metadata.js** together, then reload and fix any validation warnings.
- **Copy:** Change only in one place — state-data.js for data-driven text, 340b.html for static labels — so the dashboard and print view stay in sync.
- **Security:** Don't add `innerHTML` with data; use `textContent` or `safeText()`. Don't add `JSON.parse` without try/catch. Keep external links with `rel="noopener noreferrer"`.
- **Performance:** If the page feels slow, try enabling `performance.deferSecondaryPanels` in **config/settings.js** so below-the-fold panels run after first paint.
- **Docs:** After you change a flow (e.g. where data lives or how republish works), update this manual and **docs/README.md** so the next person has accurate steps.

---

## 8. Change log (CHECK_CHECK_CHUCK)

After each upgrade wave or release, review **docs/CHECK_CHECK_CHUCK.rtf** for:

- Files modified
- Lines added/removed (summary)
- New modules/components
- Agent suggestions implemented
- Version and date

Use it to confirm changes before republishing and for future maintenance.
