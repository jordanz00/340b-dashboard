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

### Update dates
Open `state-data.js` and change:
- `dataFreshness` — e.g. `"March 2026"`
- `lastUpdated` — e.g. `"March 2026"`
- `shareUrlBase` — if the public dashboard URL changes

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
- Selected-state summary near the map
- Local map fallback summary if the map cannot load
- Hash deep-links like `#state-PA`
- Responsive (mobile-friendly)

## Security and hosting

- See `SECURITY.md` for recommended static-host headers and audit checks.
- See `THREAT-MODEL.md` for the current security boundaries and highest-risk surfaces.
- Vendor asset provenance is recorded in `assets/vendor/README.md`.

## Maintenance workflow

- Use `NOVICE-MAINTAINER.md` for file-by-file editing guidance.
- Use `QA-CHECKLIST.md` before pushing updates.
- Run `python3 dashboard-audit.py` after meaningful code or content changes.
- For deeper static analysis, run `HOME="$PWD" ./.venv-semgrep/bin/semgrep --config auto .`
