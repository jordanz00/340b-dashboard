# How to Update 340B State Data

When new state laws pass or data changes, edit **state-data.js**.

## Quick steps

1. Open `state-data.js`
2. Find the state in `STATE_340B` (e.g., `PA: { y: null, pbm: false, cp: false, notes: "In progress." }`)
3. Update the values:
   - **y** — Year the law was enacted (or `null` if no law)
   - **pbm** — `true` if PBM protections exist
   - **cp** — `true` if contract pharmacy protection exists
   - **notes** — Short note (e.g., "Upheld in court.", "Hybrid 2025.")
4. Save the file. `STATES_WITH_PROTECTION` updates automatically from `cp: true` states.

## Adding a new state

If a state is missing from `STATE_340B`, add a line like:

```javascript
XX: { y: 2025, pbm: true, cp: true, notes: "Your note here." },
```

## Updating dates

In `CONFIG`, change:
- `dataFreshness` — Shown in the KPI strip
- `lastUpdated` — Shown in methodology
- `shareUrlBase` — Public URL used by the Share button

## Data sources

- MultiState: https://www.multistate.us/
- ASHP: https://www.ashp.org/
- America's Essential Hospitals: https://essentialhospitals.org/
