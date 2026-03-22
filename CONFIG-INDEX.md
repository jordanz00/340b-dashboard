# Configuration — Where Everything Lives

Use this when you need to change **settings** or **data** but are not sure which file to open. For term definitions, see [GLOSSARY.md](GLOSSARY.md).

---

## Quick reference

| What to change | File | Section / key |
|----------------|------|----------------|
| **Dates, share URL, intro copy, executive strip** | [state-data.js](state-data.js) | `CONFIG` (and `copy` inside it) |
| **State law per state** (protection, year, notes) | [state-data.js](state-data.js) | `STATE_340B` |
| **Map tooltip delay, feature flags** (count-up, scroll reveal, etc.) | [config/settings.js](config/settings.js) | `DASHBOARD_SETTINGS` |
| **KPI / chart display formats** | [config/chart-configs.js](config/chart-configs.js) | `CHART_CONFIG` |
| **Dataset provenance, version, methodology text** | [data/dataset-metadata.js](data/dataset-metadata.js) | `DATASET_METADATA` |
| **Multi-agent / self-upgrade archive paths** | [config.json](config.json) | `archive_path`, `ultra_prompt_wave_size`, etc. |

---

## When to edit each

### state-data.js
- **Do:** Update `CONFIG.lastUpdated`, `CONFIG.dataFreshness`, `CONFIG.shareUrlBase`, and any `CONFIG.copy` fields when messaging or dates change.
- **Do:** Update `STATE_340B` when a state law changes (see [DATA-UPDATE.md](DATA-UPDATE.md)).
- **Sync:** Keep [340b.html](340b.html) inline CONFIG fallback (first `<script>` block) in sync with `state-data.js` to avoid flash on load.
- **Don’t:** Put layout, colors, or button behavior here.

### config/settings.js
- **Do:** Toggle features (e.g. print PDF, share link) or tune map tooltip timing if the app loads it.
- **Don’t:** Put state law facts or KPI numbers here—those belong in `state-data.js` or `dataset-metadata.js`.

### config/chart-configs.js
- **Do:** Change how numbers are formatted (decimals, labels) for charts/KPIs that read this config.
- **Don’t:** Duplicate state data—keep `STATE_340B` as the single source for map law status.

### data/dataset-metadata.js
- **Do:** Update `lastUpdated`, `datasetVersion`, and methodology strings when you publish a data refresh.
- **Sync:** Align dates with `CONFIG` in `state-data.js`.

### config.json
- **Do:** Change when you run multi-agent waves or self-upgrade scripts (see [docs/OPERATIONS_MANUAL.md](docs/OPERATIONS_MANUAL.md)).
- **Not required** for normal dashboard content updates.

---

## See also

- [NOVICE-MAINTAINER.md](NOVICE-MAINTAINER.md) — full “what file to edit” table
- [docs/INDEX.md](docs/INDEX.md) — documentation navigation
