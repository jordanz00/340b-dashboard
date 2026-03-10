# ULTRA Prompts — 340B Dashboard Continuous Improvement

ULTRA prompts synthesize and improve upon all prior prompt waves (v01–v60). Each wave builds on previous outcomes and targets the highest-impact areas for reliability, maintainability, and executive readiness.

---

## ULTRA v01 — 10 Prompts

### ULTRA-01.1 Print/PDF Scaling and Layout Gate

> **Context:** The dashboard print/PDF output must fit 2–3 pages, scale all elements 25%, map 15% smaller, and eliminate blank pages. **Task:** Verify the current print styles in `340b.css` achieve this. Check for: (1) `html { font-size: 75% }` in `@media print`, (2) map SVG `max-height` constraint, (3) intro card `min-height: 0`, (4) tight margins and spacing. Fix any gap that causes blank pages or excessive white space. Ensure no elements are excluded—only scaled.

### ULTRA-01.2 Print QA Continuous Check

> **Context:** Print regressions (blank pages, cut-off map, wrong scaling) have recurred. **Task:** Add or update a print QA checklist in `QA-CHECKLIST.md` or `NOVICE-MAINTAINER.md` that a maintainer must run before release: (1) Open Print/PDF preview, (2) Confirm 2–3 pages max, (3) Confirm no blank or half-blank pages, (4) Confirm map fully visible, (5) Confirm intro/exec/map/KPI/supporting content all present. Document this as a mandatory release gate.

### ULTRA-01.3 Reliability Synthesis Pass

> **Context:** Prior prompts (v05–v20) emphasized print, share, map, hash, and fallback reliability. **Task:** Audit the dashboard for the highest-risk failure points: (1) map failure isolation—does print/share still work if map fails? (2) share fallback—does clipboard failure degrade gracefully? (3) hash validation—does `#state-XX` handle invalid hashes? (4) print prep—does `preparePrintSnapshot` run before `window.print`? Fix any gap found.

### ULTRA-01.4 Design Token and Spacing Consistency

> **Context:** Prior prompts (v07, v08, v17) stressed design token discipline and spacing. **Task:** Audit `340b.css` for one-off values in spacing, radius, shadow, or color that should use design tokens. Consolidate at least 3 such cases into `:root` or existing variables. Ensure print styles use consistent scaling rather than arbitrary `rem` overrides.

### ULTRA-01.5 Accessibility Regression Check

> **Context:** Prior prompts (v03, v05, v07, v09) covered keyboard nav, live regions, reduced motion, and disclosure semantics. **Task:** Re-check: (1) keyboard flow through map and state chips, (2) `aria-live` for state selection, (3) `prefers-reduced-motion` for animations, (4) native `<details>` semantics for "About this data". Fix any regression.

### ULTRA-01.6 Novice Maintainer Handoff Clarity

> **Context:** Prior prompts (v06, v08, v15, v18) emphasized one-novice-maintainer ownership. **Task:** Ensure `NOVICE-MAINTAINER.md` or `README.md` answers: (1) Which files to edit for content vs. layout vs. behavior? (2) Where does print preparation happen? (3) What must be checked before release (print, share, audit)? Add or tighten guidance where missing.

### ULTRA-01.7 Source Credibility and Date Visibility

> **Context:** Prior prompts (v04, v10, v14, v17) stressed data provenance and "last updated" visibility. **Task:** Verify: (1) "Last updated" is visible in both live and print views, (2) source links are clear and verifiable, (3) `state-data.js` or config is the single source for dates. Fix any mismatch.

### ULTRA-01.8 Copy and Behavior Alignment

> **Context:** Prior prompts (v08, v10, v18) required UI copy to match actual behavior. **Task:** Audit labels, status text, empty states, and section headings. Remove any reference to removed features (search, dark mode, presentation mode). Ensure filter status, selection summary, and print/share feedback are accurate.

### ULTRA-01.9 Audit Script and Release Gate Integration

> **Context:** Prior prompts (v10, v14, v20) added `dashboard-audit.py` and release checklists. **Task:** Verify the audit script runs and catches: unsafe DOM patterns, hidden characters, link hardening. Ensure `QA-CHECKLIST.md` or equivalent lists print preview as a mandatory step. Connect docs to the actual workflow.

### ULTRA-01.10 Print Blank-Page and Formatting Error Guard

> **Context:** Blank pages and formatting errors in PDF have been recurring. **Task:** Add a dedicated prompt or checklist item: "Before any layout or print CSS change, run Print/PDF preview and confirm: (1) no blank pages, (2) no half-empty pages, (3) map not cut off, (4) content flows 2–3 pages. If regressions occur, revert or fix before committing." Document this in the maintainer workflow.

---

## ULTRA v02 — 10 Prompts (Run Completed)

*ULTRA v02 has been run. Summary: print CSS audit check in dashboard-audit.py, share fallback copy clarified, preparePrintSnapshot order documented, release gate in NOVICE-MAINTAINER, print tokens and prep comments applied.*

### ULTRA-02.1 Print Scaling Verification Pass

> After any print CSS change, verify that `html { font-size: 75% }` and map `max-height: 14cm` produce a 2–3 page PDF with no blank pages. Document the exact print media rules that achieve this in a brief comment at the top of the `@media print` block.

### ULTRA-02.2 Design Token Consolidation

> Audit `340b.css` for hardcoded `#ddd`, `#ccc`, `#666`, or similar one-off colors in print styles. Replace with `:root` tokens (e.g. `--print-border`, `--print-muted`) so print and screen stay consistent.

### ULTRA-02.3 Hash Validation Hardening

> Ensure invalid `#state-XX` hashes (unknown state, typo) never leave the dashboard in a fake selected state. Add explicit validation in the hash handler and fall back to neutral or PA cleanly.

### ULTRA-02.4 Share Fallback Clarity

> When clipboard fails, ensure the fallback (textarea copy or manual prompt) gives clear, plain-language instructions. No technical jargon. Test in a browser that blocks clipboard.

### ULTRA-02.5 Print Prep Order Contract

> Document the exact order of `preparePrintSnapshot`: finalizeCountUpValues → revealAllAnimatedSections → preparePrintSelectionState → buildPrintIntroSnapshot → drawMap (if needed). Add a one-line comment above each call explaining why it runs in that order.

### ULTRA-02.6 Reduced-Motion Print Parity

> Verify that with `prefers-reduced-motion: reduce`, the print output still shows all content (no hidden scroll-reveal sections) and final values. Fix any gap.

### ULTRA-02.7 Source Date Visibility

> Ensure "Last updated" is visible in both live dashboard and print. If the live header or footer lacks it, add it to a visible location. Check `state-data.js` config.

### ULTRA-02.8 Audit Script Print Check

> Extend `dashboard-audit.py` with a lightweight check: verify `@media print` exists in 340b.css and contains `font-size: 75%` and `max-height` for the map. Do not attempt to render PDF; only check CSS structure.

### ULTRA-02.9 Copy Stale-Feature Removal

> Search for any remaining references to "search," "dark mode," "presentation mode," or "filter by name" in UI copy, comments, or docs. Remove them.

### ULTRA-02.10 Release Gate Documentation

> Ensure `README.md` or `NOVICE-MAINTAINER.md` explicitly states: "Print preview is a mandatory release gate. Do not publish if the PDF has blank pages, cut-off map, or wrong scaling."

---

## Usage

1. **ULTRA v01** has been run.
2. **ULTRA v02** has been run.
3. **ULTRA v03** — rewritten for print view + map visibility + page breaks. Do not run until instructed.
4. **ULTRA v04** — do not run until instructed.
5. **ULTRA v05, v06, v07** — ready for improvement cycles. See [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md).
6. Run waves in order. After each wave: update handoff, run audit, optionally commit.

---

## ULTRA v03 — 10 Prompts (Print View and Map Visibility)

*Do not run until instructed. Primary PDF path is print.html; this wave ensures map visible in print view and Download PDF (image), professional page breaks, and design parity.*

### ULTRA-03.1 Map Visible in Print View and Download PDF

> **Print view:** In `openPrintView()`, call `showMapWrapImmediately()` and `revealAllAnimatedSections()` before waiting; poll for `#us-map svg` with `path[data-state]`; use 1000ms initial delay and up to 25 attempts. In print.html, if no SVG is injected, show fallback message. Ensure `.print-view-map-wrap` and svg use `visibility: visible` and `opacity: 1`. **Download PDF (image):** Call `revealAllAnimatedSections()` and `showMapWrapImmediately()`; scroll map into view; use 600ms delay before html2canvas so map paints. Map must appear in both outputs.

### ULTRA-03.2 Print Page Breaks and Layout Contract

> **Page breaks:** In `print-view.css` `@media print`, use `page-break-inside: avoid` on blocks, executive cards, KPI strip, map wrap, details. Use `page-break-after: avoid` on blocks and section heads so sections are not cut mid-content. **Min-heights:** Document in 340b.css `@media print` which screen min-heights are overridden. Ensure no new rule creates blank pages.

### ULTRA-03.3 State List Print Density

> Ensure the state chips/list below the map are visible and readable in print. If they overflow or are cut off, add print-specific font-size and gap rules so the full list fits below the map without removing states. Prefer scaling down over hiding.

### ULTRA-03.4 Methodology Always Open in Print

> Verify that when the user clicks Print/PDF, the "About this data" (methodology) section is open and its full content (including source links and verification order) is visible in the PDF. Confirm both JS (`setAttribute("open")`) and CSS (`display: block` for `.methodology-content`) are in place and that no print rule hides it.

### ULTRA-03.5 Share and Print Button Accessibility

> Verify that the Share link and Print/PDF buttons have clear aria-labels, are reachable by keyboard, and that focus order is logical. Ensure the utility status message after share or print is announced to screen readers (e.g. via aria-live or role="status").

### ULTRA-03.6 Data Freshness and Last Updated Consistency

> Ensure "Last updated" and "Data as of" appear in both the live dashboard (e.g. header or KPI strip) and in the print/PDF. Confirm a single source (e.g. CONFIG.lastUpdated in state-data.js) drives all visible date strings and that print-specific copy is synced from the same source.

### ULTRA-03.7 Audit Script and Print Checklist Alignment

> Align the manual print checks in `dashboard-audit.py` (MANUAL_CHECKS) with the print gate in `QA-CHECKLIST.md` and `NOVICE-MAINTAINER.md`. Ensure the same criteria (no blank pages, map visible, content present) are stated consistently and that the audit script’s check_print_css and check_print_structure cover the intended structure.

### ULTRA-03.8 Error Recovery and Empty States

> Verify that if the map fails to load, the user sees a clear fallback (e.g. state list or message) and that Print/PDF and Share still work. Verify empty states (e.g. "No state selected") are clear and that filter "No states match" is handled. No dead ends.

### ULTRA-03.9 Performance and Print Timing

> Ensure the 700ms (or current) delay before `window.print()` in `preparePrintSnapshot` is sufficient for the map to paint and for methodology to open. If print still shows missing content, consider increasing the delay or adding a second reflow trigger. Document the chosen delay and reason in a comment.

### ULTRA-03.10 ULTRA Wave Handoff

> After running ULTRA v03, update this file to note "ULTRA v03 has been run" and add a short summary of changes (e.g. print overrides documented, methodology verified, audit aligned). Keep ULTRA v04 prompts ready for the next wave (do not run v04 until instructed).

---

## ULTRA v04 — 10 Prompts (Print Design, Layman Terms, Abbreviations, Showcase)

*Do not run until instructed.*

### ULTRA-04.1 Print View as Primary PDF Path

> Ensure all docs describe the print view flow; map serialized with PA default. Verify wait-for-map before opening print tab.

### ULTRA-04.2 Print View Design Parity with Dashboard

> Audit print-view.css and print.html: cards with shadow and accent; header branding; KPI strip; map container; About this data compact. Executive-ready look.

### ULTRA-04.3 Layman's Terms Pass

> Audit user-facing copy for technical terms; add plain-language where needed. Clarity for non-specialists.

### ULTRA-04.4 Abbreviation Expansion (Non-State)

> Expand HRSA, ASHP, AHA, FQHC, CAH, DSH, PBM on first use in smaller muted text. State abbreviations excluded. Apply in 340b.html and print.html.

### ULTRA-04.5 Showcase Key Stats and Highlights

> Highlight 7%, $7.95B, 200+, 72 PA hospitals, no cost to taxpayers, HAP ask. Typography and accent borders in live and print.

### ULTRA-04.6 Print View About This Data Compact

> Methodology in print: smaller font, indentation, abbreviation expansions. Last updated visible.

### ULTRA-04.7 Download PDF (Image) Working and Tested

> Button works with CDN or vendor; CSP allows script; multi-page capture; clear feedback. Document local vendor in NOVICE-MAINTAINER.

### ULTRA-04.8 Map Visible in Print View with PA Default

> openPrintView waits for map SVG; PA selected; print view injects SVG; fallback if mapSvg empty.

### ULTRA-04.9 Consistent Terminology and Labels

> Consistent terms across live, print, docs: Print/PDF, About this data, Contract pharmacy protection, Data as of.

### ULTRA-04.10 ULTRA v04 Handoff

> After running v04, note run and add summary. Update Usage section.

---

## ULTRA v05 — 10 Prompts (Print Polish, Accessibility, Data Consistency)

*Do not run until instructed. Run after v04.*

### ULTRA-05.1 Map Visibility Regression Check

> After v04, verify map remains visible in both print view (print.html) and Download PDF (image). No regressions.

### ULTRA-05.2 Print View Accessibility

> Ensure print.html and print-view.css support screen readers (heading hierarchy, alt text for images). Print output should be navigable.

### ULTRA-05.3 Keyboard and Focus in Live Dashboard

> Verify Share, Print/PDF, Download PDF (image), Export SVG, and filter buttons are reachable by Tab and have visible focus. Logical focus order.

### ULTRA-05.4 Reduced Motion Parity

> With `prefers-reduced-motion: reduce`, print and Download PDF (image) still show all content. No hidden scroll-reveal or animated sections.

### ULTRA-05.5 Single Source for Dates

> CONFIG.lastUpdated and dataFreshness drive all visible dates. Print view, methodology, and KPI strip use same source. No drift.

### ULTRA-05.6 Source Links and Verification Order

> Methodology "About this data" lists MultiState, ASHP, America's Essential Hospitals in verification order. Links valid and use rel="noopener noreferrer".

### ULTRA-05.7 Print Checklist and Audit Alignment

> QA-CHECKLIST.md, NOVICE-MAINTAINER.md, and dashboard-audit.py MANUAL_CHECKS state same criteria: map visible, no blank pages, content present.

### ULTRA-05.8 Error Recovery

> Map failure: fallback message; Print/PDF and Share still work. Empty states clear. No dead ends.

### ULTRA-05.9 Print View Load and Auto-Print

> print.html with ?auto=1 triggers window.print() after content injects. 600ms delay sufficient. Document in DAILY-IMPROVEMENT.md if needed.

### ULTRA-05.10 ULTRA v05 Handoff

> After running v05, note run and add summary. Keep v06 ready.

---

## ULTRA v06 — 10 Prompts (Performance, Maintainability, Regressions)

*Do not run until instructed. Run after v05.*

### ULTRA-06.1 Map Render Time

> Map draws within 2s on typical hardware. No blocking main thread. Consider lazy-load if needed.

### ULTRA-06.2 Script Size and Dependencies

> Vendor scripts (d3, topojson, html2canvas, jspdf) documented. Local copies preferred for offline; CDN with CSP for online.

### ULTRA-06.3 File Roles Documentation

> NOVICE-MAINTAINER.md: which files for content vs layout vs behavior. Single place for "where to edit" guidance.

### ULTRA-06.4 Print Regressions Guard

> Before any layout or print-related change, run Print/PDF and Download PDF (image). Confirm map visible, no blank pages. Revert if regressions.

### ULTRA-06.5 Share Regressions Guard

> Share link copies canonical URL. Hash state preserved. Test clipboard and fallback.

### ULTRA-06.6 Filter and Selection Sync

> Filter All/Protection/No protection works. Selection summary and map stay in sync. PA default for print when no selection.

### ULTRA-06.7 Audit Script Coverage

> dashboard-audit.py catches: unsafe DOM, hidden chars, link hardening, print CSS structure. Add checks when new surfaces added.

### ULTRA-06.8 Copy Stale-Feature Removal

> No references to removed features (search, dark mode, presentation mode). UI copy matches behavior.

### ULTRA-06.9 Semgrep and Security Scan

> Run Semgrep on security-sensitive changes. Document in SECURITY.md. No secrets or eval in source.

### ULTRA-06.10 ULTRA v06 Handoff

> After running v06, note run and add summary. Keep v07 ready.

---

## ULTRA v07 — 10 Prompts (Scalability, Layman Language, Showcase)

*Do not run until instructed. Run after v06.*

### ULTRA-07.1 Design Token Consolidation

> Hardcoded colors, radii, shadows in print-view.css and 340b.css consolidated into :root or existing vars. No one-off #ddd, #ccc.

### ULTRA-07.2 Layman Language Second Pass

> User-facing copy uses plain language. Technical terms (e.g. "covered entities", "PBM") explained on first use. Clarity for lawmakers and CEOs.

### ULTRA-07.3 Abbreviation Expansion Second Pass

> HRSA, ASHP, AHA, FQHC, CAH, DSH, PBM expanded in smaller text. State abbreviations excluded. Consistent in live and print.

### ULTRA-07.4 Key Stats Visual Hierarchy

> 7%, $7.95B, 200+, 72 PA hospitals, "no cost to taxpayers", HAP ask stand out. Typography and accent borders. Same in print view.

### ULTRA-07.5 Scalability of Layout

> Grid and flex patterns reusable. New sections follow same card/block structure. No brittle selectors.

### ULTRA-07.6 Text Readability

> Font sizes, line heights, contrast meet WCAG AA. Print view readable at 100% zoom.

### ULTRA-07.7 Executive Readiness

> PDF (print view and Download PDF image) looks professional. No debug text, broken layout, or low-contrast elements.

### ULTRA-07.8 Maintainability Score

> NOVICE-MAINTAINER answers: what to edit, what to check, where print prep happens. One maintainer can own the project.

### ULTRA-07.9 DAILY-IMPROVEMENT Integration

> DAILY-IMPROVEMENT.md workflow references ULTRA prompts. After each wave: run audit, update handoff, optionally commit. Level-up notification concept documented.

### ULTRA-07.10 ULTRA v07 Handoff

> After running v07, note run and add summary. Next waves (v08+) follow same pattern. See DAILY-IMPROVEMENT.md for continuous improvement.
