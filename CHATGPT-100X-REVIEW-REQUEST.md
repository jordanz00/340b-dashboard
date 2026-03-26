# HAP 340B Advocacy Dashboard — ChatGPT 100x Review & Optimization Request

**Purpose:** Copy and paste this entire document into ChatGPT. It integrates all project context from Cursor sessions, the 100x CEO Upgrade Plan, multi-agent architecture, operations, design, security, and change history. Use it to ask ChatGPT to **review the current state and provide new advice and optimizations** across copy, design, UX, accessibility, performance, security, and documentation.

---

## YOUR TASK (ChatGPT)

**Review this handoff and produce:**

1. **New advice** — Concrete recommendations that have not yet been applied
2. **Optimization opportunities** — Prioritized list (high / medium / low) with file, line/area, proposed change, and rationale
3. **Copy alternatives** — For 3–5 key elements (e.g., overviewLead, hapAskText, a KPI label), propose 2–3 alternative phrasings each with pros/cons
4. **UX/design suggestions** — Typography, spacing, hierarchy, or interaction improvements that stay within constraints
5. **Security/performance/efficiency** — Any gaps or improvements you identify
6. **Documentation** — What’s missing or could be clearer in NOVICE-MAINTAINER, OPERATIONS_MANUAL, or this handoff
7. **100x next steps** — What would make the next iteration 10x better, given what’s already done

Output in clear sections. Be specific: include file paths, element IDs/classes, and exact proposed text where applicable. Do not suggest changes to protected systems.

---

## 1. Project Overview

| Field | Value |
|-------|-------|
| **Client** | The Hospital and Healthsystem Association of Pennsylvania (HAP) |
| **Product** | HAP 340B Advocacy Dashboard — state-by-state interactive 340B contract pharmacy protection map |
| **Audience** | Hospital CEOs, lawmakers, administrators. Must be CEO-grade, executive-ready, instantly scannable. |
| **Tech Stack** | Vanilla JS, HTML5, CSS3, D3.js/TopoJSON (map), html2canvas + jsPDF (PDF image export) |
| **Deployment** | GitHub Pages: https://jordanz00.github.io/340b-dashboard/340b.html |
| **Repo** | https://github.com/jordanz00/340b-dashboard |

**Plain-language summary (for leadership):** The dashboard shows state-by-state 340B contract pharmacy protection status, Pennsylvania’s position (72 PA hospitals in 340B), and the advocacy case. Users can share links, print/PDF, and use it in advocacy meetings.

---

## 2. Protected Systems — DO NOT SUGGEST CHANGES

| System | Location | Description |
|--------|----------|-------------|
| **Print** | `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` localStorage, `print.html` | Print/PDF flow; map injected from localStorage |
| **PDF image export** | `downloadPdfAsImage()` in 340b.js | 3-page A4 PDF via html2canvas + jsPDF. Uses `page1EndY` and `page2EndY` for page breaks. Do not rename or alter this logic. |
| **Map** | SVG structure, map injection, state selection in 340b.js | D3 + TopoJSON; do not change SVG or selection logic |
| **CSS** | `.map-wrap`, `.us-map-wrap` | Never add `overflow:hidden`; print/PDF depend on visible content |

**Executive Mode:** Removed by user request. Do not suggest re-adding.

---

## 3. File Map and Responsibilities

| File | Purpose | Edit when |
|------|---------|-----------|
| state-data.js | CONFIG, STATE_340B, copy, dates | Dates, state law, headlines, executive strip |
| 340b.html | Structure, headings, KPI labels, meta, JSON-LD | Copy, sections, accessibility |
| 340b.css | Layout, typography, gradients, responsive, print | Visual hierarchy, spacing, colors |
| 340b.js | Map, filters, print prep, share, PDF export | Behavior (except protected functions) |
| print.html, print-view.css | Dedicated print view | Only with explicit approval |
| modules/impact-data.js | National simulator scenarios, labels, estimates | Scenario copy, numbers |
| modules/pa-impact-data.js | PA-specific scenario data | PA narratives, metrics |
| modules/impact-ui.js, pa-impact-ui.js | Simulator panels | Bug fixes only |
| NOVICE-MAINTAINER.md | Code map, where to edit | When adding modules or changing structure |
| docs/OPERATIONS_MANUAL.md | Step-by-step operations | When adding workflows |
| docs/CHECK_CHECK_CHUCK.rtf | Change log | Append every change |

---

## 4. Current State (What’s Been Done)

### 4.1 100x CEO Upgrade (7 Waves — Completed)
- **Wave 1:** Constants (UTILITY_STATUS_DISMISS_MS, CHART_BAR_MAX_HEIGHT_PX, etc.); block labels; inline comments in 340b.js
- **Wave 2:** CEO-focused copy in state-data.js, 340b.html, impact-data.js, pa-impact-data.js; shortened overviewLead, hapPositionLead, executiveStrip; tighter KPI labels
- **Wave 3:** Key Findings gradients, executive proof card typography, PA KPI emphasis (4th card)
- **Wave 4:** PA Impact and simulator card polish; active states, hover, shadows
- **Wave 5:** aria-label on methodology details; ARIA/SEO verified
- **Wave 6:** NOVICE-MAINTAINER, OPERATIONS_MANUAL, CHECK_CHECK_CHUCK updated
- **Wave 7:** Final visual pass; consistency confirmed

### 4.2 Other Recent Changes
- **PDF revert:** `downloadPdfAsImage` restored to `page1EndY`/`page2EndY` (not break1Y/break2Y)
- **Executive Mode:** Removed
- **Data sources:** MultiState, ASHP, America’s Essential Hospitals (state law); 340B Health, AHA (community benefit); HRSA (oversight)

### 4.3 Pre-Existing Audit Issues (from dashboard-audit.py)
- 340b.js uses innerHTML in some places
- Content-Security-Policy meta missing
- Remote font/script references
- 340b.css @media print may need max-height for map SVG

These are known; suggestions that address them without touching protected systems are welcome.

---

## 5. Design Principles

- **CEO-first:** Headlines and KPIs scannable in ~5 seconds. Benefit-first, one-line comprehension.
- **Typography:** Use existing CSS variables (`--text-xs` through `--text-hero`). No new fonts without approval.
- **Colors:** `--primary` (HAP blue), `--accent` (orange), `--map-protection`, `--map-no-protection`. Keep protection-status distinction clear.
- **Spacing:** `--space-*`, `--radius*`; 12-column grid; `--content-max` for alignment.
- **Cards:** Consistent padding, shadows, hover. PA KPI and Key Findings emphasized.
- **Responsive:** Breakpoints at 480px, 640px, 768px, 900px. No print/PDF layout breaks.

---

## 6. Security Guidelines

- Use `textContent`, not `innerHTML`, for dynamic content from data.
- Use `safeText()` in 340b.js for external or user-derived strings.
- All `target="_blank"` links must have `rel="noopener noreferrer"`.
- Run Semgrep/OWASP if touching auth, external APIs, or user input.

---

## 7. Efficiency Guidelines

- content-visibility on below-fold sections (KPI strip, access, pa-safeguards, methodology)
- Resize debounced (RESIZE_DEBOUNCE_MS = 300ms)
- Secondary panels can be deferred (DASHBOARD_SETTINGS.performance.deferSecondaryPanels)
- DOM caching via `appState.dom`
- Count-up animates only in view; `finalizeCountUpValues()` before print/PDF

---

## 8. Accessibility Guidelines

- ARIA: aria-label, aria-live, aria-pressed on interactive elements
- :focus-visible on buttons, links, state chips, filter controls
- Skip link to main content; map has keyboard nav (Tab, Enter, arrows)
- Methodology details has aria-label; Simulator and PA Impact have aria-live="polite"

---

## 9. Copy Improvement Format

When proposing copy changes, use:

```
**File:** [path]
**Element:** [e.g. CONFIG.copy.overviewLead]
**Current:** "[exact current text]"
**Proposed:** "[new text]"
**Why:** [1–2 sentences]
```

Key copy locations: `overviewLead`, `hapPositionLead`, `hapAskText`, `mapHeroSub`, `executiveStrip.*`, KPI labels in 340b.html, scenario labels in impact-data.js and pa-impact-data.js.

---

## 10. Operations (For Reference)

- **State law updates:** Edit state-data.js → STATE_340B; sync CONFIG.lastUpdated
- **Before publish:** Run `python3 dashboard-audit.py`; manual QA: map, filters, share, Print/PDF, Download PDF, Simulator, PA Impact
- **Change log:** Append to docs/CHECK_CHECK_CHUCK.rtf: date, wave, files, summary, "Protected systems: NOT MODIFIED"

---

## 11. Multi-Agent Concept (For Inspiration)

The project has been designed with “10 agents” in mind (code, UX, data, security, docs, accessibility, performance, copy, QA, orchestration). ChatGPT can act as a consolidated reviewer across these roles: suggest improvements in each area, flag conflicts, and prioritize by impact and risk.

---

## 12. Leadership Context (340b-Dashboard-Update-031226)

- Product turns policy data into a visual advocacy tool for CEOs and policymakers.
- Data from HAP sources: MultiState, ASHP, America’s Essential Hospitals, 340B Health, AHA, HRSA.
- Advocacy themes: protect 340B, patient access, community benefit, no cost to taxpayers.
- Delivered: interactive map, filters, share links, Print/PDF, Policy Impact Simulator, PA Impact Mode, mobile-responsive layout, maintainer docs.
- Next steps: deploy in advocacy settings, update state data as laws pass, refine copy for executives.

---

## 13. Explicit Request for ChatGPT

**Please:**

1. Review all sections above.
2. Produce **new advice** that has not yet been applied.
3. List **optimization opportunities** with priority (high/medium/low), file, area, change, and rationale.
4. Propose **copy alternatives** for 3–5 key elements with 2–3 options each.
5. Suggest **UX/design** improvements within constraints.
6. Identify **security, performance, efficiency** gaps or improvements.
7. Recommend **documentation** enhancements.
8. Outline **100x next steps** for the next iteration.

Be specific. Include file paths, IDs, classes, and proposed text. Do not suggest changes to protected systems (Print, PDF image export, Map, overflow on .map-wrap/.us-map-wrap).

---

*Document integrates: 100x CEO Upgrade Plan, CHATGPT-100X-HANDOFF, 340b-Dashboard-Update-031226, CHECK_CHECK_CHUCK change log, multi-agent architecture, ULTRA-wave workflow. Last updated: March 2025.*
