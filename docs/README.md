# 340B Dashboard — Architecture Overview

**New to this project?** Read **[INDEX.md](INDEX.md)** first — it links to the maintainer guide, data updates, glossary, and config locations.

- **[INDEX.md](INDEX.md)** — Documentation navigation (“start here” hub)
- **[GLOSSARY.md](../GLOSSARY.md)** — Terms used in code and docs
- **[CONFIG-INDEX.md](../CONFIG-INDEX.md)** — Where each setting lives (state-data, config/, data/)

This folder holds operational and reference documentation for the 340B Advocacy Dashboard. For day-to-day edits, see the root [README.md](../README.md) and [NOVICE-MAINTAINER.md](../NOVICE-MAINTAINER.md).

- **[OPERATIONS_MANUAL.md](OPERATIONS_MANUAL.md)** — Step-by-step: adding data, updating charts/UI, republishing, self-update waves, and multi-agent runs.
- **[PROMPTS.md](PROMPTS.md)** — Ultra prompts and self-upgrade workflow (waves, self_update.js).
- **[MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md)** — 10 agents, wave runner, cross-validation, and CEO audit.
- **[SECURITY.md](SECURITY.md)** — Short pointer to root security notes and code patterns.

## Project structure (Wave 1+)

```
340b-dashboard/
├── config/           # Dashboard settings, chart options
│   ├── settings.js   # Map, features, a11y, performance
│   └── chart-configs.js  # KPI/chart display defaults
├── data/             # Dataset metadata, provenance, optional raw export
│   ├── dataset-metadata.js
│   ├── raw-data.json # Optional machine-readable snapshot (sync from state-data.js)
│   └── archive/     # upgrade-log.json (self-update records); optional backups
├── analytics/        # Data validation and trend computations
│   ├── validate-data.js
│   └── policy-insights.js
├── ui/               # UI component docs; main files stay at root for GitHub Pages
│   └── README.md
├── docs/             # Operations and reference
│   ├── README.md
│   ├── OPERATIONS_MANUAL.md
│   ├── PROMPTS.md    # Ultra prompts & self-upgrade workflow
│   └── SECURITY.md
├── self_upgrade/     # Self-improvement wave system
│   ├── ultra_prompts.json  # Wave definitions and prompts (10 waves, agent map)
│   └── self_update.js      # Node script: status, record wave, validate
├── agents/           # Multi-agent system (10 agents + orchestrator)
│   ├── shared.js          # Proposal schema, scoring, readProjectFile
│   ├── agent-01-data-integrity.js … agent-10-ceo-auditor.js
│   └── run-waves.js       # Run waves, collect proposals, run Agent 9 & 10, log
├── modules/          # Simulators (isolated); see [modules/README.md](../modules/README.md)
│   ├── pa-impact-data.js, pa-impact-engine.js, pa-impact-ui.js  # PA Impact Mode
│   ├── impact-data.js, impact-simulator.js, impact-ui.js        # Policy Impact Simulator
├── 340b.html         # Main dashboard (entry point)
├── 340b.css
├── 340b.js
├── state-data.js     # CONFIG, STATE_340B, STATE_NAMES
├── print.html
├── print-view.css
└── assets/            # Vendor libs (D3, TopoJSON, map data)
```

## Data flow

- **state-data.js** — Single source for CONFIG (dates, copy) and STATE_340B (state law data). Loaded first.
- **data/dataset-metadata.js** — Provenance, version, methodology, sources. Used by the “About Data” panel and validation.
- **config/settings.js** — Non-data settings (map tooltip delay, feature flags). Does not contain state law or KPI values.
- **analytics/validate-data.js** — Runs on load; checks STATE_340B vs STATE_NAMES and CONFIG vs DATASET_METADATA; logs warnings and can show a banner if issues are found.

## Updating data

1. Edit **state-data.js**: CONFIG.lastUpdated, CONFIG.dataFreshness, STATE_340B entries.
2. Edit **data/dataset-metadata.js**: lastUpdated, datasetVersion, methodology (keep in sync with state-data.js).
3. Run the dashboard and open the browser console; fix any validation warnings.
4. Use [DATA-UPDATE.md](../DATA-UPDATE.md) for step-by-step state law updates.

## Security

- All external links use `rel="noopener noreferrer"`.
- Print view does not assign unsanitized URL/params to innerHTML; map SVG comes from our own serialization with validation.
- See [SECURITY.md](../SECURITY.md) and [THREAT-MODEL.md](../THREAT-MODEL.md) in the repo root.
