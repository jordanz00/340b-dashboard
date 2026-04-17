# Jarvis — your project copilot (this repo)

**Jarvis** is how we refer to the AI assistant in Cursor when it follows the **always-on** rule `.cursor/rules/jarvis-supervisor-assistant.mdc`. It combines:

- **Supervisor discipline** — same gates as `.cursor/rules/multi-agent-supervisor.mdc` (semantic layer, security, compliance, cross-surface care). **Meta-Supervisor** (second-pass audit), digest template, phased roadmap, and PBI JSON envelope: that rule **§§12–16** and [powerbi/semantic-envelope-sample.json](powerbi/semantic-envelope-sample.json).  
- **Assistant behavior** — answers questions using the **actual repo**, cites files, and flags risks to your success.

Jarvis does not have a separate memory outside this workspace: it stays current by **reading and searching** the project when you ask.

---

## Quick map — where everything lives

| You want… | Start here |
|-----------|------------|
| **Full supervisor / agent docs** | [docs/SUPERVISOR-SYSTEM.md](docs/SUPERVISOR-SYSTEM.md) |
| **What each number on mobile means** | [docs/DATA-DICTIONARY.md](docs/DATA-DICTIONARY.md) |
| **Power BI / warehouse mapping** | [docs/POWER-BI-DATA-MODEL-MAPPING.md](docs/POWER-BI-DATA-MODEL-MAPPING.md), [powerbi/metric-registry.json](powerbi/metric-registry.json), [powerbi/semantic-layer-registry.json](powerbi/semantic-layer-registry.json) |
| **Data access (today → warehouse JSON)** | [modules/data-layer.js](modules/data-layer.js), [docs/WAREHOUSE-INTEGRATION-GUIDE.md](docs/WAREHOUSE-INTEGRATION-GUIDE.md), [config/settings.js](config/settings.js) (`warehouse`) |
| **Automated supervisor checks** | [modules/supervisor-checks.js](modules/supervisor-checks.js) — in browser: `SupervisorChecks.runAllChecks()` |
| **Security** | [SECURE-FORCE.md](SECURE-FORCE.md), [SECURITY.md](SECURITY.md) |
| **QA / release** | [QA-CHECKLIST.md](QA-CHECKLIST.md), `python3 dashboard-audit.py` |
| **Multi-agent waves (Node)** | [docs/MULTI_AGENT_SYSTEM.md](docs/MULTI_AGENT_SYSTEM.md), [agents/run-waves.js](agents/run-waves.js) |
| **Mobile app** | [340b-mobile.html](340b-mobile.html), [340b-mobile.js](340b-mobile.js) |
| **Desktop 340B** | [340b.html](340b.html), [340b.js](340b.js) |
| **IT-safe BASIC** | [340b-BASIC.html](340b-BASIC.html) — local scripts only |
| **Regulatory advocacy 2026 (PA DOH brief)** | [hap-regulatory-advocacy-2026/](hap-regulatory-advocacy-2026/) — `facts.js` + [README](hap-regulatory-advocacy-2026/README.md); **public deploy = its own repo/Pages**, not the 340B site |
| **Static data truth** | [state-data.js](state-data.js) |

---

## How to ask Jarvis for help

Good prompts:

- “Where is the PA delegation table populated?”  
- “What breaks if I change `hap-design-tokens.css`?”  
- “Does this metric have a MetricKey and registry entry?”  
- “Walk me through print/PDF flow from button to file.”  

Jarvis should **open or search** the repo instead of guessing—especially for **numbers, dates, and policy**.

---

## Optional: your own running notes

If you want a **human-maintained** “what I’m focused on this week” file, add something like `docs/PROJECT-PULSE.md` (you create it) and tell Jarvis: *“Read PROJECT-PULSE first.”* Jarvis will merge that with repo facts.

---

## Rules that shape Jarvis

- `jarvis-supervisor-assistant.mdc` — copilot + your success  
- `multi-agent-supervisor.mdc` — merge gates and agent roster  
- `hap-csuite-improvement-loop.mdc`, `hap-multi-dashboard-scope.mdc` — dashboard family scope  
- `secure-force-security.mdc`, `project-security-context.mdc` — security  

---

*Last updated: orientation file for the HAP 340B / multi-dashboard workspace.*
