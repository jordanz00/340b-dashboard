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
6. **ULTRA v08–v12** — 50 Improvements (Agent Batches A–E). For the agent workflow, use [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md).
7. **Download PDF (image) reliability:** If "PDF capture failed" appears, treat as a regression. Ensure html2canvas and jsPDF load correctly (constructor: `window.jspdf.jsPDF` or `window.jspdf`), use PNG (not JPEG) for canvas export to avoid tainted canvas, and show the fallback message "Try Print / PDF instead" on failure. See ULTRA-04.7, ULTRA-11.9.
8. **ULTRA v13–v22** — Novice Refactor (100 prompts). For daily refactoring and learning; see [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md). Run one prompt per day or one wave at a time; then run audit and print gate.
9. Run waves in order. After each wave: update handoff, run audit, optionally commit.

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

---

## ULTRA v08 — 10 Prompts (50 Improvements Agent Batch A: SEO & Discoverability)

*Aligns with [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md) Batch A. Do not run until instructed.*

### ULTRA-08.1 Canonical URL

> Add `<link rel="canonical" href="https://jordanz00.github.io/340b-dashboard/340b.html">` in 340b.html head.

### ULTRA-08.2 og:image Dimensions

> Use 1200×630 image for og:image or set `og:image:width` and `og:image:height` to match actual image dimensions.

### ULTRA-08.3 JSON-LD Structured Data

> Add `application/ld+json` script with WebPage or Organization schema in 340b.html.

### ULTRA-08.4 og:locale

> Add `<meta property="og:locale" content="en_US">` for social sharing.

### ULTRA-08.5 print.html Robots

> Add `robots: noindex, nofollow` meta to print.html (print-only page).

### ULTRA-08.6 Breadcrumb Schema

> Add structured data for breadcrumb navigation.

### ULTRA-08.7 FAQ Schema

> Add FAQ schema if methodology contains Q&A structure.

### ULTRA-08.8 theme-color

> Extend existing theme-color meta for mobile browsers.

### ULTRA-08.9 apple-touch-icon

> Add apple-touch-icon and favicon sizes (192×192, 512×512).

### ULTRA-08.10 Meta Generator

> Remove or hide meta generator in production.

---

## ULTRA v09 — 10 Prompts (50 Improvements Agent Batch B: Performance & Security)

*Aligns with [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md) Batch B. Do not run until instructed. Run after v08.*

### ULTRA-09.1 Script Defer

> Add `defer` to D3/TopoJSON/states scripts or load after DOM ready.

### ULTRA-09.2 Preload LCP Image

> Add `<link rel="preload" href="haplogo_box_blue.jpeg" as="image">` for header logo.

### ULTRA-09.3 Map CLS

> Reserve space for map with `aspect-ratio` or `min-height` on `.map-wrap` to avoid CLS.

### ULTRA-09.4 SRI for html2canvas and jsPDF

> Add `integrity` and `crossorigin="anonymous"` for CDN scripts, or move to local vendor.

### ULTRA-09.5 Local Vendor Copies

> Prefer local copies in `assets/vendor/` per project rules.

### ULTRA-09.6 font-display

> Add `font-display: swap` for any custom fonts.

### ULTRA-09.7 Image Dimensions

> Add `width` and `height` to all images to avoid CLS.

### ULTRA-09.8 localStorage Try/Catch

> Wrap print flow `localStorage` in try/catch for quota or disabled storage.

### ULTRA-09.9 print.html SVG Sanitization

> Sanitize or use DOMParser for map SVG injection in print.html.

### ULTRA-09.10 CSP Restriction

> Restrict `script-src` if switching to local scripts.

---

## ULTRA v10 — 10 Prompts (50 Improvements Agent Batch C: UX & Loading States)

*Aligns with [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md) Batch C. Do not run until instructed. Run after v09.*

### ULTRA-10.1 Print/PDF Loading

> Show "Preparing…" until print view opens.

### ULTRA-10.2 Download PDF Loading

> Verify "Creating PDF…" feedback and button disabled during capture.

### ULTRA-10.3 Share Loading

> Verify "Copying…"/"Sharing…" feedback is clear.

### ULTRA-10.4 Export SVG Loading

> Add brief feedback during serialization and download.

### ULTRA-10.5 print.html viewport-fit

> Add `viewport-fit=cover` to print.html for notched devices.

### ULTRA-10.6 Utility Toolbar 320px

> Verify utility toolbar wraps at ~320px without overflow.

### ULTRA-10.7 State Chips 320px

> Validate state chips in `.state-list-grid` at 320px; no overflow.

### ULTRA-10.8 Executive Strip Breakpoint

> Add intermediate breakpoint for executive strip at 900px if needed.

### ULTRA-10.9 Map 320px

> Validate map container readability at 320px.

### ULTRA-10.10 Count-up Skeleton

> Optional skeleton or placeholder for count-up values to avoid visual jump.

---

## ULTRA v11 — 10 Prompts (50 Improvements Agent Batch D: Accessibility & Robustness)

*Aligns with [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md) Batch D. Do not run until instructed. Run after v10.*

### ULTRA-11.1 window.onerror

> Add global `window.onerror` handler with minimal "Something went wrong" message.

### ULTRA-11.2 onunhandledrejection

> Add `window.onunhandledrejection` for async failures (share, clipboard).

### ULTRA-11.3 Share .catch()

> Ensure Share/clipboard `.catch()` always runs with clear fallback instructions.

### ULTRA-11.4 aria-busy

> Add `aria-busy` on map container during load.

### ULTRA-11.5 Skip-link Focus

> Verify skip-link focus visibility and keyboard flow.

### ULTRA-11.6 Link Focus Underline

> Add link underline on focus for keyboard navigation.

### ULTRA-11.7 Touch Tooltips

> Disable hover tooltips on touch devices; rely on detail panel.

### ULTRA-11.8 navigator.share Fallback

> Ensure robust clipboard fallback when navigator.share fails.

### ULTRA-11.9 PDF Timeout

> Add idle/long-running op timeout for PDF capture.

### ULTRA-11.10 Observer Teardown

> Dispose observers and listeners on teardown to avoid memory leaks.

---

## ULTRA v12 — 10 Prompts (50 Improvements Agent Batch E: Analytics & Data)

*Aligns with [AGENT-TEMPLATE.md](AGENT-TEMPLATE.md) Batch E. Do not run until instructed. Run after v11.*

### ULTRA-12.1 data-event Attributes

> Add `data-event` attributes on utility buttons (share, print, export).

### ULTRA-12.2 HAP340B.track Stub

> Add `window.HAP340B?.track(eventName, payload)` analytics stub.

### ULTRA-12.3 Fire Events

> Fire events for state selection, filter change, share, print, export SVG.

### ULTRA-12.4 Event Catalog

> Create central event catalog: `state_selected`, `filter_changed`, `share_success`, etc.

### ULTRA-12.5 Payload Schema

> Document analytics event payload schema.

### ULTRA-12.6 i18n Data Layer

> Add `strings` object in state-data.js for labels and copy.

### ULTRA-12.7 data-i18n

> Use config for copy to enable future translation.

### ULTRA-12.8 State Validation

> Add validation that warns on missing state keys: `cp`, `pbm`, `y`, `notes`.

### ULTRA-12.9 NOVICE-MAINTAINER Network vs Offline

> Document which features require network vs work offline in NOVICE-MAINTAINER.md.

### ULTRA-12.10 Analytics Guard

> Use `if (window.HAP340B?.analytics)` before firing events.

---

## ULTRA v13 — 10 Prompts (Novice Refactor: Labels and Comments — 340b.js)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md). Run one prompt per day or one wave at a time; then run audit and print gate.*

### ULTRA-13.1 Function comment — preparePrintSnapshot

> So that a novice knows when this runs. Add a one-line comment above `preparePrintSnapshot` that says: "Runs when the user clicks Print/PDF; prepares the page (final numbers, revealed sections, PA default) then opens the print dialog."

### ULTRA-13.2 Function comment — openPrintView

> So that a novice knows what this does. Add a one-line comment above `openPrintView` that says: "Opens the print view tab and injects the map and snapshot data from localStorage so the user can save as PDF from the browser."

### ULTRA-13.3 Function comment — downloadPdfAsImage

> So that a novice can find the PDF image flow. Add a one-line comment above `downloadPdfAsImage` that says: "Runs when the user clicks Download PDF (image); captures the main content with html2canvas and builds a multi-page PDF with breaks after map and before community benefit."

### ULTRA-13.4 Function comment — cacheDom

> So that a novice understands the DOM cache. Add a one-line comment above `cacheDom` that says: "Stores references to all elements the script needs (buttons, map container, status text) so we don't search the DOM repeatedly."

### ULTRA-13.5 Function comment — finalizeCountUpValues

> So that a novice knows why numbers change before print. Add a one-line comment above `finalizeCountUpValues` that says: "Sets every count-up number to its final value (e.g. 7, 72) so print/PDF does not show 0 or half-animated values."

### ULTRA-13.6 Function comment — revealAllAnimatedSections

> So that a novice knows what "revealed" means. Add a one-line comment above `revealAllAnimatedSections` that says: "Makes all scroll-reveal sections visible immediately so print and PDF capture see the full page, not hidden blocks."

### ULTRA-13.7 Function comment — showMapWrapImmediately

> So that a novice knows why the map is shown. Add a one-line comment above `showMapWrapImmediately` that says: "Makes the map container visible without waiting for scroll; used before print and PDF capture so the map is in the output."

### ULTRA-13.8 Function comment — buildPrintIntroSnapshot

> So that a novice can find print intro logic. Add a one-line comment above `buildPrintIntroSnapshot` that says: "Clones the intro cards into the print-only snapshot block so the first print page shows the same content as the live dashboard."

### ULTRA-13.9 Function comment — runTaskSafely

> So that a novice knows errors are caught. Add a one-line comment above `runTaskSafely` that says: "Runs a function and catches any error so one failing part (e.g. map) does not break the rest of the app."

### ULTRA-13.10 Function comment — setUtilityStatus

> So that a novice knows where status messages go. Add a one-line comment above `setUtilityStatus` that says: "Updates the small status text near the toolbar (e.g. 'PDF saved.' or 'Copying link...') so the user gets feedback after an action."

---

## ULTRA v14 — 10 Prompts (Novice Refactor: Labels and Comments — 340b.css)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-14.1 Section label — base and reset

> So that a novice can find global styles. Add a short comment block before the first block of base/reset rules in 340b.css (e.g. "Base — box-sizing, body background, default font"). Keep the existing code map at the top.

### ULTRA-14.2 Section label — header and nav

> So that a novice can find the header. Add a short comment before the styles that affect the dashboard header and nav (e.g. ".dashboard-header, .header-left, .dashboard-nav") with a 2–3 word label like "Header and nav."

### ULTRA-14.3 Section label — utility toolbar

> So that a novice can find toolbar styles. Add a short comment before the rules for the utility toolbar (Print, PDF image, Share, Export SVG) with a label like "Utility toolbar."

### ULTRA-14.4 Section label — cards and intro

> So that a novice can find card styles. Add a short comment before the block that styles the intro cards and general card layout (e.g. ".card", ".intro-section") with a label like "Cards and intro section."

### ULTRA-14.5 Section label — executive strip

> So that a novice can find the executive strip. Add a short comment before the styles for the executive proof strip (the three horizontal cards) with a label like "Executive strip."

### ULTRA-14.6 Section label — map and state list

> So that a novice can find map styles. Add a short comment before the block that styles the map container, legend, and state list (e.g. ".map-hero-section", ".state-list-grid") with a label like "Map and state list."

### ULTRA-14.7 Section label — KPI strip

> So that a novice can find the KPI numbers. Add a short comment before the styles for the KPI strip (the row of key numbers) with a label like "KPI strip."

### ULTRA-14.8 Section label — methodology and details

> So that a novice can find the "About this data" section. Add a short comment before the styles for the methodology/details block with a label like "Methodology and details."

### ULTRA-14.9 Section label — print media

> So that a novice can find print rules. Add a short comment at the start of the `@media print` block that says "Print — scaling, page breaks, and print-only visibility." Do not remove the existing code map line about print.

### ULTRA-14.10 Section label — footer and overrides

> So that a novice can find the footer and any overrides. Add a short comment before the footer and any utility/override rules at the end of the file with a label like "Footer and overrides."

---

## ULTRA v15 — 10 Prompts (Novice Refactor: Labels and Comments — state-data.js and Data Layer)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-15.1 Comment — CONFIG

> So that a novice knows what CONFIG is for. Add a one-line comment above the `CONFIG` object in state-data.js that says: "CONFIG: titles, dates, share URL, and copy used by 340b.js and 340b.html. Edit here when you change the dashboard name or last-updated date."

### ULTRA-15.2 Comment — FIPS_TO_ABBR

> So that a novice knows what FIPS is. Add a one-line comment above `FIPS_TO_ABBR` that says: "Maps numeric FIPS codes (from the map data) to two-letter state codes (e.g. 42 → PA). Used when drawing the map and looking up state data."

### ULTRA-15.3 Comment — STATE_NAMES

> So that a novice knows where full names come from. Add a one-line comment above `STATE_NAMES` that says: "Full state names (e.g. Pennsylvania) for labels and tooltips. Keyed by two-letter code."

### ULTRA-15.4 Comment — STATE_340B

> So that a novice knows where state law data lives. Add a one-line comment above `STATE_340B` that says: "State-by-state 340B data: year enacted (y), PBM (pbm), contract pharmacy (cp), and notes. Update when new state laws pass; used by the map and state lists."

### ULTRA-15.5 Comment — STATES_WITH_PROTECTION

> So that a novice knows this is derived. Add a one-line comment above `STATES_WITH_PROTECTION` that says: "List of state codes that have contract pharmacy protection (cp === true). Computed from STATE_340B; used for filters and counts."

### ULTRA-15.6 Comment — copy object inside CONFIG

> So that a novice knows where to edit copy. Add a one-line comment above the `copy` object inside CONFIG that says: "copy: all user-facing text (overview, HAP position, methodology, executive strip). Change these when you want to update the message without touching HTML."

### ULTRA-15.7 Comment — mapAspectRatio and mapMaxWidth

> So that a novice can adjust map size. Add a one-line comment above mapAspectRatio and mapMaxWidth in CONFIG that says: "Map size: aspect ratio and max width in pixels. Used when the map is drawn so it fits the container."

### ULTRA-15.8 Comment — countUpDuration and dominoDelayPerState

> So that a novice can adjust animation speed. Add a one-line comment above the animation settings in CONFIG that says: "Animation: count-up duration (ms) and delay between state chips. Used by 340b.js for the number animation and optional chip stagger."

### ULTRA-15.9 Comment — printDefaultState

> So that a novice knows why PA is default for print. Add a one-line comment above printDefaultState and printDefaultStateReason that says: "When the user has not selected a state, print/PDF shows this state (e.g. PA) as the focal example."

### ULTRA-15.10 Comment — shareUrlBase

> So that a novice knows where the share link comes from. Add a one-line comment above shareUrlBase that says: "Base URL for the share link. Must match where the dashboard is hosted so copied links work."

---

## ULTRA v16 — 10 Prompts (Novice Refactor: Labels and Comments — 340b.html)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-16.1 HTML comment — utility toolbar

> So that a novice can scan the HTML and find the toolbar. Add an HTML comment before the section that contains the utility toolbar (Print/PDF, Download PDF image, Share, Export SVG), e.g. "<!-- Utility toolbar: Print, PDF image, Share, Export SVG -->".

### ULTRA-16.2 HTML comment — main content start

> So that a novice can find the main content. Add an HTML comment before the `<main>` element that says "<!-- Main content: intro cards, map, state lists, methodology, KPI, supporting cards -->".

### ULTRA-16.3 HTML comment — intro section

> So that a novice can find the intro cards. Add an HTML comment before the intro section (What is 340B, HAP Position) that says "<!-- Intro: What is 340B and HAP Position cards -->".

### ULTRA-16.4 HTML comment — executive strip

> So that a novice can find the executive strip. Add an HTML comment before the executive proof strip (three horizontal cards) that says "<!-- Executive strip: policy priority, landscape, trust -->".

### ULTRA-16.5 HTML comment — map hero section

> So that a novice can find the map. Add an HTML comment before the section with id="state-laws" that says "<!-- Map hero: state map, selection summary, state lists, filter toggles -->".

### ULTRA-16.6 HTML comment — methodology

> So that a novice can find "About this data". Add an HTML comment before the details/methodology block that says "<!-- Methodology: About this data, source links, verification order -->".

### ULTRA-16.7 HTML comment — KPI strip

> So that a novice can find the key numbers. Add an HTML comment before the KPI strip that says "<!-- KPI strip: market share, community benefit, oversight, PA hospitals -->".

### ULTRA-16.8 HTML comment — supporting section

> So that a novice can find the supporting cards. Add an HTML comment before the supporting section (Why this matters, three cards) that says "<!-- Supporting section: eligibility, oversight, PA impact -->".

### ULTRA-16.9 HTML comment — community benefit and policy

> So that a novice can find community benefit and policy cards. Add an HTML comment before the community benefit card and the policy cards (Access, PA safeguards) that says "<!-- Community benefit and policy cards -->".

### ULTRA-16.10 HTML comment — footer

> So that a novice can find the footer. Add an HTML comment before the footer that says "<!-- Footer: back link, contact, org name -->".

---

## ULTRA v17 — 10 Prompts (Novice Refactor: Simplify — 340b.js Patterns)

*For daily refactoring and learning. Do not change behavior; only split or rename for clarity. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-17.1 Split one long function — part 1

> So that a novice can follow one idea per function. Find one function in 340b.js that is long (e.g. over 30 lines) or does two distinct things. Split it into two smaller functions with clear names and add a one-line comment above each. Do not change what the page does.

### ULTRA-17.2 Split one long function — part 2

> So that the codebase has more small, named steps. Pick another function in 340b.js that does two things (e.g. "fetch data and then update DOM"). Extract the second part into a separate function and call it from the first. Add a one-line comment for each. Do not change behavior.

### ULTRA-17.3 Name a helper clearly

> So that a novice knows what a helper does from its name. Find one function or variable in 340b.js with a vague name (e.g. "handleClick" or "data"). Rename it to describe what it does or holds (e.g. "updateSelectionSummary" or "selectedStateData"). Add a one-line comment if the name alone is not enough.

### ULTRA-17.4 Add a one-line "why" comment

> So that non-obvious logic is explained. Find one place in 340b.js where the code does something that is not obvious (e.g. a delay, a fallback, or a special case). Add a single-line comment above it that says why (e.g. "Wait for map to paint before capture so PDF includes the full map.").

### ULTRA-17.5 Reduce nesting in one block

> So that a novice can read the code without deep indentation. Find one block in 340b.js with nested if/callback (3 or more levels). Restructure it so there is at most one level of nesting (e.g. early return or extracted helper). Do not change behavior.

### ULTRA-17.6 Group related logic with a comment

> So that a novice can see where one "story" starts and ends. Find a stretch of 5–10 lines in 340b.js that do one logical thing (e.g. "prepare print payload"). Add a comment block above it like "/* Prepare print payload: ... */" so the block is labeled.

### ULTRA-17.7 Document a magic number

> So that a novice knows why a number is there. Find one magic number in 340b.js (e.g. 800, 25, 2). Add a one-line comment that says what it is (e.g. "Delay in ms before PDF capture so map can render") or replace it with a named constant and comment the constant.

### ULTRA-17.8 One concern per small function

> So that each function does one thing. Pick one function in 340b.js that both builds data and updates the DOM. Split into two functions: one that returns the data, one that takes the data and updates the DOM. Call the first from the second. Add one-line comments. Do not change behavior.

### ULTRA-17.9 Clarify an event handler

> So that a novice knows what triggers the code. Find one event listener in 340b.js (click, load, etc.). Add a one-line comment above it that says when it runs (e.g. "When the user clicks Clear selection, clear the selected state and update the summary.").

### ULTRA-17.10 Consistent naming in one area

> So that a novice is not confused by mixed styles. Pick one area in 340b.js (e.g. PDF capture or state selection). If some variables use different naming (e.g. "pdf" vs "pdfDoc"), make them consistent and add a one-line comment for the main variable in that area.

---

## ULTRA v18 — 10 Prompts (Novice Refactor: Simplify — CSS and Design Tokens)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-18.1 Replace one raw color with a token

> So that colors stay consistent and easy to change. In 340b.css, find one place that uses a raw hex color (e.g. #ddd or #333) that is not already in :root. Replace it with an existing :root variable or add a new one and use it. Add a short comment (e.g. "Muted border for cards").

### ULTRA-18.2 Replace one magic number with a variable

> So that spacing is consistent. In 340b.css, find one place that uses a raw number for margin, padding, or gap (e.g. 1.5rem or 24px) that could use an existing --space-* or similar variable. Replace it and add a one-line comment if needed.

### ULTRA-18.3 Label a complex selector

> So that a novice knows what a selector is for. Find one selector in 340b.css that is long or targets a specific component. Add a short comment above it that says what it styles (e.g. "State list grid: chips wrap, gap between items").

### ULTRA-18.4 Group related selectors with a comment

> So that a novice can scan the file. Find a block of 3–5 rules that all affect the same part of the page (e.g. map container). Add a comment above the block like "/* Map container: size and legend */".

### ULTRA-18.5 Document a breakpoint

> So that a novice knows why a media query exists. Find one @media block in 340b.css. Add a one-line comment that says what breakpoint it is and what it changes (e.g. "At 768px and up: two-column layout for cards").

### ULTRA-18.6 Replace a second raw color

> So that the stylesheet uses tokens. Find another raw color in 340b.css (not the one you fixed in 18.1) and replace it with a :root variable. Add a short comment.

### ULTRA-18.7 Name a print-specific override

> So that a novice knows why a rule is in @media print. Find one rule inside @media print that overrides a screen style. Add a one-line comment that says what it overrides and why (e.g. "Hide toolbar in print so only content appears").

### ULTRA-18.8 Consolidate duplicate values

> So that one value is defined once. Find two rules in 340b.css that use the same value (e.g. the same border-radius or font-size). If they mean the same thing, replace both with one :root variable and use it in both places. Add a short comment.

### ULTRA-18.9 Comment a non-obvious !important

> So that a novice knows why !important is there. Find one use of !important in 340b.css. Add a one-line comment that explains why it is needed (e.g. "Override inline style from JS during PDF capture").

### ULTRA-18.10 Section summary at top of @media print

> So that a novice knows what the print block does. At the top of the @media print block, add or update a 2–3 line comment that lists: (1) global scaling (e.g. font-size 75%), (2) map max height, (3) what is hidden or shown only in print.

---

## ULTRA v19 — 10 Prompts (Novice Refactor: Documentation and Glossary)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-19.1–19.10 Glossary and documentation

> Add or extend a Glossary in REFACTORING-CODEBASE-MANUAL.md (or NOVICE-MAINTAINER.md) with one-sentence definitions for: CONFIG, state-data.js, print snapshot, count-up, map wrap, methodology, DOM, FIPS, hap340bPrint, scroll-reveal. See REFACTORING-CODEBASE-MANUAL.md Glossary section; ensure each term is defined for a novice.

---

## ULTRA v20 — 10 Prompts (Novice Refactor: Export and Reuse)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md) section 8 and Reuse checklist.*

### ULTRA-20.1–20.10 Reuse checklist

> In REFACTORING-CODEBASE-MANUAL.md (or REUSE.md), add and maintain: files to copy, what to rename, what to keep as-is, data shape, script order, print view dependency, minimal template, common pitfalls, link from NOVICE-MAINTAINER. See the Reuse checklist in the manual; run one item per day if refining the checklist.

---

## ULTRA v21 — 10 Prompts (Novice Refactor: Learning Aids and Inline Explanations)

*For daily refactoring and learning. See [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-21.1–21.10 Learning aids

> In 340b.js add top-of-file or inline comments that explain: count-up, preparePrintSnapshot, where the map is drawn, why we poll for the map, why we finalize count-up before capture, PDF page breaks, scale 2 for html2canvas, what runTaskSafely catches, hash sync, filter buttons. One prompt per topic; see v21 in full in the plan for individual task text.

---

## ULTRA v22 — 10 Prompts (Novice Refactor: Daily Refactor Workflow and Safety)

*For daily refactoring and learning. See [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md) and [REFACTORING-CODEBASE-MANUAL.md](REFACTORING-CODEBASE-MANUAL.md).*

### ULTRA-22.1–22.10 Daily refactor workflow

> Ensure DAILY-IMPROVEMENT.md has: Novice refactor (daily learning) subsection, link to REFACTORING-CODEBASE-MANUAL, step 1 option for v13–v22, safety (test after each prompt, audit after each wave, one prompt per day), handoff (last refactor date, wave completion checklist), and that ULTRA Usage and the manual cross-link. Run one prompt per day from v13–v22; after each wave run audit and print gate.
