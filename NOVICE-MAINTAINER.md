# Novice Maintainer Notes

**Start here:** This file is the single entry point for “what do I edit?” Use **[GLOSSARY.md](GLOSSARY.md)** for term definitions, **[CONFIG-INDEX.md](CONFIG-INDEX.md)** for where each setting lives, and **[docs/INDEX.md](docs/INDEX.md)** for all documentation links.

| **Primary product (communications, CEO, IT-safe deploy)** | **[340b-BASIC.html](340b-BASIC.html)** — edit copy in the HTML; map data in **state-data.js**. See [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md) and [docs/CEO-SHOWCASE.md](docs/CEO-SHOWCASE.md). |
| **Advanced dashboard** | **[340b.html](340b.html)** + **[340b.js](340b.js)** — Print/PDF, share, filters, simulators. See [docs/340b-js-map.md](340b-js-map.md) if you must touch behavior. |

---

## One-page code map

| File | Role | Edit when… | See also |
|------|------|------------|----------|
| **state-data.js** | CONFIG, STATE_340B, lookups | Dates, share URL, state law, intro/trust copy | [DATA-UPDATE.md](DATA-UPDATE.md), [GLOSSARY.md](GLOSSARY.md) |
| **340b.html** | Structure, visible content, inline CONFIG fallback | Headings, sections, links, initial HTML that must match JS | Section comments `<!-- ========== SECTION: … ========== -->` |
| **340b.js** | Map, filters, print/PDF/share, hash | Buttons, map, selection, print flow | CODE MAP + INIT FLOW at top of file |
| **340b.css** | Layout, responsive, `@media print` | Spacing, colors, print breaks | CODE MAP comment after `:root` |
| **print.html**, **print-view.css** | Print tab layout | Print-only layout (coordinate with 340b.js) | Protected — see below |
| **340b-BASIC.html** | IT-safe single page | Text on Basic only; map data still in state-data.js | [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md) |
| **modules/** | PA Impact + Policy Simulator | Scenario data in `pa-impact-data.js`, `impact-data.js` | [modules/README.md](modules/README.md) |
| **config/settings.js**, **config/chart-configs.js** | Feature flags, chart formats | Tooltip timing, KPI formatting | [CONFIG-INDEX.md](CONFIG-INDEX.md) |
| **data/dataset-metadata.js** | Provenance, version | Sync with CONFIG when publishing data refresh | [CONFIG-INDEX.md](CONFIG-INDEX.md) |

**IT-safe hosting:** Use **340b-BASIC.html** when CDN or PDF tooling is not allowed. Local D3 + TopoJSON only; no unpkg. See [SECURITY.md](SECURITY.md) and [SECURE-FORCE.md](SECURE-FORCE.md).

---

## “I want to…” (decision tree)

| I want to… | Start here |
|------------|------------|
| **Change a date or “last updated”** | `state-data.js` → CONFIG; sync `340b.html` inline script and matching element ids |
| **Change state law (who has protection)** | `state-data.js` → STATE_340B; then sync counts in `340b.html` (key findings, executive strip, print counts) |
| **Change visible wording or section order** | `340b.html` (search section comments) |
| **Change map colors or spacing** | `340b.css` (never add `overflow:hidden` on `.map-wrap` / `.us-map-wrap`) |
| **Fix Print/PDF or Download PDF (image)** | `340b.js` → `preparePrintSnapshot`, `openPrintView`; then `print.html` / `print-view.css` only if layout is wrong |
| **Fix share link or URL hash** | `340b.js` → `buildShareUrl`, `getHashState`, `updateUrlHash` |
| **Change simulator numbers (full dashboard)** | `modules/impact-data.js` or `modules/pa-impact-data.js` |
| **Edit only the Basic page** | `340b-BASIC.html` — [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md) |
| **Find where a setting lives** | [CONFIG-INDEX.md](CONFIG-INDEX.md) |
| **Understand a term** | [GLOSSARY.md](GLOSSARY.md) |
| **Refactor labels / learn daily** | [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md), [ULTRA-prompts.md](ULTRA-prompts.md) (v13–v22) |

**Quick shortcut (legacy):** (1) Content → `340b.html` (2) Data/dates → `state-data.js` (3) Print view page → `print.html` + `print-view.css` (4) Share/hash → `340b.js` (5) Print breaks → `340b.css` then `340b.js` (6) Buttons/map → `340b.js` (7) Source verification wording → `340b.html` + `QA-CHECKLIST.md`

---

## 340b-BASIC.html (Basic version)

**Purpose:** A single-page version for employer or locked-down hosting. Same advocacy content as the full dashboard (including brief **Impact** lines on stats, community benefit, PA Impact and Policy Simulator **snapshots**, access, PA safeguards) but **no** print/PDF, no share, **no** scenario switchers—only the interactive US map. Scripts: local only (`state-data.js`, D3, TopoJSON, states-10m, `340b-basic-map.js`).

**How to edit:** [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md). Map law data: **state-data.js** (STATE_340B). PA Impact / Simulator text on Basic is **static HTML** in `340b-BASIC.html`, not the `modules/*.js` files.

| Need to change… | Edit… |
|-----------------|-------|
| Basic page text/numbers only | `340b-BASIC.html` — BASIC-UPDATE-GUIDE |
| Map colors | `340b.css` |
| State law data | `state-data.js` |
| Simulator (full dashboard) | `modules/impact-data.js` |
| PA impact (full dashboard) | `modules/pa-impact-data.js` |

---

## Protected systems (do not modify without a known bug)

These flows are finalized and fragile:

- **Print system** — `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` localStorage, `print.html` structure
- **Download PDF (image)** — `downloadPdfAsImage()`, html2canvas, jsPDF, multi-page layout
- **Map** — SVG structure, injection logic; **never** add `overflow:hidden` on `.map-wrap` or `.us-map-wrap`
- **DOM ids** used by `cacheDom()` in `340b.js` — renaming breaks the app

See [CHATGPT-PROJECT-HANDOFF.md](CHATGPT-PROJECT-HANDOFF.md) and [AGENT-RULES-SYSTEM.md](AGENT-RULES-SYSTEM.md) for stability rules.

**Other rules:** Do not edit `assets/vendor/` except intentional vendor updates. Test print after any date/state/data change. Run **`python3 dashboard-audit.py`** after meaningful edits. **Print preview is a mandatory release gate.** Read [THREAT-MODEL.md](THREAT-MODEL.md) before adding remote services or auth.

---

## Cache-busting query strings

`340b.html` and `340b-BASIC.html` append `?v=…` to `340b.css`, `340b.js`, and `hap-nav-shared.js` so browsers pick up changes after deploy. **Bump the version together** when you change any of those files, or users may see stale CSS/JS.

---

## Simple release order

Follow this order after meaningful changes:

1. Decide which file should change before editing anything.
2. Update the content, style, or behavior in the correct file.
3. Open the page through a **local server** and test the exact feature you changed.
4. **Print gate:** Open `Print / PDF` and `Download PDF (image)` and confirm: (a) map fully visible in both outputs, (b) **Print/PDF:** first page shows header + Overview block (no blank first page), no page break in the middle of content or map, tight spacing; (c) **PDF image:** layout matches expectations (see `QA-CHECKLIST.md`). If layout or print CSS changed, this is mandatory.
5. Run **`python3 dashboard-audit.py`**.
6. Use **`QA-CHECKLIST.md`**.
7. Run Semgrep if you changed security-sensitive code.
8. Publish only after the print preview and source checks look correct to a human reviewer.

If the printed PDF would confuse a lawmaker, hospital CEO, or administrator, treat that as a real bug and fix it before publishing.

---

## 1. `state-data.js`

This is the main update file for **data**.

Edit when you need: dates, share URL, state law records, high-salience intro and trust-copy defaults.

Do **not** use this file for layout, colors, spacing, or button behavior.

For step-by-step state updates, see [DATA-UPDATE.md](DATA-UPDATE.md) or the CODE MAP at the top of `state-data.js`. For operations and republishing, see [docs/OPERATIONS_MANUAL.md](docs/OPERATIONS_MANUAL.md). For prioritized next steps, see [docs/100-CRITICAL-CHOICES.md](docs/100-CRITICAL-CHOICES.md).

---

## 2. `340b.html`

This is the page structure and content.

Edit when: visible copy, headings, sections, source links, order of blocks, or when print shows duplicate content.

**Avoid text/number pop on load:** The first thing the user sees is the raw HTML. JavaScript then overwrites copy from `state-data.js` (CONFIG) and STATE_340B. If the initial HTML does not match, the page will “flash.” Whenever you change **CONFIG.copy** or **STATE_340B** in state-data.js, update the **initial content** of the corresponding elements in 340b.html:

- Intro/overview: `#overview-lead`, `#hap-position-why`, `#hap-position-lead`, `.hap-ask-list` / `CONFIG.copy.hapAskItems` (each ask uses **`impactLine`** for the “Impact:” sentence; legacy **`soWhat`** is still read if present), `#map-hero-sub`
- Executive strip: `#executive-priority-*`, `#executive-landscape-*`, `#executive-trust-*` (landscape value = “X states have enacted…; Y remain without…”, where X = states with `cp: true`, Y = rest)
- Methodology/sources: `#sources-summary`, `#methodology-state-law-copy`, `#verification-order-copy`, `#print-source-summary`, `#print-verification-order-copy`
- Protection counts: `#exec-summary-protection-count`, `#exec-summary-no-count`, `#key-finding-protection-count`, `#protection-count`, `#no-protection-count`, `#print-protection-count`, `#print-no-protection-count` (same X and Y as executive landscape)
- Count-up stats: elements with `data-count-up` should have initial text set to the final value (e.g. `7%`, `7.95`, `179`) so they don’t flash from 0

Keep the **inline CONFIG** in the first `<script>` block in `340b.html` in sync with `state-data.js`.

---

## 3. `340b.js`

**Section blocks:** `CONFIGURATION & CONSTANTS`, `DOM REFERENCES`, `UTILITY HELPERS`, `STATE DATA HELPERS`, `SHARE LINK & URL HASH`, `PRINT PREPARATION (PROTECTED)`, `MAP INITIALIZATION & LIFECYCLE`, `FILTER INIT`, `UTILITY BUTTONS`, `INIT`.

**Named constants:** e.g. `UTILITY_STATUS_DISMISS_MS`, `RESIZE_DEBOUNCE_MS`, `PDF_PAGE1_FALLBACK_RATIO`, `PDF_PAGE2_FALLBACK_RATIO` — edit at the top of their block.

Edit when: map behavior, buttons, filters, print/share logic.

Use when: map doesn’t render; Print/PDF wrong snapshot; Share link dead; Clear selection broken; counts stay at `0`; weak map story.

**Print:** `Print / PDF` → `openPrintView()` → localStorage → `print.html`. **File → Print** on main page → `beforeprint` → `preparePrintSnapshot()`. Flow: `preparePrintSnapshot()`; PA default in `preparePrintSelectionState()`; counts in `finalizeCountUpValues()`; executive strip `updateExecutiveProofStrip()`; map context `updateMapContext()`. Compact print state summary stays smaller than live lists.

---

## 4. `print.html` and `print-view.css`

Print view is the primary PDF path. Map and payload come from `localStorage` (key: `hap340bPrint`). Do not change this flow without updating both `340b.js` and `print.html`.

---

## 5. Policy simulators (`modules/`)

Both simulators are modular and do not modify core map or print/PDF. See **[modules/README.md](modules/README.md)** for file roles.

To change PA scenario data: **pa-impact-data.js** (`PA_ANCHORS`, `PA_SCENARIO_ESTIMATES`). National scenarios: **impact-data.js**.

**Executive strip:** Populated from `CONFIG.copy.executiveStrip` in `state-data.js`; tooltips on cards in `340b.html`.

---

## 6. `340b.css`

This is the layout and print file. Print-specific rules live in `@media print` near the bottom.

---

## Fast debugging order

1. Wrong text or duplicate text → `340b.html`
2. Wrong spacing, hidden content, or print layout → `340b.css`
3. Broken button, map, filter, or share → `340b.js`
4. Wrong dates or state facts → `state-data.js`

---

## Source verification order

If you update state-law content, verify in this order:

1. **MultiState** — most current legislative status  
2. **ASHP** — pharmacy-policy cross-check  
3. **America's Essential Hospitals** — advocacy-reference confirmation  

---

## Where to read next

| Document | Purpose |
|----------|---------|
| [docs/INDEX.md](docs/INDEX.md) | Documentation hub (“start here” for all docs) |
| [docs/CEO-SHOWCASE.md](docs/CEO-SHOWCASE.md) | Leadership brief, talking points, BASIC-first deploy |
| [docs/DESIGN-ITERATION-CHECKLIST.md](docs/DESIGN-ITERATION-CHECKLIST.md) | Design pass every release |
| [docs/340b-js-map.md](docs/340b-js-map.md) | Full-dashboard JS function map (advanced) |
| [GLOSSARY.md](GLOSSARY.md) | Terms (CONFIG, print snapshot, hap340bPrint, etc.) |
| [CONFIG-INDEX.md](CONFIG-INDEX.md) | Where each config file lives |
| [DATA-UPDATE.md](DATA-UPDATE.md) | State law updates + inline `340b.html` sync |
| [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md) | Editing `340b-BASIC.html` |
| [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md) | Daily refactor, reuse checklist, ULTRA v13–v22 |
| [QA-CHECKLIST.md](QA-CHECKLIST.md) | Pre-push checks |
| [README.md](README.md) | Project overview and file table |

## Using this project as a template / Export and reuse

See the **Reuse checklist** in [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md) — print payload schema, DOM ids 340b.js depends on, what to copy or rename.
