# HAP 340B Advocacy Dashboard — ChatGPT 100x Handoff

**Purpose:** Use this document when working with ChatGPT (or another AI) to improve the HAP 340B Advocacy Dashboard. It provides full context for operations, design, security, efficiency, and 100x iterative improvement. Copy and paste the entire document into ChatGPT at the start of a session.

---

## 1. Project Overview

**Client:** The Hospital and Healthsystem Association of Pennsylvania (HAP)  
**Product:** HAP 340B Advocacy Dashboard — a state-by-state interactive dashboard for 340B drug pricing program advocacy.  
**Audience:** Hospital CEOs, lawmakers, administrators. Must be CEO-grade, executive-ready, and instantly scannable.  
**Tech Stack:** Vanilla JS, HTML5, CSS3, D3.js/TopoJSON for map, html2canvas + jsPDF for PDF image export.  
**Deployment:** GitHub Pages (https://jordanz00.github.io/340b-dashboard/340b.html).  
**Repo:** https://github.com/jordanz00/340b-dashboard  

---

## 2. Protected Systems — NEVER MODIFY

These systems are fragile and tightly coupled. Do **not** change them without explicit user approval:

| System | Location | Description |
|--------|----------|-------------|
| **Print** | `preparePrintSnapshot()`, `openPrintView()`, `hap340bPrint` localStorage, `print.html` | Print/PDF flow; map injected from localStorage |
| **PDF image export** | `downloadPdfAsImage()` in 340b.js | 3-page A4 PDF via html2canvas + jsPDF; uses `page1EndY` and `page2EndY` for page breaks |
| **Map** | SVG structure, map injection, state selection in 340b.js | D3 + TopoJSON; do not change SVG or selection logic |
| **CSS** | `.map-wrap`, `.us-map-wrap` | Never add `overflow:hidden` to these — print/PDF rely on visible content |

**Executive Mode:** Removed by user request. Do not re-add.

---

## 3. File Map and Responsibilities

| File | Purpose | Edit when |
|------|---------|-----------|
| **state-data.js** | CONFIG, STATE_340B, copy, dates | Dates, state law data, headlines, executive strip text |
| **340b.html** | Structure, headings, KPI labels, meta, JSON-LD | Copy, sections, accessibility attributes |
| **340b.css** | Layout, typography, gradients, responsive, print | Visual hierarchy, spacing, colors, card design |
| **340b.js** | Map, filters, print prep, share, PDF export | Behavior (except protected functions) |
| **print.html**, **print-view.css** | Dedicated print view | Only with explicit approval |
| **modules/impact-data.js** | National simulator scenarios, labels, estimates | Scenario copy, numbers |
| **modules/pa-impact-data.js** | PA-specific scenario data | PA narratives, metrics |
| **modules/impact-ui.js**, **pa-impact-ui.js** | Simulator and PA Impact panels | Bug fixes only; avoid layout changes |
| **NOVICE-MAINTAINER.md** | Code map, where to edit | When adding modules or changing structure |
| **docs/OPERATIONS_MANUAL.md** | Step-by-step operations | When adding workflows or config |
| **docs/CHECK_CHECK_CHUCK.rtf** | Change log | Append every change: date, wave, files, summary |

---

## 4. Operations

### 4.1 Update state law data
1. Edit **state-data.js** → `STATE_340B` entry for the state (`cp`, `pbm`, `y`, `notes`).
2. Sync `CONFIG.lastUpdated`, `CONFIG.dataFreshness`.
3. Run `python3 dashboard-audit.py`.
4. Verify map, filters, Print/PDF, Download PDF.

### 4.2 Update copy for CEO scanning
- **state-data.js** `CONFIG.copy`: `overviewLead`, `hapPositionLead`, `hapAskText`, `mapHeroSub`, `executiveStrip.*`
- **340b.html**: KPI labels, section headings. Executive proof cards have `title` attributes for hover tooltips.
- **modules/impact-data.js**, **pa-impact-data.js**: `SCENARIOS`, `SCENARIO_ESTIMATES`, narratives.

### 4.3 Before publishing
1. Run `python3 dashboard-audit.py`.
2. Manual check: Map, filters, share link, Print/PDF, Download PDF (image), Policy Impact Simulator, PA Impact Mode.
3. Append change to **docs/CHECK_CHECK_CHUCK.rtf**.
4. If print/PDF breaks, revert and fix — do not ship.

---

## 5. Design and UX Principles

- **CEO-first:** Headlines and KPIs must be scannable in 5 seconds. Benefit-first, one-line comprehension.
- **Typography:** Use existing CSS variables (`--text-xs` through `--text-hero`). No new fonts without approval.
- **Colors:** `--primary` (HAP blue), `--accent` (orange), `--map-protection`, `--map-no-protection`. Keep protection-status distinction.
- **Spacing:** Use `--space-*` and `--radius*` tokens. Grid: 12-column, `--content-max` for alignment.
- **Cards:** Consistent padding, shadows, hover states. PA KPI and Key Findings should have visual emphasis.
- **Responsive:** Mobile-first breakpoints at 480px, 640px, 768px, 900px. No layout breaks in print/PDF.

---

## 6. Security

- Use `textContent` (never `innerHTML`) for dynamic content from data.
- Use `safeText()` in 340b.js for any external or user-derived strings.
- All `target="_blank"` links must have `rel="noopener noreferrer"`.
- Run Semgrep / OWASP checks if touching auth, external APIs, or input handling.
- See **docs/SECURITY.md** for full checklist.

---

## 7. Efficiency and Performance

- **content-visibility:** Used on below-fold sections (KPI strip, access, pa-safeguards, methodology).
- **Debounce:** Resize handler uses `RESIZE_DEBOUNCE_MS` (300ms).
- **Lazy rendering:** Secondary panels can be deferred via `DASHBOARD_SETTINGS.performance.deferSecondaryPanels`.
- **DOM caching:** `appState.dom` caches element references; avoid repeated `querySelector` in hot paths.
- **Count-up:** Animates only when in view; `finalizeCountUpValues()` used before print/PDF.

---

## 8. Accessibility

- ARIA: `aria-label`, `aria-live`, `aria-pressed` on interactive elements.
- `:focus-visible` on all buttons, links, state chips, filter controls.
- Skip link to main content. Map has keyboard nav (Tab, Enter, arrows).
- Methodology `details` has `aria-label`.
- Simulator and PA Impact modules set `aria-live="polite"` on results.

---

## 9. 100x Iterative Improvement Workflow

Apply in sequence. After each wave, run `dashboard-audit.py` and manual QA. Log to CHECK_CHECK_CHUCK.rtf.

| Wave | Focus | Actions |
|------|-------|---------|
| 1 | Code foundation | Constants for magic numbers; block labels; inline comments. No changes to protected systems. |
| 2 | Copy | CEO headlines; tight KPI labels; simulator narratives for non-technical executives. |
| 3 | UX / hierarchy | Gradients, typography, spacing; PA KPI emphasis; card consistency. |
| 4 | Simulator polish | Active states, hover, shadows; PA Impact aligned with national simulator. |
| 5 | Accessibility & SEO | ARIA audit; keyboard nav; meta/JSON-LD. |
| 6 | Documentation | NOVICE-MAINTAINER, OPERATIONS_MANUAL, CHECK_CHECK_CHUCK updates. |
| 7 | Final polish | Visual pass; consistency; minor interactions where safe. |

**Rules:**
- Each improvement must be additive or clearly scoped.
- Never modify `downloadPdfAsImage`, `preparePrintSnapshot`, `openPrintView`, or map SVG logic.
- Every change gets a CHECK_CHECK_CHUCK entry: date, wave, files, 1–2 sentence summary, "Protected systems: NOT MODIFIED."

---

## 10. Copy Improvement Format (for ChatGPT)

When proposing copy changes, use this structure:

```
**File:** state-data.js, CONFIG.copy.overviewLead
**Current:** "340B lets eligible hospitals buy drugs at discount..."
**Proposed:** "[New text]"
**Why:** [1–2 sentences: benefit-first, CEO scanning, etc.]
```

Apply to: `overviewLead`, `hapPositionLead`, `hapAskText`, `executiveStrip.*`, KPI labels in 340b.html, scenario labels in impact-data.js and pa-impact-data.js.

---

## 11. What Cursor Has Done (Recent Context)

- **100x CEO Upgrade (7 waves):** Constants, block labels, CEO copy, UX hierarchy, simulator polish, accessibility, docs.
- **PDF revert (post-upgrade):** Restored `page1EndY`/`page2EndY` in `downloadPdfAsImage` (was incorrectly changed to `break1Y`/`break2Y`).
- **Executive Mode:** Removed; do not re-add.

---

## 12. Handoff Instructions for ChatGPT

1. Read this entire document before making changes.
2. Confirm understanding of protected systems; do not touch them.
3. For any edit, state: file, line/block, change, and rationale.
4. Use the copy improvement format for text changes.
5. After edits, suggest: "Run `python3 dashboard-audit.py` and append to CHECK_CHECK_CHUCK.rtf."
6. If asked to improve something that touches Print/PDF/map, respond: "That area is protected. I can suggest an alternative approach that avoids it."

---

*Last updated: March 2025. For questions, see NOVICE-MAINTAINER.md, docs/OPERATIONS_MANUAL.md, and CHATGPT-PROJECT-HANDOFF.md (if present).*
