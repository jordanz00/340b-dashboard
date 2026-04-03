# Novice code tour — what everything is (plain language)

This is the **semantic map** of the HAP 340B dashboard codebase: what each part *means*, not jargon for its own sake. Use it alongside **[NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md)** (“what do I edit?”) and **[340B-DASHBOARD-DATA-AND-SOURCES.md](340B-DASHBOARD-DATA-AND-SOURCES.md)** (numbers and citations).

---

## 1. The two products (same topic, different technical rules)

| What we call it | Files | In one sentence |
|-----------------|-------|-----------------|
| **Full / Advanced dashboard** | `340b.html`, `340b.js`, `340b.css`, `modules/*`, print/PDF tools | Everything: map, share, print, simulators, extra maps. |
| **Basic dashboard (IT-safe)** | `340b-BASIC.html`, `340b-basic-map.js`, local D3/topojson only | Same story for users in locked-down environments: **no** remote scripts, **no** print-to-PDF stack, **no** `localStorage`. |

If someone says “the map broke,” first ask **which HTML file** they opened.

---

## 2. How a page loads (mental model)

1. **Browser reads HTML** — structure, headings, first paint of text and empty regions.
2. **`state-data.js` runs** — defines `CONFIG` (dates, titles, long-form copy) and `STATE_340B` (each state’s law flags). This is the **numbers-and-policy spreadsheet** the page runs on.
3. **`340b.js` runs** — finds elements by `id`, draws the map, wires buttons, reads the URL hash (`#state-PA`), prepares print.
4. **Optional modules** load after — Pennsylvania Impact and Policy Simulator fill their boxes only on the full dashboard.

---

## 3. Main files (what lives where)

| File | Plain-language role |
|------|---------------------|
| **state-data.js** | **Single source of truth** for dates, share URLs, and state-by-state law data. Start here when a stat or law changes. |
| **340b.html** | **The visible page**: sections, tables, KPI text. Section comments look like `<!-- ========== SECTION: … ========== -->`. |
| **340b.js** | **Behavior**: map drawing, clicks, filters, share link, print snapshot, PDF image export, bill cards, navigation highlighting. Large file; use the section banners inside it + the table below. |
| **340b.css** | **Look and layout**, including **print** rules. Changing print often needs both CSS and a quick print test. |
| **hap-nav-shared.js** | **Scroll spy** for Basic (and any page without full `340b.js`): which nav link looks “active” as you scroll. Must stay in sync with real `id="..."` on the page. |
| **print.html** + **print-view.css** | **Second window** that shows a print-friendly layout; `340b.js` passes a **snapshot** of text + map via `localStorage`. |
| **hap-design-tokens.css** | **Design variables** (colors, type scale). Shared idea of “HAP blue” etc. |
| **modules/pa-impact-*.js** | **Pennsylvania scenario panel**: data → engine → UI. Numbers there are **storytelling**, not HRSA exports (see data dictionary). |
| **modules/impact-*.js** | **National policy simulator** — same idea: three fixed scenarios, illustrative counts. |
| **340b-basic-map.js** | **Map only** for Basic: reads `STATE_340B` / `STATES_WITH_PROTECTION`, uses `textContent` only. |
| **analytics/policy-insights.js** | **Charts / policy summaries** built from `STATE_340B` (adoptions over time, etc.). |
| **data/pa-districts/** | **Shape files and hospital points** for the Pennsylvania legislative district map. |
| **dashboard-audit.py** | **Automated safety/consistency check** — run after meaningful edits. |

---

## 4. Inside `340b.js` — big blocks in reading order

The file is long; you do **not** need to memorize it. Jump using these **ideas** (matching comment banners in the file):

| Topic | What it does (novice explanation) |
|-------|-------------------------------------|
| **Top of file configs** | `PA_BILL_CONFIG`, `FEDERAL_BILL_CONFIG`, delegation list, sparkline **story** numbers — edited by Advocacy/Comms, not calculated from HRSA. |
| **`config` + `appState`** | `config` mirrors `CONFIG` from `state-data.js`. `appState` holds “which state is selected,” map nodes, filter mode. |
| **DOM cache (`cacheDom`)** | **One-time lookup** of elements by `id`. If you rename an `id` in HTML, you must update this list or features break. |
| **Small helpers** | `safeText`, `setElementText`, `runTaskSafely` — keep the app from crashing when one feature errors. |
| **Count-up + print visibility** | Big numbers animate on scroll; before print they are **frozen** and hidden sections are **revealed** so PDFs are complete. |
| **Print payload (protected)** | Builds the object saved for `print.html` (**do not rework casually** — release gate is print preview). |
| **State data helpers** | Turn map shapes into “PA”, “TX”, read `STATE_340B` row for that state. |
| **Selection + detail panel** | When you click a state: highlight map, fill the side panel, update the sentence under the map. |
| **Share + URL hash** | `#state-PA` deep-links; share drawer builds Twitter/LinkedIn/mailto with the same link. |
| **Map lifecycle** | Load topojson, draw SVG paths, tooltips, keyboard, **fallback** if data fails. **Never** add `overflow: hidden` to map wrappers (breaks print). |
| **State chips + filters** | The two lists under the map; filter buttons show all / protected only / unprotected only. |
| **Charts / ranked table** | Adoption chart and sortable table from analytics scripts. |
| **Utility buttons** | Print button, export map as SVG, dataset CSV/JSON download. |
| **PDF image export** | Uses html2canvas + jsPDF on desktop; on phones may redirect to the print page instead. |
| **Share + clipboard** | Opens drawer, copies link, refreshes social URLs. |
| **Sparklines + KPI extras** | Small charts next to headlines; data is **illustrative** for shape, not a government time series. |
| **Scroll reveal + timeline** | Sections fade/slide in; policy timeline uses intersection observers for performance. |
| **PA bill + federal banner + delegation + district map** | Renders advocacy widgets; district map uses files under `data/pa-districts/`. |
| **Navigation highlight** | Full dashboard version: scroll position → active nav link (similar idea to `hap-nav-shared.js`). |
| **`init()`** | **Startup checklist**: every `runTaskSafely("…", fn)` is one feature turning on; order matters a little (map after DOM ready). |

For a shorter function list maintained for agents, see **docs/340b-js-map.md** (if present).

---

## 5. Print / PDF flow (conceptual)

1. User clicks **Print / PDF** (or leave-behind export).
2. **`preparePrintSnapshot`** finalizes numbers, reveals sections, optionally picks a default state for print, clones intro content into the print snapshot region.
3. **`getPrintViewPayload`** gathers text, KPI strings, and **SVG strings** for the US map (and PA district map if present).
4. Payload is stored under a **namespaced `localStorage` key**; **print.html** reads it and lays out two pages.
5. **Download PDF (image)** is a **different** path: rasterizes slices of the live page (desktop); treat as fragile and test after UI changes.

---

## 6. Security habits (why the code looks the way it does)

- Prefer **`textContent`** over **`innerHTML`** for anything that could ever include outside data.
- **URL hash** is checked against a **known list of state codes** so random strings cannot drive logic.
- **Basic** page: no CDN, no eval, no storing snapshots — see **SECURITY.md**.

---

## 7. Glossary of names you will see in code

| Term | Plain meaning |
|------|----------------|
| **340B** | Federal drug discount program for certain hospitals/clinics; hospitals use savings for patient care and community programs. |
| **Contract pharmacy** | A retail or specialty pharmacy that fills prescriptions under contract with an eligible hospital/clinic. |
| **Covered entity** | Eligible organization in 340B (often used in HRSA audit language). |
| **OPAIS** | HRSA’s online database of program participation (used for PA hospital counts after HAP reconciliation). |
| **TopoJSON** | Compressed map geometry; we turn it into an SVG map. |
| **Count-up** | Animated number from 0 to target when the user scrolls to it. |
| **Sparkline** | Tiny inline trend graphic. |

Full term list: **GLOSSARY.md**.

---

## 8. After you change something

1. Open the page locally and click the thing you changed.
2. **Print preview** if you touched print, map, or big layout blocks.
3. Run **`python3 dashboard-audit.py`**.
4. For Basic-only edits, confirm you did **not** add external scripts.

---

*This tour describes the repository layout and intent. It is not legal or policy advice.*
