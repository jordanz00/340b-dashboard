# Consolidated Action Plan

## qa_report.md

# QA Report

## Core functionality

- PASS: `340b.html` exists
- PASS: `340b.css` exists
- PASS: `340b.js` exists
- PASS: `state-data.js` exists
- PASS: `print.html` exists
- PASS: `print-view.css` exists

## Audit script
```
340B dashboard audit
====================
PASS: No unsafe DOM or inline-handler patterns found in dashboard source files
PASS: No hidden zero-width or BOM characters found in dashboard source files
PASS: All external target="_blank" links in app HTML files use rel="noopener noreferrer"
PASS: App entry pages include CSP and referrer hardening
PASS: print.html has CSP and does not use innerHTML for payload
PASS: print-view.css has print regression guards
FAIL: 340b.html still references remote font or script infrastructure
PASS: No stale removed-feature copy found in core dashboard files
PASS: 340b.css has @media print with font-size and map max-height
PASS: 340b.html includes the expected print header, live intro cards, and source summary structure
PASS: Prompt library contains v09 through v70 sections plus alternate track

Manual checks still required
===========================
- Open Print / PDF and confirm the document fits in exactly 2 pages with no excessive white space.
- Confirm page 1: header, intro cards, executive strip, map, selection summary, state detail.
- Confirm page 2: state summary, trends, KPIs, supporting cards, community benefit, access, PA safeguards, methodology, sources.
- Confirm Pennsylvania prints as the default state context when no live state is selected.
- Confirm the PDF looks polished and pharma/CEO presentable.
- Verify source dates and source links still match the current law and reporting data.
- Re-read the PDF and dashboard copy for lawmakers, hospital CEOs, and administrators before release.
- Confirm invalid #state-XX in URL (e.g. #state-XY) shows empty selection and no console error.

```

**Overall:** FAIL (see audit output)

---

## security_report.md

# Security Report

- PASS: `340b.html` has CSP
- PASS: `print.html` has CSP
- PASS: print.html no unsafe innerHTML sources

Run `python3 dashboard-audit.py` for full security checks.

---

## accessibility_report.md

# Accessibility Report

- PASS: Skip to main content
- PASS: Skip map link
- PASS: aria-atomic on state panel
- PASS: Policy nav target (id=policy)
- PASS: skip-link focus-visible
- PASS: Touch targets 44px

Manual: Tab through map, test reduced-motion, check contrast.

---

## data_report.md

# Data Report

- PASS: state-data.js exists
- PASS: CONFIG present
- PASS: STATE_340B present
- Dates/freshness refs: 5

Manual: Verify dataFreshness and lastUpdated match current release.

---

## performance_report.md

# Performance Report

- PASS: Logo preload
- PASS: fetchpriority on logo

Manual: Run Lighthouse; ensure map draws after viewport.

---

## stakeholder_report.md

# Stakeholder Report

- PASS: KPIs present (7%, $7.95B, 200+, 72)
- PASS: Print/PDF flow documented
- PASS: State filters (All / Protection / No protection)

Manual: Have 2–3 executives try Print/PDF and filters; capture feedback.

---

## Suggested order of fixes
1. Security (CSP, innerHTML)
2. QA (audit failures)
3. Accessibility (skip-map, touch targets)
4. Data (stale dates)
5. Performance (preload)
6. Stakeholder (manual testing)