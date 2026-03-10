# Dashboard QA Checklist

Use this checklist before pushing dashboard changes.

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
7. Open and close `About this data`.
8. Test `Share link`.
9. Test `Print / PDF`.
10. Confirm the executive scan strip updates correctly with the national state counts.
11. Confirm the map context sentence changes appropriately when a state is selected and resets when cleared.

## Print / PDF (mandatory release gate)

**Before any layout or print CSS change:** Run Print/PDF preview and confirm no regressions.

1. Open print preview from the `Print / PDF` button.
2. Confirm the document fits in **2–3 pages max** with no excessive white space.
3. Confirm **no blank pages** and **no half-empty pages**.
4. Confirm the map is **fully visible** (not cut off at bottom or sides).
5. Confirm page 1: header, intro cards, executive strip, map, selection summary, state detail.
6. Confirm page 2+: state lists, trends, KPIs, supporting cards, community benefit, access, PA safeguards, methodology, sources.
7. Confirm the print version uses the real intro cards with icons.
8. Confirm KPI values show final numbers, not `0`.
9. Confirm Pennsylvania is selected by default in print when no live state is selected.
10. Confirm the print header shows the title and last-updated date.
11. Confirm the PDF looks polished and pharma/CEO presentable.

**If regressions occur (blank pages, cut-off map, wrong scaling):** revert or fix before committing.

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
