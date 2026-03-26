# HAP 340B Advocacy Dashboard — Status Update for ChatGPT

**Purpose:** Current project status and handoff for ChatGPT. Use this when continuing work on the dashboard. **Do not modify print.html or the PDF image download flow** — they are close to done.

**Last updated:** March 2025

---

## 1. Project Snapshot

| Item | Details |
|------|---------|
| **Name** | HAP 340B Advocacy Dashboard |
| **Repo** | https://github.com/jordanz00/340b-dashboard |
| **Live** | https://jordanz00.github.io/340b-dashboard/340b.html |
| **Stack** | Vanilla JS, HTML5, CSS3, D3/TopoJSON (map), html2canvas + jsPDF (PDF image export) |
| **Audience** | Hospital CEOs, lawmakers, administrators — must be executive-ready and scannable in seconds |

The dashboard shows 340B contract pharmacy protection status by state, with emphasis on Pennsylvania (72 PA hospitals in 340B). Features: interactive US map, state filters, share links, **Print/PDF** (print.html), **Download PDF (image)** (3-page A4), Policy Impact Simulator, Pennsylvania Impact Mode.

---

## 2. Do NOT Touch (Stable / Close to Done)

**Do not change these.** They are working and nearly finalized. Any edits risk breaking print or PDF output.

| System | What | Why |
|--------|------|-----|
| **print.html** | Dedicated print view; reads snapshot from localStorage (`hap340bPrint`) | Layout and structure are set; changes can break 2-page print/PDF. |
| **PDF image download** | `downloadPdfAsImage()` in 340b.js — 3-page A4 capture via html2canvas + jsPDF | Page breaks (page1EndY, page2EndY), capture styles, and fitWidth for page 3 are tuned. Leave as-is. |

Also do not change:

- **Print flow:** `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` usage
- **Map:** SVG structure, injection, state selection; no `overflow:hidden` on `.map-wrap` or `.us-map-wrap`
- **Executive Mode:** Removed by user request; do not re-add

Improvements elsewhere (copy, UX, accessibility, data, docs) are fine. Avoid refactors that touch the print pipeline or `downloadPdfAsImage()`.

---

## 3. Current Status (What’s Done)

### Core

- Map with state click, hover tooltips, keyboard focus, protection colors
- State filters (All / Protection / No protection), state detail panel, share link with `#state-XX`
- Key Findings strip, executive proof strip (3 cards), KPI strip (4 metrics)
- State-by-state section, map hero, selection summary

### Simulators

- **Policy Impact Simulator:** Three scenarios (Expand / Current / Remove protections); national impact metrics; scenario buttons and result cards
- **Pennsylvania Impact Mode:** PA-specific metrics; program status (Protected / Exposed / At risk) by scenario; compact layout

### Print & PDF

- **Print/PDF:** Opens print.html with full snapshot (intro, executive strip, map, state summary, KPIs, etc.)
- **Download PDF (image):** 3-page A4; page 3 = KPI strip through pa-safeguards (PA Impact and Impact Simulator hidden during capture for a compact page 3)

### Recent Work (Cursor sessions)

- 100x iteration: CSP meta, innerHTML → replaceChildren in impact-ui, executive card tooltips, UX tweaks (line-height, spacing, hover scale), content-visibility on PA Impact/simulator sections, docs (NOVICE-MAINTAINER, OPERATIONS_MANUAL, CHECK_CHECK_CHUCK)
- PDF page 3 restore: PA Impact and Impact Simulator hidden during PDF capture so page 3 matches the intended compact layout
- Accessibility: aria-live, focus-visible, map keyboard nav verified; no changes needed in last pass
- Security: CSP on 340b.html and print.html; `safeText()` / textContent for dynamic content; noopener on external links

---

## 4. Improvements That Can Still Be Made

Focus here. Do **not** touch print.html or the PDF image download logic.

### Copy & content

- Refresh **state-data.js** `CONFIG.copy` (overviewLead, hapPositionLead, hapAskText, mapHeroSub, executiveStrip) for new policy or messaging
- Tighten KPI labels and section headings in **340b.html** for clarity
- Update scenario narratives in **modules/impact-data.js** and **modules/pa-impact-data.js** when policy or numbers change
- Add or refine **tooltips** (e.g. `title` on executive proof cards, PA KPI) for hover explanations

### Data & maintenance

- Update **STATE_340B** in state-data.js when state laws change (cp, pbm, notes, etc.)
- Keep **CONFIG.lastUpdated** and **CONFIG.dataFreshness** in sync
- Refresh **data/dataset-metadata.js** and source links/dates when data or reports change

### UX & visual

- Tweak **340b.css**: spacing (e.g. `--space-*`), card shadows, hover states, responsive font sizes at 480–900px
- Improve visual hierarchy for Key Findings, KPI strip, and executive cards (no layout changes to print/PDF)
- Consider micro-interactions (e.g. subtle transitions on scenario cards) without affecting capture

### Accessibility

- Ensure all interactive elements have clear **:focus-visible** and that **aria-live** regions announce state/filter changes
- Check **map keyboard navigation** and that selected state is announced
- Add or refine **aria-labels** where labels are missing or vague

### Performance

- **DOM caching:** Ensure `appState.dom` is used for repeated selectors; avoid extra querySelector in hot paths
- **content-visibility:** Already used on below-fold sections; keep and avoid removing it from sections that are captured
- **Resize:** Resize handler is debounced; keep it; no need to change PDF or print logic
- Do **not** add lazy-loading of impact/pa-impact modules if it would require changing how the page is captured for PDF

### Security & audit

- Run **dashboard-audit.py** before publish; fix any new failures (e.g. CSP, noopener, unsafe patterns)
- Keep using **textContent** or **safeText()** for any dynamic text from data
- If adding external scripts/fonts, prefer self-hosting under **assets/vendor/** and update CSP if needed

### Documentation

- Keep **NOVICE-MAINTAINER.md** in sync when adding sections or changing structure
- Update **docs/OPERATIONS_MANUAL.md** for new workflows (e.g. data update steps, audit steps)
- Log changes in **docs/CHECK_CHECK_CHUCK.rtf** (date, wave/topic, files, summary, “Protected: NOT MODIFIED” where applicable)
- **CHATGPT-100X-HANDOFF.md** and **CHATGPT-PROJECT-HANDOFF.md** are reference handoffs; update when conventions or file roles change

### Optional / future

- Stronger “WOW” for executives: layout or storytelling ideas that don’t alter print.html or downloadPdfAsImage
- SEO: meta descriptions, JSON-LD, canonical URL (already in place; refine if needed)
- Analytics or tracking only if required; keep dashboard static and client-side

---

## 5. Quick Reference

| Task | File(s) | Do not touch |
|------|---------|----------------|
| Update state data | state-data.js | — |
| Change copy | 340b.html, state-data.js CONFIG.copy, impact-data.js, pa-impact-data.js | print.html, downloadPdfAsImage |
| Fix layout / styles | 340b.css | .map-wrap, .us-map-wrap overflow |
| Fix map, filters, share | 340b.js | preparePrintSnapshot, openPrintView, downloadPdfAsImage |
| Run audit | `python3 dashboard-audit.py` | — |
| Before publish | Audit + manual check (map, filters, share, Print/PDF, Download PDF, simulators) | print.html, PDF image flow |

---

## 6. Summary for ChatGPT

- **Status:** Dashboard is feature-complete and stable. Print and PDF image download are in good shape; do not modify them.
- **Do not touch:** print.html; downloadPdfAsImage() and its capture styles/page breaks.
- **Safe to improve:** Copy, state data, UX/CSS (except map overflow), accessibility, performance (without changing PDF capture), docs, and audit hygiene.
- **When in doubt:** Prefer additive changes; run dashboard-audit.py; document in CHECK_CHECK_CHUCK.rtf; leave print and PDF image export unchanged.
