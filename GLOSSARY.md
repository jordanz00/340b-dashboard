# HAP 340B Dashboard — Glossary

One place for terms used in the code, docs, and maintainer guides. For **where to edit what**, see [CONFIG-INDEX.md](CONFIG-INDEX.md) and [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md).

---

## Core data and configuration

| Term | Meaning |
|------|---------|
| **CONFIG** | Main configuration object in [state-data.js](state-data.js). Holds dashboard title, dates, share URL, map/animation settings, and `copy` (intro, HAP ask, source summary, executive strip). Edit here to change names, dates, and high-level copy—not layout or button behavior. |
| **STATE_340B** | One object per state (two-letter key). Each state has `y` (year enacted or null), `pbm`, `cp` (contract pharmacy protection), and `notes`. Drives the map colors, state lists, and filters. |
| **FIPS_TO_ABBR** | Maps numeric FIPS codes from map topology data to two-letter state codes (e.g. 42 → PA). Used when drawing the map. |
| **STATE_NAMES** | Full state names for labels and tooltips, keyed by two-letter code. |
| **STATES_WITH_PROTECTION** | Derived list: states where `cp === true`. Used for counts and filters. |

---

## Page behavior and UI

| Term | Meaning |
|------|---------|
| **DOM** | Document Object Model—the tree of HTML elements. JavaScript finds elements by `id` or class (e.g. in `cacheDom()` in [340b.js](340b.js)) and updates text or styles. |
| **map wrap** | Container around the US map and legend (e.g. `#us-map-wrap`). Visibility is controlled so the map can appear before print or PDF capture. |
| **count-up** | Numbers that animate from 0 to their final value when scrolled into view (elements with `data-count-up`). Finalized before print/PDF so output shows correct figures. |
| **scroll-reveal** | Sections that gain a “revealed” state when they enter the viewport. Before print/PDF, sections are revealed so the full page can be captured. |
| **methodology** | The “About this data” / methodology section. Often opened automatically before print/PDF so the output includes sources and verification order. |

---

## Print and PDF

| Term | Meaning |
|------|---------|
| **Print/PDF** | Opens a new tab with [print.html](print.html). Data passes from the main page via `localStorage`. |
| **Download PDF (image)** | Captures the main page (or `#pdf-capture-root`) with html2canvas + jsPDF—not the same code path as Print/PDF. |
| **print snapshot** | Page state prepared right before the print dialog: finalized numbers, revealed sections, map SVG, so PDF/PDF image looks correct. Implemented in `preparePrintSnapshot()` in [340b.js](340b.js). |
| **hap340bPrint** | `localStorage` key used to pass the print payload from [340b.js](340b.js) to [print.html](print.html). Do not rename without updating both files. |

---

## Map and geography

| Term | Meaning |
|------|---------|
| **FIPS** | Federal Information Processing Standards state code (numeric). Map data uses FIPS; the dashboard maps to abbreviations with `FIPS_TO_ABBR`. |

---

## Simulators and modules

| Term | Meaning |
|------|---------|
| **Pennsylvania Impact Mode (PA Impact)** | PA-specific policy scenario panel. Data: [modules/pa-impact-data.js](modules/pa-impact-data.js), logic: `pa-impact-engine.js`, UI: `pa-impact-ui.js`. Loaded by [340b.html](340b.html) after the main script. |
| **Policy Impact Simulator** | National scenario panel. Data: [modules/impact-data.js](modules/impact-data.js), logic: `impact-simulator.js`, UI: `impact-ui.js`. Loaded by [340b.html](340b.html) after the main script. |
| **340b-BASIC.html** | IT-safe variant: local scripts only, no CDN print/PDF. PA Impact and Simulator are **static HTML** only (no simulator modules). See [docs/BASIC-UPDATE-GUIDE.md](docs/BASIC-UPDATE-GUIDE.md). |
| **340b.html (full dashboard)** | Full interactivity: map, filters, share, print/PDF, PDF image download, simulators. |

---

## Security and hosting

| Term | Meaning |
|------|---------|
| **CSP** | Content-Security-Policy meta tag. Restricts what scripts and resources can load. Full dashboard allows unpkg for html2canvas/jsPDF; BASIC uses `script-src 'self'` only. |

---

## See also

- [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) — which file to edit for what
- [CONFIG-INDEX.md](CONFIG-INDEX.md) — where each setting lives
- [docs/INDEX.md](docs/INDEX.md) — documentation navigation
- [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md) — reuse checklist and daily refactor prompts
