# 340B Dashboard — Multi-Agent System

**10 specialized agents** propose improvements; **Agent 9** validates and approves; **Agent 10** scores the CEO experience.

## Quick start

Config (optional): **config.json** at project root — `archive_path`, `daily_update`, `ultra_prompt_wave_size`, `rules_per_wave`, `security_checks`. See docs/MULTI_AGENT_SYSTEM.md.

```bash
# From project root
node agents/run-waves.js           # Run all waves, write logs and approved-changes
node agents/run-waves.js --wave=3  # Run only wave 3 (agent_ui.js)
node agents/run-waves.js --dry-run # No file writes

# Single script that runs all 10 agents in sequence (data, metrics, UI, interactivity, security, performance, self-improvement, docs, validator, executive audit). Writes data/processed/state-data-snapshot.json, appends to ultra_prompts.json runLog, and writes data/archive/master-executor-summary-*.md and Executive_Summary_*.rtf.
node agents/master-executor.js

# 100x run: 12 agents, generates data/processed/state-data.json, CHECK_CHECK_CHUCK.rtf, and appends run to OPERATIONS_MANUAL.md.
node agents/run-100x.js
```

## Agents

| # | File | Role |
|---|------|------|
| 1 | agent_data.js | Data validation, metadata sync, downloadable datasets |
| 2 | agent_metrics.js | CEO metrics, executive summary, state/trend comparisons |
| 3 | agent_ui.js | UX/UI, design tokens, print, accessibility |
| 4 | agent_interactivity.js | Filters, tooltips, ranked table, responsive |
| 5 | agent_security.js | Sanitization, safe links, XSS checks |
| 6 | agent_performance.js | DOM cache, lazy-load, throttle |
| 7 | agent_self_improvement.js | ultra_prompts, versioning, daily cycles |
| 8 | agent_doc.js | README, OPERATIONS_MANUAL, PROMPTS, SECURITY |
| 9 | agent_validator.js | Compare proposals, resolve conflicts, approve |
| 10 | agent_executive_audit.js | Score clarity, polish, decision-readiness |

## Outputs

- **data/archive/agents/run-&lt;timestamp&gt;.json** — Full run log
- **data/archive/approved-changes-&lt;timestamp&gt;.json** — Approved proposals to apply
- **data/archive/executive-summary-&lt;timestamp&gt;.txt** — Executive summary

See [docs/MULTI_AGENT_SYSTEM.md](../docs/MULTI_AGENT_SYSTEM.md) for full documentation.

## Cross-checks and “departments”

- Agents **1–8** each contribute **proposals** from their specialty (data, UI, security, …).  
- **Agent 9** compares **all** proposals, resolves conflicts, and approves by score — that is how one subagent’s output is checked against the rest.  
- **Agent 10** scores CEO-facing quality.  
- Re-run **`node agents/run-waves.js`** after substantive edits so feedback reflects the latest tree.

Optional (unrelated to dashboard code review): **`python3 agents/orchestrator.py`** — HAP org-chart simulation / CSV export for leadership routing exercises, not a substitute for the Node agents above.
