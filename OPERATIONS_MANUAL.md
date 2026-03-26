# 340B Dashboard — Operations Manual

**Full manual:** [docs/OPERATIONS_MANUAL.md](docs/OPERATIONS_MANUAL.md)

This file is the root entry point. All step-by-step instructions, data updates, chart/UI updates, republishing, self-update waves, and multi-agent runs are in **docs/OPERATIONS_MANUAL.md**.

Quick reference:
- **Data:** Edit state-data.js and data/dataset-metadata.js; see docs/OPERATIONS_MANUAL.md §1.
- **Charts/UI:** 340b.html, 340b.css, 340b.js, config/settings.js; see §2.
- **Publish:** Commit, push, verify live URL; see §3.
- **Security/HTTPS:** See docs/OPERATIONS_MANUAL.md §4 and docs/SECURITY.md.
- **Change log:** docs/CHECK_CHECK_CHUCK.rtf (files modified, version, agent notes).
- **Self-update:** `node self_upgrade/self_update.js`; see §5.
- **Agents:** `node agents/run-waves.js`; see §6. Config: **config.json**.
