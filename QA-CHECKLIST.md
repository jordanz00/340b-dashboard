# Dashboard QA Checklist

Use this checklist before pushing dashboard changes.

**Communications release (BASIC-first):** After any visible or data change, run **[docs/DESIGN-ITERATION-CHECKLIST.md](docs/DESIGN-ITERATION-CHECKLIST.md)** (quick design pass), then verify **[340b-BASIC.html](340b-BASIC.html)** on mobile and desktop. Full-dashboard checks below apply when you ship **340b.html**.

## Automated audit

1. Run `python3 dashboard-audit.py`.
2. Confirm it exits without failures.
3. Run `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .` after security-sensitive changes.
4. Review and fix any real findings instead of suppressing them blindly.

## Release blockers first

Check these before lower-risk polish:

1. Print preview starts correctly and does not show blank or sparse pages.
2. Pennsylvania prints as the default context only when no live state is selected.
3. The selected-state story stays aligned across the map, selection summary, and detail panel.
4. KPI values show final numbers in print, not `0`.
5. Source dates and source links still match the current legal-status sources.
6. The executive scan strip still matches the policy ask, national landscape, and trust cues shown elsewhere.

## Core interactions

1. Open `340b.html` through a local server.
2. Confirm the map renders.
3. Select a state from the map.
4. Select a state from the state list.
5. Use `Clear selection` and confirm the page returns to the neutral state.
6. Toggle `All`, `Protection`, and `No protection`.
7. Confirm invalid `#state-XX` in URL (e.g. `#state-XY`) shows empty selection and no error.
7. Open and close `About this data`.
8. Test `Share link`.
9. Test `Print / PDF` (opens print view in new tab; use that tab’s print dialog to save as PDF).
10. Confirm the executive scan strip updates correctly with the national state counts.
11. Confirm the map context sentence changes appropriately when a state is selected and resets when cleared.

## Print / PDF (mandatory release gate)

**Current approach (dedicated print view):** The `Print / PDF` button opens `print.html` in a new tab. That page is a block-only, print-optimized copy of the dashboard. State (map SVG, selection, KPI values, state lists) is passed via localStorage. The print view injects the map and data, then triggers the browser print dialog (`?auto=1`). Do not rely on `@media print` on the live dashboard for the primary PDF path—that path was replaced after repeated failures (blank pages, missing sections).

**Priority: PDF must contain the same content as the live dashboard. Nothing may be omitted or cut off.**

**Regression guards (do not reintroduce):**
- **First page must show content:** The first printed page must show the header and the first Overview block (What is 340B) directly under the header. No blank first page with only the header. See `print-view.css`: header uses compact margin/padding; `.print-view-intro` and first `.print-view-block` have no top margin so content starts immediately.
- **No mid-content or mid-map breaks:** No page break in the middle of a content block or through the map. Use `page-break-inside: avoid` on `.print-view-block`, `.print-view-map-hero`, `.print-view-map-wrap`.
- **Tight professional spacing:** Content blocks use modest margins (e.g. `margin-bottom: 0.5rem` in print) so the PDF looks tight and professional.

1. Click `Print / PDF` on the dashboard. Confirm a new tab opens with `print.html` and the print dialog appears (or appears after a short delay).
2. In the print view / Print Preview, confirm **first page**: header (HAP, 340B title) and **Overview (What is 340B) block visible on the same page**—no blank first page.
3. Confirm **all sections appear**: HAP Position; executive strip (3 cards); State-by-state analysis (title, selection summary, **map visible**, state lists with counts, Recent legal signals, About this data); KPI strip (4 KPIs + data freshness); Why this matters; Eligible providers; Oversight credibility; Pennsylvania operating stakes; Community benefit; Access to care; Pennsylvania safeguards.
4. Confirm the **map is fully visible** and **no page break cuts through the map or through the middle of a block**.
5. Confirm **no blank pages**; content flows with tight, professional spacing.
6. Confirm KPI values show final numbers (7%, $7.95B, 200+, 72), not `0`.
7. Confirm Pennsylvania is selected by default when no state was selected on the dashboard (selection title/text in print view match PA context).

**If the print view is missing sections or the map:** Check that the dashboard map has finished loading before clicking Print; allow popups for the site if the new tab does not open.

## Download PDF (image) — regression guards

**Do not reintroduce:**
- **Exactly 2 pages:** PDF image must be exactly 2 pages. Page 1 = intro through map section. Page 2 = KPI row through end (supporting section, community benefit, access, pa-safeguards). No page 3 or 4. No page break in the middle of community benefit.
- **Adequate spacing above community benefit:** In `340b.js` `injectPdfStyle()`, `.supporting-section` has `margin-bottom: 2.5rem` and `#community-benefit` has `margin-top: 2.5rem` so the community benefit block does not overlap the cards above.
- **No blank page 4:** The PDF image logic must only add slice1 (page 1) and slice2 (page 2); no additional pages.

## Accessibility and fallback

1. Tab through the main controls and confirm focus is visible.
2. Press `Escape` after selecting a state and confirm the selection clears.
3. Confirm the share and print buttons still work if the map fails.
4. Confirm the fallback summary appears if map assets are unavailable.

## Content and maintenance

1. Confirm `dataFreshness`, `lastUpdated`, and `shareUrlBase` are correct in `state-data.js`.
2. Confirm the `copy` values in `state-data.js` still match the live intro, HAP ask, and trust-copy surfaces.
3. Confirm source links are still valid and use `rel="noopener noreferrer"`.
4. Confirm state-law verification still follows this order: MultiState, then ASHP, then America's Essential Hospitals.
5. Confirm the audit output is treated as a code check only, not a replacement for visual print review or source verification.
6. Confirm the printed dashboard still makes sense to a PDF-only reader such as a lawmaker, hospital CEO, or administrator.
7. Confirm `README.md`, `SECURITY.md`, `NOVICE-MAINTAINER.md`, and `DATA-UPDATE.md` still match the current behavior.
