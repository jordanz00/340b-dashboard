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