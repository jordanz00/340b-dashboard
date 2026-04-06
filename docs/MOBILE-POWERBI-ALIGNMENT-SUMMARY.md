# Mobile 340B dashboard + Power BI / warehouse — alignment summary

**Audience:** HAP staff across advocacy, communications, IT, analytics, and finance — including people new to Power BI.  
**Priority surface:** `340b-mobile.html` (with `340b-mobile.js`, `340b-mobile.css`).  
**Date:** April 2026 (report generated from repo state and `git diff` on mobile files).

---

## 1. Parallel subagents and cross-checks (where it actually lives)

This repo does **not** use LLMs or Python scripts to simulate dozens of HAP job titles. The real **subagent** pipeline is:

- **`agents/run-waves.js`** (Node) — runs **10 specialized agents** in waves (data, metrics, UI, security, performance, docs, etc.). Each agent **proposes** changes; they do not silently merge conflicting edits.
- **`agents/agent_validator.js` (Agent 9)** — takes **everyone’s proposals**, scores them, **resolves conflicts**, and decides what is approved. That is the machine-side “each checking the others’ work.”
- **`.cursor/rules/multi-agent-supervisor.mdc`** + **Jarvis** — human/AI supervisor gates (data, compliance, security, semantic layer) for continuous review while you work in Cursor.

**“Departments” in practice:** Each wave/agent corresponds to a concern (security, UX, data integrity). Feedback is **continuous** in the sense that you can re-run waves after edits and Agent 9 always reconciles the full proposal set; in Cursor, you use the supervisor checklist the same way across changes.

See **`docs/MULTI_AGENT_SYSTEM.md`** and **`agents/README.md`** for commands and outputs (`data/archive/agents/`, `approved-changes-*.json`).

**Automated sanity check (includes security patterns, not org roles):**

```bash
python3 dashboard-audit.py
```

Confirm mobile `data-metric-key` values match **`powerbi/metric-registry.json`** when you change KPIs (manual diff or editor search is enough).

---

## 2. What changed on the mobile application (from current `git diff`)

These are **uncommitted / working-tree** changes relative to `origin/main` as of this pass. They improve advocacy safety, PDF quality, small-screen layout, and warehouse readiness.

### `340b-mobile.html`

- Loads **`data/pa-legislator-incumbency.js`** before `modules/pa-district-map.js` so PA district logic can use incumbency data in the intended order.

### `340b-mobile.js` (behavioral)

- **Null-safe tab bar** — avoids errors if the tab bar DOM is missing.
- **Map tab + search** — re-applies state card filters when switching to the Map tab so the grid matches the search box.
- **iOS Safari search** — listens for the `search` event so clearing the native search “x” still updates filtered state cards.
- **Trusted legislator URLs** — uses `DataLayer.isTrustedLegislatorUrl()` so links only go to allowlisted official sites (PA Legislature, House/Senate `.gov`, Congress.gov, Bioguide). Otherwise cards render as **non-link** blocks (`leg-card--no-link`, `fed-card--no-link`, `zip-result-card--no-link`).
- **`upgradeStaticPaLegislatorCards()`** — upgrades static HTML leg cards the same way on load.
- **Advocacy PDF / print** — before generating PDF, **`prepareReportMapSnapshots`** switches to the correct tab, waits for SVG paths, clones maps with **`cloneSvgForPrintReport`**, and **`appendPrintMapSection`** adds map + legend blocks (`pr-print-map-*` classes). Restores the user’s tab afterward. Fallback copy if the map never renders.
- **Federal delegation and zip results** — same safe URL pattern as above.

### `340b-mobile.css` (presentation)

- **Search / zip row overflow** — `flex: 1 1 0; min-width: 0` on inputs so long placeholders do not blow out small screens; zip button `max-width: 42%` and tighter padding.
- **Non-link cards** — `.leg-card--no-link`, `.fed-card--no-link`, `.zip-result-card--no-link` (no fake “link” affordance).
- **Print/PDF map blocks** — large block for `.pr-print-map-*` (page-break avoidance, legend rows, map frame).

### Cross-check vs main dashboard (`340b.html` / `340b.js`)

The cross-check script and semantic tables below are **mobile-first**, but the **same `MetricKey` names and `DataLayer` methods** feed the advanced dashboard when you connect the warehouse. Any change to `modules/data-layer.js`, `powerbi/metric-registry.json`, or Gold shapes affects **both** surfaces — note that in PM1 (executive / program) review.

---

## 3. Semantic layer — every `MetricKey` on mobile

These keys appear as `data-metric-key` on `340b-mobile.html`. They are the **stable contract** between the UI, `DataLayer`, and the future warehouse / Power BI semantic model.

| MetricKey | UI location (tab / widget) | Primary `DataLayer` method | Gold table (target) | Value column | Notes |
|-----------|-----------------------------|----------------------------|---------------------|--------------|--------|
| `PA_HOSPITALS_340B_COUNT` | Home KPI, PA stats | `getKPIs()` / `getPA()` | `fact_dashboard_kpi` | `ValueNumeric` | Also drives PA hero title when warehouse refreshes |
| `COMMUNITY_BENEFIT_TOTAL_BILLIONS` | Home KPI | `getKPIs()` | `fact_dashboard_kpi` | `ValueNumeric` | Prefix/suffix/decimals from KPI row |
| `US_STATES_CP_PROTECTION_COUNT` | Home KPI, landscape strip | `getKPIs()` | `fact_dashboard_kpi` or derived from `dim_state_law` | `ValueNumeric` | DC exclusion per project standard |
| `US_STATES_NO_CP_PROTECTION_COUNT` | Home KPI, landscape strip | `getKPIs()` | same | `ValueNumeric` | Paired with protected count |
| `PA_RURAL_HOSPITAL_PCT` | PA Focus | `getPA()` | `fact_dashboard_kpi` | `ValueNumeric` | `%` suffix in HTML |
| `PA_HOSPITALS_OPERATING_LOSS_PCT` | PA Focus | `getPA()` | `fact_dashboard_kpi` | `ValueNumeric` | |
| `PA_LD_SERVICES_PCT` | PA Focus | `getPA()` | `fact_dashboard_kpi` | `ValueNumeric` | |
| `HRSA_HOSPITAL_AUDIT_COUNT` | PA oversight bar | `getPA()` | `fact_dashboard_kpi` | `ValueNumeric` | |
| `HRSA_MANUFACTURER_AUDIT_COUNT` | PA oversight bar | `getPA()` | `fact_dashboard_kpi` | `ValueNumeric` | Ratio sentence updated in JS when warehouse loads |

**Canonical registries (do not drift):**

- `powerbi/metric-registry.json` — definition, units, citations, `goldColumns`.
- `powerbi/semantic-layer-registry.json` — placeholder IDs, HTML hints, `dataLayerMethod`, `pbiReady`.
- `docs/DATA-DICTIONARY.md` — human-readable field meanings.

---

## 4. Power BI for novices — how data gets from the warehouse to visuals

Think in **four layers** (same idea as Power BI’s “get data → model → measures → report”):

### Layer A — Physical data (IT / warehouse)

Tables such as `fact_dashboard_kpi` and `dim_state_law` (names may differ; IT confirms). Important columns for KPI cards:

- `MetricKey` (text) — **must match** the keys in the table above.
- `ValueNumeric` (decimal).
- `AsOfDate` / `SourceCitation` — for freshness and audit.

**Schema reference:** `powerbi/gold-schema-reference.sql`.

### Layer B — Power Query / dataset

1. Open **Power BI Desktop**.
2. **Get Data** → your warehouse connector (SQL, Fabric, etc.).
3. Load the Gold tables IT exposes.
4. In **Power Query**, keep column names **or** rename to match the reference schema and document the mapping in `docs/POWER-BI-DATA-MODEL-MAPPING.md`.

### Layer C — Semantic model (relationships + measures)

1. Mark `fact_dashboard_kpi[MetricKey]` as the **filter key** for KPI visuals.
2. Copy or adapt measures from `powerbi/measures-340b.dax` (adjust table names to match IT).
3. Apply theme: `powerbi/hap-340b-theme.json`.

**Novice tip:** One **simple star** is enough for v1: a single fact table `fact_dashboard_kpi` with one row per `MetricKey`, no joins required for headline cards.

### Layer D — Report pages

Follow `docs/POWER-BI-REPORT-BLUEPRINT.md` and `docs/POWER-BI-IT-DISCOVERY-CHECKLIST.md` for IT-specific questions (refresh, gateways, row-level security).

---

## 5. Connecting the **mobile web app** to the warehouse (easiest path)

This is **Path A** in `docs/WAREHOUSE-INTEGRATION-GUIDE.md` — no Power BI embed required for the public mobile UI to update.

1. IT publishes a JSON endpoint whose shape matches **`data/mock-api-response.json`** (same top-level keys: `dim_state_law`, `fact_dashboard_kpi`, `dim_data_freshness`, etc.).
2. In **`config/settings.js`**, set:

   - `warehouse.enabled: true`
   - `warehouse.endpointUrl: "<https URL from IT>"`
   - Optional: `warehouse.useMockEndpoint: true` for local UAT (loads `data/mock-api-response.json`).

3. On load, **`340b-mobile.js`** calls `initWarehouseBootstrap()` → `DataLayer.connectWarehouse()` → `onRefresh` → `rehydrateAfterWarehouse()` → `applyDataMetricElements()` updates every `[data-metric-key]` node and re-runs count-up animations.

**You do not change HTML** when numbers move to the warehouse — the `MetricKey` attributes stay the source of binding.

**Path B (internal):** Build a standard Power BI report on the same Gold tables — parallel to the website, not a replacement.

**Path C (embed):** Optional iframe/SDK — see warehouse guide; keep separate from warehouse JSON to avoid `source` conflicts.

---

## 6. Documentation and artifacts touched in this pass

| Artifact | Purpose |
|----------|---------|
| `docs/MOBILE-POWERBI-ALIGNMENT-SUMMARY.md` | This single summary (mobile + Power BI + warehouse) |
| `docs/WAREHOUSE-INTEGRATION-GUIDE.md` | Link to this summary for discoverability |
| `powerbi/semantic-layer-registry.json` | `_relatedDocs` includes this summary |
| `docs/MULTI_AGENT_SYSTEM.md` | Official parallel wave agents + Agent 9 cross-validation |

---

## 7. Suggested verification before merge

```bash
node agents/run-waves.js --dry-run   # optional: see proposals without writing files
python3 dashboard-audit.py
```

Spot-check: open `340b-mobile.html`, toggle warehouse mock mode once, confirm KPIs still animate and freshness text updates.

---

## 8. Supervisor-style verdict (condensed)

| Lens | Status | Note |
|------|--------|------|
| Data / PBI (`D1_PBI1`) | Pass (verify on change) | Keep `data-metric-key` on mobile aligned with `powerbi/metric-registry.json` |
| Compliance (`C1`) | Pass (pending SME) | Numbers still trace to `state-data.js` / cited sources — no new stats invented in this pass |
| Security (`S1`) | Pass | Stricter URL allowlist; no new secrets in repo |
| UX / mobile (`F1`/`F2`) | Pass | Search, zip layout, non-link cards |
| QA (`Q1`) | Pass (spot-check) | PDF map capture + fallback path added — test on target devices |

**Sources:** `340b-mobile.html`, `340b-mobile.js`, `340b-mobile.css`, `modules/data-layer.js`, `config/settings.js`, `powerbi/metric-registry.json`, `powerbi/semantic-layer-registry.json`, `data/mock-api-response.json`.
