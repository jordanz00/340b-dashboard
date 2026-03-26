# 50 Improvements — Agent Template

Run this template in Cursor Agent mode to implement the 50 new improvements for the HAP 340B dashboard. Each batch (A–E) contains 10 self-contained prompts.

---

## Master Prompt (Agent Mode)

> **Context:** This is the HAP 340B Advocacy Dashboard (340b.html, 340b.css, 340b.js, print.html, state-data.js). Read [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) for file roles.
>
> **Task:** Run the next batch of improvements (A, B, C, D, or E). Implement each item in that batch. After each batch: run `python3 dashboard-audit.py`, fix any failures, update the handoff in ULTRA-prompts.md, and optionally commit. Do not edit ULTRA-prompts.md or 340b-dashboard-prompts.md content; only update run status and summaries.

---

## Pre-Flight Checklist

Before running any batch:

1. Read [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) — understand which files to edit
2. Run `python3 dashboard-audit.py` — confirm baseline passes
3. Confirm Print/PDF preview works — no blank pages, map visible

---

## Post-Flight Checklist (After Each Batch)

1. Run `python3 dashboard-audit.py` — fix any failures
2. Update [ULTRA-prompts.md](ULTRA-prompts.md) — mark wave as run, add short summary
3. Update [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md) — set "Last improvement" date
4. Optional: Commit with message `Agent Batch X: [summary]`

---

## Execution Order

Run batches in order: **A → B → C → D → E** (or specify a single batch).

| Batch | Domain              | Status |
|-------|---------------------|--------|
| A     | SEO & Discoverability | —      |
| B     | Performance & Security | —    |
| C     | UX & Loading States | —      |
| D     | Accessibility & Robustness | — |
| E     | Analytics & Data    | —      |

---

## Batch A: SEO, Social, and Discoverability (10 items)

**Files:** `340b.html`, `print.html`

1. **Canonical URL** — Add `<link rel="canonical" href="https://jordanz00.github.io/340b-dashboard/340b.html">` in head.
2. **og:image dimensions** — Use 1200×630 image or set `og:image:width`/`og:image:height` to match actual image.
3. **JSON-LD** — Add `application/ld+json` script with WebPage or Organization schema.
4. **og:locale** — Add `<meta property="og:locale" content="en_US">`.
5. **print.html robots** — Add `robots: noindex, nofollow` for print-only page.
6. **Breadcrumb schema** — Add structured data for breadcrumb navigation.
7. **FAQ schema** — Add if methodology has Q&A structure.
8. **theme-color** — Extend existing meta for mobile browsers.
9. **apple-touch-icon** — Add 192×192 and 512×512 favicon sizes.
10. **Meta generator** — Remove or hide in production.

---

## Batch B: Performance, Security, and Resilience (10 items)

**Files:** `340b.html`, `340b.css`, `340b.js`, `print.html`

1. **Script defer** — Add `defer` to D3/TopoJSON/states scripts or load after DOM ready.
2. **Preload LCP** — Add `<link rel="preload" href="haplogo_box_blue.jpeg" as="image">` for header logo.
3. **Map CLS** — Reserve space with `aspect-ratio` or `min-height` on `.map-wrap`.
4. **SRI** — Add `integrity` and `crossorigin="anonymous"` for html2canvas and jsPDF.
5. **Local vendor** — Prefer local copies in `assets/vendor/` per project rules.
6. **font-display** — Add `font-display: swap` for any custom fonts.
7. **Image dimensions** — Add `width`/`height` to all images to avoid CLS.
8. **localStorage try/catch** — Wrap print flow `localStorage` in try/catch for quota/disabled.
9. **print.html SVG** — Sanitize or use DOMParser for map SVG injection.
10. **CSP** — Restrict `script-src` if switching to local scripts.

---

## Batch C: UX, Loading States, and Responsive (10 items)

**Files:** `340b.css`, `340b.js`, `print.html`

1. **Print/PDF loading** — Show "Preparing…" until print view opens.
2. **Download PDF loading** — Already shows "Creating PDF…"; verify disabled during capture.
3. **Share loading** — Verify "Copying…"/"Sharing…" feedback is clear.
4. **Export SVG loading** — Brief feedback during serialization.
5. **print.html viewport** — Add `viewport-fit=cover` for notched devices.
6. **Utility toolbar 320px** — Verify all buttons wrap at ~320px.
7. **State chips 320px** — Validate no overflow in `.state-list-grid`.
8. **Executive strip breakpoint** — Add intermediate breakpoint at 900px if needed.
9. **Map 320px** — Validate map container readable at 320px.
10. **Count-up skeleton** — Optional placeholder to avoid number jump.

---

## Batch D: Accessibility, Errors, and Robustness (10 items)

**Files:** `340b.html`, `340b.css`, `340b.js`

1. **window.onerror** — Add global handler with minimal "Something went wrong" message.
2. **onunhandledrejection** — Handle async failures (share, clipboard).
3. **Share .catch()** — Ensure fallback always runs with clear instructions.
4. **aria-busy** — Map container during load.
5. **Skip-link focus** — Verify visibility and keyboard flow.
6. **Link focus** — Add underline on focus for keyboard navigation.
7. **Touch tooltips** — Disable hover tooltips on touch devices; use detail panel.
8. **navigator.share fallback** — Ensure robust clipboard fallback.
9. **PDF timeout** — Add idle/long-running op timeout for capture.
10. **Observers teardown** — Dispose observers and listeners to avoid memory leaks.

---

## Batch E: Analytics, Data, and Maintainability (10 items)

**Files:** `state-data.js`, `340b.js`, `NOVICE-MAINTAINER.md`

1. **data-event** — Add attributes on utility buttons (share, print, export).
2. **HAP340B.track** — Add `window.HAP340B?.track(eventName, payload)` stub.
3. **Fire events** — State selection, filter change, share, print, export SVG.
4. **Event catalog** — Define `state_selected`, `filter_changed`, `share_success`, etc.
5. **Payload schema** — Document analytics event shape.
6. **i18n layer** — Add `strings` object in `state-data.js`.
7. **data-i18n** — Use config for copy to enable future translation.
8. **State validation** — Warn on missing keys: `cp`, `pbm`, `y`, `notes`.
9. **NOVICE-MAINTAINER** — Document network vs offline features.
10. **Analytics guard** — Use `if (window.HAP340B?.analytics)` before firing.

---

## Cross-References

- [ULTRA-prompts.md](ULTRA-prompts.md) — v08–v12 align with batches A–E
- [340b-dashboard-prompts.md](340b-dashboard-prompts.md) — Prompts v08 for full task text
- [DAILY-IMPROVEMENT.md](DAILY-IMPROVEMENT.md) — Workflow and level-up
- [AGENT-RULES-SYSTEM.md](AGENT-RULES-SYSTEM.md) — Rules, update workflow, release gate
