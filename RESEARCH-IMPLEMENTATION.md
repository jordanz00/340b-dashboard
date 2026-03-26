# Research Implementation Prompts

This file turns each finding from the 9 research agents (and the intended 10th) into **one runnable prompt**. Use it to implement findings **one at a time**: say "Run R1.1" or "Implement Research 1, prompt 1" and the agent will execute only that prompt.

**How to use:** Pick a prompt by code (e.g. R1.1, R3.2). Ask the assistant to run that prompt. Do not batch; run one, test, then the next.

---

## Research 1 — Accessibility

| Code | Prompt |
|------|--------|
| **R1.1** | In 340b.html, add `aria-atomic="true"` to `#state-detail-panel` so screen readers announce the full panel when the selected state changes. |
| **R1.2** | Add a "Skip map" link or control immediately after the map container (in 340b.html) so keyboard users can skip the ~50 map tab stops and reach the state lists; or document in a comment that "Skip map" is a future improvement. |
| **R1.3** | Move `id="policy"` from the empty hidden div to the first visible policy section (e.g. the "Access to care" card or its heading) in 340b.html so the Policy nav link lands on real content. |
| **R1.4** | In 340b.css, add `.skip-link:focus-visible` with the same visible styles as `.skip-link:focus` so the skip link shows for keyboard focus where supported. |
| **R1.5** | In 340b.css or docs, add a one-line note or comment that primary, accent, and text-muted should meet WCAG AA (4.5:1 normal, 3:1 large); no code change required unless a contrast fix is needed. |

---

## Research 2 — Performance

| Code | Prompt |
|------|--------|
| **R2.1** | In 340b.html head, add `<link rel="preload" as="image" href="haplogo_box_blue.jpeg">` and add `fetchpriority="high"` to the header logo `<img>`. |
| **R2.2** | In 340b.html, add `defer` to 340b.js; load html2canvas and jspdf with `async` or document that they can be loaded dynamically on first "Download PDF (image)" click (implementation optional). |
| **R2.3** | In 340b.css, give the map SVG container (e.g. `.us-map-wrap` or `#us-map` wrapper) a fixed aspect-ratio or min-height so skeleton and final SVG reserve the same space and CLS is reduced. |
| **R2.4** | In 340b.html, move state-data.js and the three vendor scripts (D3, TopoJSON, states-10m) to end of body with `defer` so they don't block parsing; keep order so 340b.js runs after them. |
| **R2.5** | In 340b.js, defer calling drawMap() until the map section is near the viewport (e.g. when the map IntersectionObserver fires) instead of at init; document the change in a comment. |

---

## Research 3 — Security

| Code | Prompt |
|------|--------|
| **R3.1** | In print.html, remove the innerHTML fallbacks that set `mapContainer.innerHTML = payload.mapSvg` (lines ~214 and ~224); when parsing fails or root is not a single svg, show only a safe "Map not available" message and do not assign to innerHTML. |
| **R3.2** | In print.html head, add a Content-Security-Policy meta tag aligned with 340b.html (e.g. default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'). |
| **R3.3** | In 340b.html, add SRI hashes and crossorigin="anonymous" to the html2canvas and jspdf script tags, or add a comment that local vendor copies are preferred and document the CSP exception. |
| **R3.4** | In print.html getPayload/applyPayload, validate payload shape (e.g. typeof payload.mapSvg === 'string', allowlist of keys, optional max length for mapSvg) before use; treat invalid payload as no payload and do not set innerHTML. |
| **R3.5** | No change — hash validation is already correct in 340b.js; add a one-line comment above getHashState that invalid/unknown state codes are ignored. |

---

## Research 4 — Print / PDF reliability

| Code | Prompt |
|------|--------|
| **R4.1** | In 340b.js, add showMapWrapImmediately() at the start of preparePrintSnapshot() and add a short wait-for-map (poll for #us-map svg path[data-state]) before the first cloneMapForPrint() so the live printed page gets the map when it loads slowly; document the order in a comment. |
| **R4.2** | In print.html, wrap the full applyPayload(payload) body in try/catch; on catch show "Unable to load print data. Use Print / PDF from the dashboard again." and still call runPrint() after a short delay if ?auto=1. |
| **R4.3** | In 340b.js downloadPdfAsImage(), wrap the html2canvas call in Promise.race with a 15–20s timeout so if capture never resolves, the existing .catch() runs and shows "PDF capture failed. Try Print / PDF instead." |
| **R4.4** | In 340b.js, introduce shared constants for wait-for-map (initial delay, interval, max attempts) used by waitForMapThenOpen and waitForMapThenCapture, and add a one-line comment explaining the values. |
| **R4.5** | In print-view.css @media print, add a rule so the Community benefit section can start on a new page (e.g. page-break-before: always on the community-benefit section class) to match the PDF-image break, or document why it's not added. |

---

## Research 5 — Novice maintainability and docs

| Code | Prompt |
|------|--------|
| **R5.1** | In NOVICE-MAINTAINER.md Quick decision tree, add: "Print view page (content/layout of Print/PDF tab) → print.html and print-view.css" and "Share link or URL hash wrong → 340b.js." |
| **R5.2** | In REFACTORING-CODEBASE-MANUAL.md, add a sentence that 340b.html uses section comments only (no file-level CODE MAP) or add a short top-of-file comment in 340b.html listing: header → toolbar → main (intro, executive, map hero, state lists, KPI, supporting, community benefit, policy) → footer and which IDs 340b.js requires. |
| **R5.3** | In NOVICE-MAINTAINER.md Important print note, add: "For the Print/PDF button the flow is openPrintView() → localStorage → print.html. For File → Print on the main page the flow is beforeprint → preparePrintSnapshot()." Optionally add the same one-line comment above openPrintView in 340b.js. |
| **R5.4** | In NOVICE-MAINTAINER.md section for state-data.js, add: "For step-by-step instructions on updating state data or CONFIG, see DATA-UPDATE.md." |
| **R5.5** | In REFACTORING-CODEBASE-MANUAL Glossary (or NOVICE-MAINTAINER), add: "Print/PDF = new tab with print.html; Download PDF (image) = capture of main page with html2canvas." Add a sentence that invalid #state-XX hashes are ignored and selection stays empty, and optionally a one-line comment above getHashState in 340b.js. |

---

## Research 6 — UX and copy

| Code | Prompt |
|------|--------|
| **R6.1** | In 340b.js exportMapAsSvg(), before serializing, call setUtilityStatus("Preparing map download…") and clear it where "Map saved as SVG." or the early return runs. |
| **R6.2** | In 340b.js initShare(), in the navigator.share(...).catch() block, set a clear message (e.g. "Share cancelled." or "Link wasn't shared. Try Copy link below.") instead of setUtilityStatus(""). |
| **R6.3** | In 340b.js, replace the "Download PDF (image) requires html2canvas and jsPDF…" message with: "PDF download isn't available right now. Use 'Print / PDF' and choose Save as PDF in the print dialog." |
| **R6.4** | In 340b.js applyStateFilter(), when visibleCount === 0, set filter status to include a next step (e.g. "No states match this filter. Choose 'All' to see every state."); optionally update the state-no-results paragraph in 340b.html to match. |
| **R6.5** | In 340b.css, add min-height: 44px to .state-filter-btn for touch targets. |
| **R6.6** | Add visible selection status for sighted users: either remove sr-only from #state-selection-status and style it like .state-filter-status, or add a small visible "X selected" / "Selection cleared" line near the state detail panel and update it from announceSelection(). |

---

## Research 7 — Data layer and state

| Code | Prompt |
|------|--------|
| **R7.1** | In 340b.js, remove duplicated date and CONFIG strings from the fallback object; use a single minimal fallback (e.g. one "March 2025") and ensure all UI dates come from config.dataFreshness and config.lastUpdated. |
| **R7.2** | In state-data.js or 340b.js init, add a small startup check: every key in STATE_340B exists in STATE_NAMES (and map states in FIPS_TO_ABBR); log or warn on mismatch. |
| **R7.3** | In state-data.js, document or extend validateStateData so every state has all four keys and correct types; optionally normalize missing cp/pbm to false, y to null, notes to "" at load. |
| **R7.4** | In state-data.js, derive copy that includes dates from CONFIG (e.g. methodologyStateLaw uses CONFIG.lastUpdated) instead of hardcoding "March 2025" inside strings. |
| **R7.5** | In state-data.js or DATA-UPDATE.md, add a short "Data contract" section: CONFIG is single source for title/dates/copy; STATE_340B keys must match STATE_NAMES; entries must have { y, pbm, cp, notes }; 340b.js must not duplicate CONFIG or date literals. |

---

## Research 8 — Design system and CSS

| Code | Prompt |
|------|--------|
| **R8.1** | In 340b.css, replace .map-legend-swatch.no-protection background #cbd5e1 with var(--map-no-protection). |
| **R8.2** | In 340b.css @media print, replace the rule that sets a { color: #0066a1 } with a { color: var(--primary); }. |
| **R8.3** | In 340b.css :root, add --on-primary: #ffffff (or use --neutral-0) and use it for color on .map-tooltip, .state-list-tooltip, .map-retry-btn, .back-link, .skip-link, .footer-cta a. |
| **R8.4** | In 340b.css, add a comment after the CODE MAP listing breakpoints and intent (e.g. 480, 500, 600, 640, 700, 768, 900 and what each changes). |
| **R8.5** | In 340b.css, use tokens for .kpi-strip .kpi-card first two backgrounds and .kpi-card:hover box-shadow ring (e.g. var(--bg-card), var(--primary-muted)) instead of raw rgba. |

---

## Research 9 — Testing and audit (agent did not complete)

| Code | Prompt |
|------|--------|
| **R9.1** | Re-run the testing/audit research: review dashboard-audit.py and QA/manual checklists; list what is covered, what is missing (e.g. PDF image flow, hash validation, a11y), and 3–5 concrete improvements. |
| **R9.2** | After R9.1, add one new check to dashboard-audit.py (e.g. PDF image flow, or hash validation, or a11y) per the research findings. |
| **R9.3** | Update QA-CHECKLIST.md or NOVICE-MAINTAINER with any missing manual step that the research recommends. |

---

## Research 10 — Export and reuse

| Code | Prompt |
|------|--------|
| **R10.1** | In REFACTORING-CODEBASE-MANUAL or a new REUSE.md, add a "Print payload schema" section listing every key from getPrintViewPayload() and the corresponding print.html element id (e.g. selectionTitle → pv-selection-title, mapSvg → pv-map-container). |
| **R10.2** | Document the full set of DOM ids 340b.js depends on (from cacheDom() and other getElementById/querySelector usages) in the Reuse checklist or REUSE.md. |
| **R10.3** | In the Reuse checklist, add a "Minimal template" subsection: (a) file set for "map + state lists only" vs "map + print/PDF"; (b) scripts required for map vs optional for Download PDF (image); (c) which HTML sections can be omitted for a minimal clone. |
| **R10.4** | In the Reuse checklist, add an explicit "Print view dependency" subsection: print.html reads one localStorage key and expects the documented payload shape; payload or key changes require coordinated changes in 340b.js and print.html. |
| **R10.5** | In NOVICE-MAINTAINER.md, add a "Using this project as a template" or "Export and reuse" subsection that links to the Reuse checklist and to REUSE.md if created. Optionally create REUSE.md with the full checklist and payload schema. |

---

## Suggested implementation order

1. **Security first** — R3.1, R3.2, R3.4 (print.html innerHTML, CSP, payload validation).
2. **Print/PDF reliability** — R4.1, R4.2, R4.3, R4.4 (live print map wait, print.html try/catch, PDF timeout, shared constants).
3. **Accessibility** — R1.1, R1.3, R1.4 (aria-atomic, #policy target, skip-link focus-visible).
4. **Docs and novice clarity** — R5.1, R5.3, R5.4, R5.5 (decision tree, print flow clarification, DATA-UPDATE link, two-print glossary).
5. **UX and copy** — R6.1–R6.5 (loading messages, layman PDF message, filter empty state, filter button height).
6. **Performance** — R2.1, R2.3 (LCP preload, map aspect-ratio for CLS).
7. **Data layer** — R7.1, R7.4 (single source for dates, CONFIG-driven copy).
8. **Design system** — R8.1, R8.2, R8.5 (legend token, print link, KPI tokens).
9. **Reuse and template** — R10.1, R10.4, R10.5 (payload schema, print dependency subsection, NOVICE-MAINTAINER link).
10. **Testing/audit** — R9.1 then R9.2, R9.3 once research is re-run.

---

**Usage:** To implement one finding, say: *"Run R3.1"* or *"Implement Research 3 prompt 1."* Run one prompt at a time; test (and run audit/print gate if relevant); then run the next.
