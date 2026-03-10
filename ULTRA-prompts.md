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

## ULTRA v02 — 10 Prompts (Do Not Run Until Instructed)

*Await user instructions before running these prompts.*

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

2. **ULTRA v02** — await user instructions before running.

3. Each ULTRA wave improves on prior waves and targets the highest-impact areas.
