# Dashboard QA Checklist

Use this checklist before pushing dashboard changes.

## Automated audit

1. Run `python3 dashboard-audit.py`.
2. Confirm it exits without failures.
3. Run `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .` after security-sensitive changes.
4. Review and fix any real findings instead of suppressing them blindly.

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

## Print / PDF

1. Open print preview from the `Print / PDF` button.
2. Confirm KPI values show final numbers, not `0`.
3. Confirm the map is visible.
4. Confirm there are no unexpected blank pages.
5. Confirm the selected state summary prints when a state is selected.
6. Confirm the print header shows the title and last-updated date.

## Accessibility and fallback

1. Tab through the main controls and confirm focus is visible.
2. Press `Escape` after selecting a state and confirm the selection clears.
3. Confirm the share and print buttons still work if the map fails.
4. Confirm the fallback summary appears if map assets are unavailable.

## Content and maintenance

1. Confirm `dataFreshness`, `lastUpdated`, and `shareUrlBase` are correct in `state-data.js`.
2. Confirm source links are still valid and use `rel="noopener noreferrer"`.
3. Confirm `README.md`, `SECURITY.md`, and `DATA-UPDATE.md` still match the current behavior.
