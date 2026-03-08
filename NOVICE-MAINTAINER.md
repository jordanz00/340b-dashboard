# Novice Maintainer Notes

If you only remember three files, remember these:

## 1. `state-data.js`

This is the main update file.

Edit this when you need to change:

- dates
- share URL
- state law records

## 2. `340b.html`

This is the page structure and content.

Edit this when you need to change:

- visible copy
- headings
- sections
- source links

## 3. `340b.js`

This is the interaction file.

Edit this when you need to change:

- map behavior
- button behavior
- filters
- print/share logic

## Important rules

- Do not edit files inside `assets/vendor/` unless you are intentionally updating vendor assets.
- If you change dates or state data, test print preview before publishing.
- If a button stops working, check `340b.js` first and look for a console warning.
- If the map fails, other buttons should still work. Keep that behavior.
- Use `QA-CHECKLIST.md` before pushing changes.
- Run `python3 dashboard-audit.py` after meaningful edits so the project checks for common regressions.
- Read `THREAT-MODEL.md` before making security-related changes or adding any remote service, auth flow, or external script.
