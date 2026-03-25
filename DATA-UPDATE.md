# How to Update 340B State Data

When new state laws pass or data changes, edit **state-data.js**.

---

## Keep `state-data.js` and `340b.html` in sync

The full dashboard loads **state-data.js** as a file, but **340b.html** also contains an **inline copy** of `CONFIG`, `FIPS_TO_ABBR`, `STATE_NAMES`, and `STATE_340B` in the first `<script>` block so the page works when opened as `file://`.

**After editing [state-data.js](state-data.js):**

1. Copy the same values into the inline `<script>` block at the top of **[340b.html](340b.html)** (or use the same file content for `CONFIG`, lookup tables, and `STATE_340B`).
2. Update any **hard-coded counts** in `340b.html` that mirror state counts (e.g. key findings “21 / 29”, executive strip, `#protection-count`, `#no-protection-count`, print counts) so they match the new `cp: true` / `cp: false` totals.
3. For **BASIC-only** updates, you still use **state-data.js** for the map; edit narrative numbers in **[340b-BASIC.html](340b-BASIC.html)** only when those lines are static.

**Longer-term:** A build step could one day inject `state-data.js` into HTML—until then, treat **sync** as a manual step and document it in every data update.

---

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
