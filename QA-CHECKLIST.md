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

## Print / PDF

1. Open print preview from the `Print / PDF` button.
2. Confirm the first page is not blank.
3. Confirm the print version uses the real intro cards with icons, not a duplicated text-only summary.
4. Confirm the `Overview` and `HAP Position` cards appear only once.
5. Confirm the print version includes the `About this data` summary and last-updated date.
6. Confirm KPI values show final numbers, not `0`.
7. Confirm Pennsylvania is selected by default in print when no live state is selected.
8. Confirm the map is visible.
9. Confirm the compact print state summary is readable and does not consume a full page.
10. Confirm there are no unexpected blank pages anywhere in the document.
11. Confirm the selected state summary prints when a state is selected.
12. Confirm the print header shows the title and last-updated date.
13. Confirm the executive scan strip still reads clearly in print and does not bloat the opening pages.

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
