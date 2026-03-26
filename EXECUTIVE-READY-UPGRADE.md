# Executive-Ready Upgrade — 340B Advocacy Dashboard

This document describes the minimum set of improvements to make the dashboard **executive-ready** for lawmakers and hospital CEOs, and the steps taken to achieve that.

---

## Context

The HAP 340B Advocacy Dashboard is a static single-page site (HTML/CSS/JS) explaining the 340B Drug Pricing Program. It includes an interactive U.S. map, state filters, KPIs, and print/PDF export. This upgrade focused on:

1. Security hardening
2. Basic accessibility and performance
3. Print/PDF stability
4. Hosting and distribution
5. Stakeholder feedback and data-update process

---

## Improvements Implemented

### 1. Security Hardening

- **print.html CSP:** Added Content-Security-Policy meta tag aligned with 340b.html (script-src 'self'; img-src 'self' data:).
- **Map SVG injection:** Payload map SVG is injected with insertAdjacentHTML; xmlns is added when missing so the map renders. Fallback message shown if injection fails.
- **Payload validation:** Added `isValidPayload()` to validate payload shape, `mapSvg` type and max length (500KB) before use.
- **Try/catch around applyPayload:** Print view now catches errors and shows a clear fallback message instead of failing silently.

### 2. Basic Accessibility and Performance

- **Skip map link:** Added a "Skip map" link immediately after the map container so keyboard users can bypass ~50 map tab stops.
- **aria-atomic on state detail panel:** Screen readers now announce the full panel when the selected state changes.
- **Policy nav target:** Moved `id="policy"` from the empty hidden div to the first visible policy section (Why this matters).
- **skip-link:focus-visible:** Matches focus-visible for keyboard users where supported.
- **Touch targets:** Added `min-height: 44px` to `.state-filter-btn` for WCAG touch-target sizing.
- **Preload:** Added `rel="preload" as="image"` for the HAP logo and `fetchpriority="high"` on the header logo for faster LCP.

### 3. Print/PDF Stability

- **Map + legend on same page:** Map and legend wrapped in `.print-view-map-and-legend` with `page-break-inside: avoid` so they stay together when printing.
- **Map visibility:** SVG gets xmlns when missing; insertAdjacentHTML for injection; 1.5s delay + reflow before auto-print; print CSS forces `display: block !important` and visibility on map container and SVG.
- **Regression guards in dashboard-audit.py:** New `check_print_view_regression_guards()` verifies print-view.css has `@page` and `page-break` rules.
- **print-view security check:** Audit verifies payload validation exists in print.html; allows trusted map payload injection.
- **Existing print flow preserved:** Both Print/PDF (print.html) and Download PDF (image) flows remain.

### 4. Hosting and Distribution

- **Canonical URL:** `https://jordanz00.github.io/340b-dashboard/340b.html`
- **shareUrlBase in state-data.js:** Used by Share link; update when the public URL changes.
- **Deep links:** Hash links like `#state-PA` work. Invalid codes (e.g. `#state-XY`) are ignored; selection stays empty.

### 5. Stakeholder Testing Process

**Before executive demos:**

1. **Small-scale testing**
   - 2–3 hospital CEOs or advocacy staff
   - 2–3 lawmakers or legislative aides
2. **What to capture**
   - Can they find key metrics (72 PA hospitals, $7.95B, 7%)?
   - Is the map interaction clear?
   - Is the Policy section easy to reach?
   - Do Print/PDF and Share link work as expected?
3. **Document feedback**
   - Note usability issues and clarity improvements.
   - Prioritize high-impact changes; defer cosmetic tweaks.

### 6. Data Update Process

- **Source:** `state-data.js` — CONFIG, STATE_340B, dates, copy.
- **Step-by-step:** See `DATA-UPDATE.md`.
- **Verification order:** MultiState → ASHP → America's Essential Hospitals.
- **Stale data:** Update `dataFreshness` and `lastUpdated` in CONFIG when new state laws pass or data changes.

---

## Manual Release Checks

Before publishing, run:

1. `python3 dashboard-audit.py` — fix any failures.
2. **Print gate:** Open Print/PDF and Download PDF (image). Confirm:
   - First page shows header + Overview block (no blank first page).
   - Map fully visible in both outputs.
   - PDF image exactly 2 pages; no break inside community benefit.
3. Verify source dates and links against current legal-status sources.
4. Re-read copy for lawmakers and hospital CEOs.

---

## Phase 2 (Future)

- Broader backlog (ULTRA v01–v70+, Research R1–R9)
- Automated data updates / CMS integration
- Full accessibility and performance optimization
- Extensible platform for multi-dashboard support
- SRI hashes for external scripts (html2canvas, jsPDF) — or move to local vendor copies

---

## Files Changed in This Upgrade

| File | Changes |
|------|---------|
| print.html | CSP, payload validation, map SVG injection (insertAdjacentHTML, xmlns), try/catch, 1.5s print delay, 5s localStorage clear delay, map+legend wrapper |
| 340b.html | Preload, fetchpriority, aria-atomic, skip-map link, id=policy on supporting section |
| 340b.css | skip-link:focus-visible, skip-map-link styles, state-filter-btn min-height, map-container position |
| print-view.css | .print-view-map-and-legend wrapper, print rules for map+legend (page-break-inside: avoid), map-wrap/svg display and visibility in print |
| dashboard-audit.py | check_print_view_regression_guards, payload validation check, innerHTML exception for trusted map payload |
| EXECUTIVE-READY-UPGRADE.md | This plan and implementation log |
