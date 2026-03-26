# 340B Advocacy Dashboard – 100x Upgrade

Runbook for the 100x Upgrade (v2.0): agents, backup, and revert.

## Quick start

```bash
# 1. Backup current dashboard (do this before big changes)
python3 scripts/backup_dashboard.py

# 2. Run all agents and generate reports
python3 scripts/run_agents.py

# 3. Read consolidated plan
open reports/consolidated_action_plan.md
```

## Agents

| Agent | Role | Report |
|-------|------|--------|
| qa_agent | Map, filters, KPIs, PDF/export, responsive | `reports/qa_report.md` |
| security_agent | CSP, innerHTML, unsafe scripts | `reports/security_report.md` |
| accessibility_agent | Skip-map, touch targets, contrast, reduced-motion | `reports/accessibility_report.md` |
| data_agent | state-data.js stale/inconsistent data | `reports/data_report.md` |
| performance_agent | Preload, deferred scripts, images | `reports/performance_report.md` |
| stakeholder_agent | Executive UX, PDF readability, KPIs | `reports/stakeholder_report.md` |
| crosscheck_agent | Consolidate reports, prioritized action plan | `reports/consolidated_action_plan.md` |

Run a single agent:

```bash
python3 scripts/run_agents.py qa
python3 scripts/run_agents.py security
python3 scripts/run_agents.py a11y
python3 scripts/run_agents.py data
python3 scripts/run_agents.py perf
python3 scripts/run_agents.py stakeholder
python3 scripts/run_agents.py crosscheck
```

## Backup and revert

- **Backup:** `python3 scripts/backup_dashboard.py`  
  Creates `backup/dashboard_backup.zip` (340b.html, 340b.css, 340b.js, state-data.js, print.html, print-view.css, assets/).

- **Revert:** `python3 scripts/revert_dashboard.py`  
  Restores the dashboard from `backup/dashboard_backup.zip`.  
  You can also say **"revert back to formula"** and run the revert script.

**Suggested use:** Run backup at project start or before refactors; use revert if you need to undo changes.

## Config

Main config: `340b-100x-upgrade.yaml` (project name, version, agents, dashboard files, triggers).

## Triggers (manual)

- **On project start:** Run `scripts/backup_dashboard.py`, then `scripts/run_agents.py`.
- **On "revert back to formula":** Run `scripts/revert_dashboard.py`.

The "continuous_parallel_agents" loop (run agents every 10 min) is not implemented as a daemon; run `python3 scripts/run_agents.py` when you want a fresh set of reports.

## Modular refactor (optional)

The YAML references a modular layout (`dashboard/css/`, `dashboard/js/map.js`, etc.). The current codebase is single-file (340b.js, 340b.css). A full modular refactor is optional and would be a separate project; the agents and backup/revert work with the current structure.

## PDF export

PDF is generated in the browser via **Print / PDF** or **Download PDF (image)**. There is no server-side or Python PDF export; the scripts only check that the flow exists and is documented.
