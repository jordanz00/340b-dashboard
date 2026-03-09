# HAP 340B Advocacy Dashboard

A single-page dashboard for lawmakers and hospital CEOs on the 340B Drug Pricing Program. Built for the Hospital and Healthsystem Association of Pennsylvania.

## Files

| File | Purpose |
|------|---------|
| `340b.html` | Main page structure and content |
| `340b.css` | All styling (design system, layout, components) |
| `340b.js` | Interactivity: map, filters, animations, buttons |
| `state-data.js` | **Edit this** for dates and state law data |
| `DATA-UPDATE.md` | Step-by-step guide to update state data |
| `NOVICE-MAINTAINER.md` | Short guide for a first-time maintainer |
| `QA-CHECKLIST.md` | Pre-push verification checklist |
| `dashboard-audit.py` | Lightweight self-audit for dashboard regressions |
| `THREAT-MODEL.md` | Static-site threat model and security boundaries |
| `AI-HANDOFF.md` | AI memory structure and project context |
| `assets/vendor/` | Local map libraries and U.S. atlas data |
| `SECURITY.md` | Static-host security and audit notes |

## Quick edits (beginner-friendly)

If you are new to this repo, use this rule:

- Change facts and dates in `state-data.js`
- Change high-salience intro or trust-copy defaults in `state-data.js`
- Change visible copy or section order in `340b.html`
- Change layout and print appearance in `340b.css`
- Change buttons, map behavior, filters, sharing, or print logic in `340b.js`

### Update dates
Open `state-data.js` and change:
- `dataFreshness` — e.g. `"March 2026"`
- `lastUpdated` — e.g. `"March 2026"`
- `shareUrlBase` — if the public dashboard URL changes
- `copy` — if the intro, HAP ask, source summary, or executive-scan wording needs to change

### Update state law data
When a new state passes 340B protection:
1. Open `state-data.js`
2. Find the state in `STATE_340B` (e.g. `PA: { y: null, pbm: false, cp: false, notes: "In progress." }`)
3. Change `cp: true` if they now have contract pharmacy protection
4. Update `y` (year), `pbm`, and `notes` as needed

See **DATA-UPDATE.md** for full instructions.

## Running locally

Open `340b.html` in a browser, or use a simple server:

```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve
```

Then visit `http://localhost:8000/340b.html`

Do not test only from the file browser if you are checking interactive behavior. Use a local server so the dashboard behaves more like the hosted site.

## Dependencies

- Local copies of D3, TopoJSON Client, and U.S. Atlas data in `assets/vendor/`
- System fonts only for privacy and simpler hosting

No package install is required for the dashboard itself.

## Features

- Interactive US map (click states for details)
- State list buttons sync with map and detail panel
- Filter states by `All`, `Protection`, or `No protection`
- Keyboard navigation
- Share link (copies a canonical URL with selected state hash)
- Print / PDF with a final-state print snapshot
- Executive scan strip with policy, national, and trust cues
- Selected-state summary near the map
- Selected-state map context that tightens the story when a state is chosen
- Local map fallback summary if the map cannot load
- Hash deep-links like `#state-PA`
- Responsive (mobile-friendly)

## Security and hosting

- See `SECURITY.md` for recommended static-host headers and audit checks.
- See `THREAT-MODEL.md` for the current security boundaries and highest-risk surfaces.
- Vendor asset provenance is recorded in `assets/vendor/README.md`.

## Highest-risk surfaces

If you are deciding where to be most careful, use this order:

1. print/PDF preparation and page flow
2. high-salience copy, source dates, and legal-status wording
3. URL hash state and selection recovery
4. share-link behavior and fallback copy
5. map rendering and local vendor assets

## Maintenance workflow

Use this order to keep the project easy to maintain:

1. Update content in `state-data.js` or structure in `340b.html`.
2. Update behavior in `340b.js` only if the change is interactive.
3. If the change affects layout or print appearance, check `340b.css` before editing JavaScript.
4. Open the dashboard locally and test the exact feature you changed.
5. Open `Print / PDF` and confirm the PDF-only reader still sees the real intro cards, the map, final metric values, and Pennsylvania as the default print context when no state is selected live.
6. Run `python3 dashboard-audit.py`.
7. Use `QA-CHECKLIST.md`.
8. For deeper static analysis after security-sensitive changes, run `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .`.
9. Publish only after the manual print and source checks pass.

If the dashboard or PDF would confuse a lawmaker, hospital CEO, or hospital administrator, treat that as a release blocker.

## Common fixes

### If print preview is wrong

Check these files in this order:

1. `340b.html` — confirm the real intro cards still exist and there is no duplicate print-only copy.
2. `340b.css` — check the `@media print` section for anything hiding content, causing page breaks, or making print-only summaries too large.
3. `340b.js` — check `preparePrintSnapshot()`, `preparePrintSelectionState()`, `updateExecutiveProofStrip()`, `updateMapContext()`, and `finalizeCountUpValues()`.

### If source guidance needs updating

Check these files in this order:

1. `340b.html` in the `About this data` section
2. `state-data.js` for dates, executive-scan copy, and legal-status notes
3. `QA-CHECKLIST.md` for release verification wording

### If the map is missing

Check these files in this order:

1. `assets/vendor/states-10m.js`
2. `340b.html` script tags
3. `340b.js` function `drawMap()`

### If a button stopped working

Check these files in this order:

1. `340b.html` for the button `id`
2. `340b.js` for the related `init...` function
3. browser console warnings
