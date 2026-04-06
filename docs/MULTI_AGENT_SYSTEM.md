# Multi-Agent System — 340B Dashboard

The dashboard uses **10 specialized agents** that run in waves to propose improvements. **Agent 9 (Cross-Validator)** compares all proposals, resolves conflicts, and approves changes by score. **Agent 10 (CEO Auditor)** scores the executive experience. Proposals are logged; approved ones are written to `data/archive/` for review and application.

---

## Agent roles

| Wave | Agent | Responsibility |
|------|--------|-----------------|
| 1 | **Data Integrity & Validation** | Validate STATE_340B, STATE_NAMES, CONFIG; metadata and timestamps; suggest sync and normalization |
| 2 | **Executive Metrics & Insights** | Key CEO metrics ($7.95B, 72 PA hospitals, 7%); executive summaries; state/trend comparisons |
| 3 | **UX/UI & Visual Design** | Readability, contrast, typography; layout for executive scanning; cards, map, chart aesthetics |
| 4 | **Interactivity & Analytics** | Filters, hover tooltips, ranked table; responsiveness; new visualizations |
| 5 | **Security & Data Safety** | Sanitize dynamic content; safe JSON; external links (noopener); XSS prevention; log issues |
| 6 | **Performance & Optimization** | DOM caching; lazy-load; refactor for maintainability; throttle resize |
| 7 | **Self-Improvement Manager** | Read ultra_prompts.json; versioning; upgrade logs; data/archive |
| 8 | **Documentation & Maintenance** | OPERATIONS_MANUAL, README, PROMPTS, SECURITY; inline comments |
| 9 | **Cross-Agent Validator** | Compare all proposals; resolve conflicts; score by executive impact, maintainability, security, performance; approve before integration |
| 10 | **CEO Executive Experience Auditor** | Simulate executive use; score clarity, polish, decision-readiness; suggest refinements |

---

## Running the agents

From the project root (Node.js required):

**Configuration:** Optional **config.json** at project root:

- `daily_update` — when true, self-improvement agent logs that daily cycles are enabled
- `max_agents` — 10
- `ultra_prompt_wave_size` — 10 (prompts per wave)
- `rules_per_wave` — 10
- `archive_path` — `data/archive` (agent logs and approved-changes)
- `maintainer_level` — `novice`
- `security_checks` — `["XSS", "input_sanitization", "link_validation"]`

```bash
# Run all waves (agents 1–8, then 9, then 10); writes logs and approved-changes to data/archive/
node agents/run-waves.js

# Run a single wave (e.g. wave 3 = agent_ui.js)
node agents/run-waves.js --wave=3

# Dry run: no files written, only stdout
node agents/run-waves.js --dry-run
```

**Execution order:** Waves 1–8 run in sequence; each agent reads project files and outputs **proposals** (suggested changes with target file, description, scores). All proposals are collected and passed to **Agent 9**, which resolves conflicts and ranks by weighted score (executive impact 35%, maintainability 25%, security 20%, performance 20%). **Agent 10** then runs to produce the CEO experience score and any final suggestions.

---

## Outputs

- **data/archive/agents/run-&lt;timestamp&gt;.json** — Full run: proposals per wave, validator report, auditor score.
- **data/archive/approved-changes-&lt;timestamp&gt;.json** — Approved proposals only; use this to apply changes (manually or via tooling).
- **data/archive/executive-summary-&lt;timestamp&gt;.txt** — Short executive summary: proposal count, approved count, CEO score, next steps.

---

## Competition and collaboration

- Agents **propose independently**; they do not edit files. Each proposal includes scores (executive impact, maintainability, security, performance).
- **Agent 9** compares all proposals. When two proposals target the same file and change type, the one with the higher weighted score wins; the other is recorded in `conflictWith`.
- **Winning proposals** are written to `approved-changes-*.json`. Maintainers (or an AI) can apply them in order. The system is **competitive** in that only the best-scoring proposal wins per conflict, and **collaborative** in that all agents contribute to the same pool.

### Parallel work and continuous feedback

- **Within one run**, waves 1–8 execute in order so the log is deterministic; each wave is still a separate “subagent” with its own proposal set.
- **Across runs**, you get continuous feedback by re-running `node agents/run-waves.js` after changes; Agent 9 always reconciles the **full** new proposal pool.
- **Parallelism:** You can run **separate terminals** with `node agents/run-waves.js --wave=N` for different waves while iterating, then run a full `run-waves.js` (or rely on Agent 9 in a full run) to merge and validate everything together.
- **Human / org “departments”:** Use Cursor with **`.cursor/rules/multi-agent-supervisor.mdc`** (and Jarvis) so advocacy, compliance, data, and IT-style gates are applied on top of the Node agents — not via extra Python “fake role” scripts.

---

## Adding new prompts and versioning

- **ultra_prompts.json** defines the 10 waves and their prompts. The **Self-Improvement Manager (Agent 7)** checks that this file exists and has enough waves.
- To add new prompts: edit **self_upgrade/ultra_prompts.json** (add to a wave’s `prompts` array or add a wave). Run the agents again; Agent 7 will validate the structure.
- Versioning: use **data/dataset-metadata.js** `datasetVersion` and **data/archive/upgrade-log.json** (via `self_upgrade/self_update.js --record-wave=N`) to track which waves have been applied. Agent run logs are timestamped in **data/archive/agents/**.

---

## Maintenance

- **agents/shared.js** — Proposal schema, scoring weights, `readProjectFile`, `weightedScore`. Used by all agents.
- **agents/agent-0X-*.js** — Each agent exports `run(context)`. Context has `wave`, `projectRoot`, `timestamp`; for Agent 9, `context.allProposals` is the full list.
- **agents/run-waves.js** — Orchestrator: runs waves 1–8, collects proposals, runs 9 then 10, writes logs and approved-changes.

For step-by-step data/UI updates and republishing, see [OPERATIONS_MANUAL.md](OPERATIONS_MANUAL.md). For ultra prompts and self-update, see [PROMPTS.md](PROMPTS.md).
