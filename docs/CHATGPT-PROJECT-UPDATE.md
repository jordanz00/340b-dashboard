# HAP 340B Advocacy Dashboard — Project Status Update for ChatGPT

**Purpose:** Status summary for handoff to ChatGPT. Use this when reporting back to ChatGPT or when ChatGPT needs context to help with this project.

---

## Project Overview

**Name:** HAP 340B Advocacy Dashboard  
**Platform:** Static HTML/CSS/JS (GitHub Pages compatible)  
**Audience:** Hospital CEOs, policymakers, HAP leadership, advocacy teams  
**Repository:** https://github.com/jordanz00/340b-dashboard

The dashboard explains 340B contract pharmacy protections across states, with emphasis on Pennsylvania (72 PA hospitals in 340B). It includes an interactive US map, state filters, share links, Print/PDF, and Download PDF (image) export.

---

## Current Implementation Status

### Completed

- **Core dashboard:** Map, state selection, filters (All / Protection / No protection), state detail panel
- **Policy Impact Simulator:** Three scenarios (Expand, Current, Remove protections); national impact metrics
- **Pennsylvania Impact Mode:** PA-specific metrics; program status (Protected / Exposed / At risk), pharmacies, patient access, community benefit
- **Executive Mode:** Toggle button that switches to focused presentation view (KPI emphasis, condensed notes)
- **Print / PDF:** Opens print.html with full snapshot
- **Download PDF (image):** 3-page A4 export via html2canvas + jsPDF
- **Documentation:** README, NOVICE-MAINTAINER, OPERATIONS_MANUAL, SECURE-FORCE

### Recent Fixes (Cursor session)

1. **Executive Mode** — Previously appeared to do nothing; added status feedback and clearer visual changes when toggled
2. **PDF image download** — Reverted variable renames (page1EndY/page2EndY → break1Y/break2Y); user requested no further changes to this flow
3. **PA Impact Mode — PA hospitals metric** — Changed from static "72" to scenario-varying "Program status" (Protected / Exposed / At risk) so the metric makes sense in context
4. **Policy Impact Simulator** — Visual redesign for executive presentation: gradient card, hero header, larger typography, stronger shadows, active-state styling

---

## Critical Rules (Do Not Break)

### Protected Systems

- **Print:** `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` localStorage, `print.html` structure
- **PDF image export:** `downloadPdfAsImage()` in 340b.js — do not modify without explicit user permission
- **Map:** SVG structure, map injection, state selection
- **CSS:** Never add `overflow:hidden` to `.map-wrap` or `.us-map-wrap`

### File Roles

- **state-data.js** — Data only (CONFIG, STATE_340B)
- **340b.html** — Structure and content
- **340b.css** — Layout and styles
- **340b.js** — Interactivity (map, filters, print, share, Executive Mode, PDF export)
- **modules/** — Simulators (impact-*, pa-impact-*), isolated from core

---

## Known Issues / User Feedback

- User wants a stronger “WOW” factor for executives — dashboard should feel impressive, not just “nice”
- Download PDF (image) was touched in a refactor; user requested revert and no further changes without permission

---

## How ChatGPT Can Help

1. **Content and copy** — Improve messaging for CEOs and lawmakers; suggest clearer policy narratives
2. **Data updates** — When new state laws pass, update `state-data.js` (STATE_340B) and `data/dataset-metadata.js`
3. **Documentation** — Refine NOVICE-MAINTAINER, OPERATIONS_MANUAL for maintainers
4. **Security review** — SECURE-FORCE workflow: Semgrep, OWASP checklist (see SECURE-FORCE.md)
5. **UX and presentation** — Ideas for more impressive layout, typography, or storytelling flow without touching protected systems

---

## Quick Reference

| Task                 | File(s)                                      |
|----------------------|----------------------------------------------|
| Update state data    | state-data.js                                |
| Change copy          | 340b.html, state-data.js CONFIG.copy         |
| Fix layout           | 340b.css                                     |
| Fix map/filters      | 340b.js                                      |
| Change simulator copy| modules/impact-data.js, modules/pa-impact-data.js |
| Run audit            | `python3 dashboard-audit.py`                 |

---

## Last Updated

2025-03-05 (Cursor session: Executive Mode fix, PDF revert, PA hospitals metric fix, Policy Impact Simulator redesign)
