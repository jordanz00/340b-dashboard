# Ultra Prompts & Self-Upgrade Workflow

This document describes how the **self-upgrading ultra prompts** system works and how to run improvement waves.

---

## Overview

The dashboard uses a **wave-based self-improvement** system:

1. **ultra_prompts.json** (in `self_upgrade/`) defines ordered waves. Each wave has a set of prompts (tasks) and expected output files.
2. **self_update.js** (Node script) reads the prompts, shows the next wave to run, and records completed waves with a timestamp in `data/archive/upgrade-log.json`.
3. **You (or an AI assistant)** apply the changes described by each prompt; then you run the script to record that the wave is done.

Waves do **not** auto-edit files. They are instructions for maintainers or AI to execute. The script only tracks progress and validates structure.

---

## Running the self-update manager

From the project root:

```bash
# Show status and next wave
node self_upgrade/self_update.js

# After completing a wave (e.g. wave 2), record it
node self_upgrade/self_update.js --record-wave=2

# Validate that key files and prompts are in place
node self_upgrade/self_update.js --validate
```

---

## Wave order

Waves in `ultra_prompts.json` are ordered 1–6:

| Order | Wave | Focus |
|-------|------|--------|
| 1 | Architecture & Data Validation | Folders, metadata, About Data panel, validation |
| 2 | Analytics & Executive Metrics | Trends, benchmarks, executive summary |
| 3 | UX/UI & Interactivity | Filters, map, ranked table, responsive design |
| 4 | Performance & Security | Lazy load, sanitization, safe links, config |
| 5 | Self-Upgrading Ultra Prompts | This system: logging, versioning, backups |
| 6 | Documentation & Maintenance | README, OPERATIONS_MANUAL, PROMPTS, comments |

Run waves in order. After each wave:

1. Apply the prompts (edit files as described).
2. Test the dashboard (load in browser, run filters, print/PDF).
3. Run `node self_upgrade/self_update.js --record-wave=N` to log completion.
4. Optionally run `dashboard-audit.py` and fix any issues.

---

## Example self-improvement cycle

1. **Start:** `node self_upgrade/self_update.js` shows "Next wave: wave1 — Architecture & Data Validation".
2. **Do the work:** Ensure `config/`, `data/`, `analytics/`, `docs/`, `self_upgrade/` exist; validation runs; About Data panel shows metadata.
3. **Record:** `node self_upgrade/self_update.js --record-wave=1`.
4. **Next:** Script now shows "Next wave: wave2 — Analytics & Executive Metrics". Repeat.

---

## Log and backups

- **data/archive/upgrade-log.json** — Array of `{ waveId, waveName, description, timestamp }`. Append-only; do not edit by hand unless fixing a mistake.
- **data/archive/** — Optional: before a large wave, copy key files (e.g. `340b.js`, `state-data.js`) here with a date prefix for a simple backup. The self_update script does not create file backups automatically; use your own backup script or git.

---

## Extending prompts

To add a new wave or prompt:

1. Edit **self_upgrade/ultra_prompts.json**.
2. Add a new object to the `waves` array with `id`, `name`, `order`, `prompts` (array of strings), and `outputs` (array of file paths).
3. Keep `order` unique and sequential so "next wave" is clear.
4. Update this doc (PROMPTS.md) and **docs/OPERATIONS_MANUAL.md** if the workflow changes.

---

## Relation to ULTRA-prompts.md

The root **ULTRA-prompts.md** file contains a large set of detailed prompts (v01–v22) for print, accessibility, refactoring, and more. The **ultra_prompts.json** waves are a smaller, structured set that aligns with the executive upgrade plan (architecture → analytics → UX → performance → self-upgrade → docs). Use both as needed: **ultra_prompts.json** for the high-level wave checklist; **ULTRA-prompts.md** for granular tasks within a wave or for daily improvement.
