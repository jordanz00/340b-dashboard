# 340B Advocacy Dashboard — ChatGPT Project Handoff

**Copy this entire document when bringing ChatGPT up to speed. It provides full context, constraints, and improvement paths.**

---

## 1. What This Project Is

**HAP 340B Advocacy Dashboard** — A single-page web app for lawmakers and hospital leaders on the 340B Drug Pricing Program. Built for the Hospital and Healthsystem Association of Pennsylvania (HAP).

**Purpose:** Help users understand state-by-state contract pharmacy protection, Pennsylvania’s participation, and HAP’s policy position. Data is static (no backend); the site is designed for GitHub Pages or similar static hosting.

**Core features:**
- Interactive US map (click states for details)
- State filters (All, Protection, No protection)
- Share links with deep-links (e.g. `#state-PA`)
- Two PDF paths: **Print / PDF** (opens `print.html`) and **Download PDF (image)** (html2canvas + jsPDF)
- Executive strip, KPI strip, community benefit, access, and PA safeguards sections

---

## 2. Where We Are

### Current State

- **Live site:** [https://jordanz00.github.io/340b-dashboard/](https://jordanz00.github.io/340b-dashboard/) (or similar)
- **Main files:** `340b.html`, `340b.css`, `340b.js`, `state-data.js`
- **Print / PDF:** Uses `print.html` + localStorage (`hap340bPrint`)
- **Download PDF (image):** 3-page A4 PDF via html2canvas + jsPDF, PA default when no state selected
- **Data updates:** Edits in `state-data.js`; dates, state law status, and copy

### Important Constraints

**Do NOT modify these — they are finalized:**

1. **Print / PDF flow** — The Print / PDF button, `preparePrintSnapshot()`, `openPrintView()`, and the `hap340bPrint` localStorage flow are working as intended. Do not refactor or “improve” them.
2. **Download PDF (image) flow** — The 3-page PDF image download (page 1: intro to executive strip; page 2: state-by-state + map + recent legal signals; page 3: KPI through PA safeguards) is set. Do not change layout, page breaks, scaling, or the `downloadPdfAsImage()` logic.
3. **`print.html`** — The dedicated print view is complete and stable. Do not change structure, layout, or the map injection flow.

These areas have been heavily tested and tuned. Changes here risk regressions and are off-limits unless the user explicitly asks.

---

## 3. File Map

| File | Purpose |
|------|---------|
| `state-data.js` | **Edit for data** — dates, state law records, copy. Do not use for layout or behavior. |
| `340b.html` | Structure and content. Edit for text, sections, headings. |
| `340b.js` | Interactivity: map, filters, buttons, print/PDF, share. Edit for behavior. |
| `340b.css` | Layout and styles. Edit for spacing, breakpoints, print styles. |
| `print.html` | Dedicated print view. **Do not touch** — stable. |
| `print-view.css` | Print layout styles. Tied to `print.html`. |
| `data/dataset-metadata.js` | Methodology, sources, versioning |
| `config/settings.js` | Feature flags, map options |
| `config.json` | Agent and self-upgrade config |

---

## 4. What Needs Help and Improvement

### Areas Safe to Improve

1. **Content and copy** — `state-data.js`, `340b.html` — Update dates, state data, methodology text, or section copy.
2. **UX and accessibility** — Contrast, keyboard nav, ARIA labels, screen-reader text. See `.cursor/rules/agent-d-accessibility.mdc`.
3. **Performance** — Lazy loading, deferring below-fold panels, reducing layout shifts.
4. **SEO** — Meta tags, titles, structured data. See `.cursor/rules/agent-a-seo.mdc`.
5. **Code quality** — Refactoring for clarity and maintainability, without changing print/PDF or PDF image behavior.
6. **Docs and comments** — Improve NOVICE-MAINTAINER.md, README, inline comments.

### Do Not Touch

- Print / PDF flow and `print.html`
- Download PDF (image) flow and its layout/scaling
- `hap340bPrint` localStorage key and payload shape
- Map visibility and overflow rules (no `overflow: hidden` on `.map-wrap` / `.us-map-wrap`)

---

## 5. How to Improve Automatically Every Day

### Daily Improvement Workflow

1. **Read** `DAILY-IMPROVEMENT.md` — periodic improvement workflow.
2. **Run the next ULTRA wave** — `ULTRA-prompts.md` has structured waves (v03–v22). Pick the next unrun wave and apply one prompt per day.
3. **Use agent batches** — For 50-improvement batches (A–E), use `AGENT-TEMPLATE.md`. Each batch implements 10 items.
4. **Run audit after changes:**
   ```bash
   python3 dashboard-audit.py
   ```
5. **Test before commit:**
   - Open dashboard via local server (e.g. `python -m http.server 8000`).
   - Test Print / PDF (do not change it).
   - Test Download PDF (image) (do not change it).
   - Test map, filters, share link, state selection.

### Automation Hooks

- **Cursor rules:** `.cursor/rules/ultra-daily-improvement.mdc` — prefer ULTRA-prompts when doing improvement work.
- **Agent rules:** `agent-a-seo.mdc` through `agent-e-analytics.mdc` for specific improvement areas; `agent-rules-system.mdc` for stability and release rules.
- **GitHub Action (optional):** Scheduled workflow that creates an issue: “Daily improvement: run next ULTRA wave — see DAILY-IMPROVEMENT.md.”

### Security

- For auth, user input, or data connections: read `SECURE-FORCE.md`; run Semgrep and manual checklist before release.
- Cursor rules: `secure-force-security.mdc`, `secure-force-sast.mdc`.

---

## 6. Goal

**Primary goal:** Keep the dashboard accurate, stable, and easy to maintain, with minimal risk to the finalized print and PDF flows.

**Secondary goals:**
- Improve UX, accessibility, and performance where safe.
- Keep data and copy up to date via `state-data.js`.
- Add small, incremental improvements via ULTRA waves and agent batches.
- Document clearly so future maintainers (human or AI) can work confidently.

---

## 7. Summary for ChatGPT

- **Project:** HAP 340B Advocacy Dashboard — single-page static site for state 340B policy.
- **Current state:** Feature-complete; print and PDF image flows are finalized.
- **Constraints:** Do not modify Print / PDF, Download PDF (image), or `print.html`.
- **Where to help:** Content, accessibility, performance, SEO, code quality, docs.
- **How to improve daily:** Use ULTRA-prompts.md, run one wave per day, run `dashboard-audit.py`, test print and PDF before commit.
- **Release gate:** Print preview must work; PDF image must work; audit must pass; no regressions in finalized flows.
