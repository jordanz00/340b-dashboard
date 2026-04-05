# Multi-Agent Supervisor System — Full Documentation

**What this file is:** The complete reference for the HAP 340B Multi-Agent Supervisor System running in Cursor with Opus 4.6. It explains every agent, every review gate, and how code goes from idea to merge-ready.

**Who this is for:** Anyone working on the 340B dashboard — developers, data analysts, advocacy staff, or someone new to the project.

---

## How the Supervisor System Works (Plain English)

Think of the supervisor as a **quality control manager** in a factory. Every piece of code that gets written goes through an inspection line. Different specialists check different things:

1. **Is the code easy for a beginner to read?** (Novice Guide agent)
2. **Will it connect to Power BI later?** (Semantic Layer agent)
3. **Are the 340B facts correct?** (Compliance agent)
4. **Is it secure?** (Security agent)
5. **Is it fast?** (Performance agent)
6. **Does it break anything else?** (Cross-Surface agent)

Only when ALL specialists approve does the code get the green light.

### Efficient reviews (summary-first)

To save time and tokens, the supervisor rule also defines a **summary-first protocol**: review **metadata and modular gates** (data → semantic layer → compliance → code → QA) before asking for full file dumps. See **§11** in [../.cursor/rules/multi-agent-supervisor.mdc](../.cursor/rules/multi-agent-supervisor.mdc) — including **data-verification buckets (§11f)**, **workflow checks for maps / charts / story form / PDF / AI helpers (§11g)**, and **compliance wording (§11h)**. Default feedback format: **✔ / ⚠ / ❌**, **VERDICT**, and **Sources**; long explanations only for warnings and failures.

**Meta-Supervisor, digest, roadmap, PBI envelope:** The same rule adds **§12** (Meta-Supervisor second pass), **§13** (module digest table), **§14** (semantic JSON contract + valid key names), **§15** (phased roadmap — honest about static vs future API), and **§16** (professional features vs current scope). Example machine-readable payload: [../powerbi/semantic-envelope-sample.json](../powerbi/semantic-envelope-sample.json).

---

## Six-role model (stakeholder view)

Some briefings describe **six agents** instead of the full tier table. They map to this repo as follows:

| Stakeholder role | Responsibility | Maps to agent ID(s) |
|------------------|----------------|---------------------|
| **Data** | Validates figures against `state-data.js` / sources; semantic keys, registries | **D1**, **B1**, **PBI1** |
| **Frontend** | Web + mobile UI, maps, charts, story forms, print/PDF surfaces | **F1**, **F2**; messaging **A1**, narrative **CR1**, motion **P1** |
| **Backend** | JSON APIs, warehouse-shaped responses, audit logs *(Phase 3 — not a live server in this repo today)* | **B1** now (`DataLayer`, Promises, Gold-shaped stubs); future IT endpoints |
| **Compliance** | PA 340B accuracy, terminology, safeguards language | **C1** |
| **Novice-friendly** | Comments, module headers, discoverability | **N1** |
| **Supervisor** | Final gate, digest, low-token summaries | Cursor rule + [agents/supervisor_agent.md](../agents/supervisor_agent.md) |

**Security (S1)** and **QA (Q1)** still apply to **every** change—call them out in digest **Notes** or extend the table when needed.

**Digest templates** in the rule: **§13a** (Supervisor / Meta-Supervisor columns) and **§13b** (Module × Data | Frontend | Backend | Compliance | Novice).

**Data rule of thumb:** No invented statistics. Tracked placeholders in [powerbi/semantic-layer-registry.json](../powerbi/semantic-layer-registry.json) must carry an honest `validationStatus` (see rule **§14a**).

---

## Agent Roster

### Tier 1: Always Active (every change)

| Agent ID | Name | What It Checks |
|----------|------|---------------|
| **N1** | Novice Guide | Are there clear comments? Can a beginner understand this? Are variable names descriptive? |
| **S1** | Security | No unsafe DOM, no secrets, hash validation, safe inputs |
| **Q1** | QA / Testing | Does it break existing features? Cross-browser OK? Print OK? |

### Tier 2: Data & Compliance (data/JSON/copy changes)

| Agent ID | Name | What It Checks |
|----------|------|---------------|
| **D1** | Data Analyst | Are all JSON keys documented? MetricKeys assigned? Data Dictionary updated? |
| **PBI1** | Power BI Readiness | Does the data shape match Gold tables? DAX measures still work? |
| **C1** | Compliance | Do stats match HAP fact sheets and HRSA sources? Terminology correct? |

### Tier 3: UI & Experience (visual/interaction changes)

| Agent ID | Name | What It Checks |
|----------|------|---------------|
| **F1** | Frontend / UI | Charts render, cards display, map works, responsive layout |
| **F2** | Mobile / UX | Touch targets >= 44px, smooth scroll, proper tab navigation |
| **A1** | Advocacy Strategist | Messaging on-brand, "Why it matters" present, legislator language correct |
| **CR1** | Creative | Story form UX, visual storytelling quality, impact narratives |
| **P1** | Performance | No layout thrashing, passive scroll handlers, efficient animations |

### Tier 4: Coordination (cross-cutting changes)

| Agent ID | Name | What It Checks |
|----------|------|---------------|
| **B1** | Data Layer | DataLayer methods correct, async-ready, matching Gold schema |
| **AI1** | AI Integration | ai-helpers.js modular, works offline, future-proof for LLM |
| **PM1** | Project Manager | Cross-surface blast radius, merge readiness, documentation current |

---

## Review Gate Flow

```
Code Change Proposed
        │
        ▼
┌─────────────────┐
│ Gate 1: Novice   │ ← Can a beginner understand this?
│ Readability (N1) │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Gate 2: Semantic │ ← Is every data point mapped to Power BI?
│ Layer (D1+PBI1)  │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Gate 3: PA 340B  │ ← Are facts correct? Sources cited?
│ Compliance (C1)  │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Gate 4: Security │ ← Safe DOM? No secrets? Hash validated?
│ (S1)             │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Gate 5: Perf     │ ← No layout thrash? Animations efficient?
│ (P1)             │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Gate 6: Cross-   │ ← Does it break other dashboards?
│ Surface (PM1)    │
└────────┬────────┘
         │ PASS
         ▼
┌─────────────────┐
│ Gate 7: PBI      │ ← Warehouse-ready? Registry updated?
│ Readiness (PBI1) │
└────────┬────────┘
         │ PASS
         ▼
   ┌──────────┐
   │ APPROVED │
   │ (Merge)  │
   └──────────┘
```

If ANY gate fails → **NEEDS REVISION** with specific instructions.

---

## Semantic Layer: What It Is and Why It Matters

### The Problem
The dashboard currently uses hard-coded numbers in HTML and JavaScript. When HAP eventually connects to Power BI (a data visualization tool from Microsoft), every number needs to have a clear "address" in the data warehouse so Power BI knows where to find it.

### The Solution
Every number, chart, table, and form field gets a **MetricKey** — a unique name like `PA_HOSPITALS_340B_COUNT` — and a mapping that says "this number lives in this warehouse table, in this column."

### Where It's Tracked

| File | What It Contains |
|------|-----------------|
| `powerbi/metric-registry.json` | Master list of MetricKeys with their sources and Gold column mappings |
| `powerbi/semantic-layer-registry.json` | Every placeholder, chart field, and form field with its warehouse mapping |
| `docs/DATA-DICTIONARY.md` | Plain-English explanation of every data point |
| `docs/POWER-BI-DATA-MODEL-MAPPING.md` | Technical mapping from static code to Gold tables |

### The Rule
**No data point may appear in the UI without a corresponding entry in the semantic layer registry.** The supervisor enforces this on every change.

---

## How Agents Communicate

Agents leave structured comments in code when they identify work:

```javascript
// AGENT[D1]: New metric 'PA_RURAL_HOSPITAL_PCT' — add to metric-registry.json
// AGENT[C1]: Verify 38% rural stat against HAP March 2026 fact sheet
// AGENT[N1]: Add JSDoc header to this function
// AGENT[PBI1]: Map 'referralSource' field to fact_story_submission.ReferralSource
// AGENT[S1]: Validate this hash input before using in DOM query
```

These comments are actionable — they tell you exactly what to fix and which file needs updating.

---

## Power BI Readiness Milestones

These milestones track how close the dashboard is to being "plug and play" with Power BI:

| # | Milestone | What It Means | Status |
|---|-----------|--------------|--------|
| 1 | All KPIs have MetricKeys | Every number on screen has a unique identifier | Verify |
| 2 | DataLayer matches Gold schema | The code's data methods return data in the same shape the warehouse will | Verify |
| 3 | Semantic registry complete | Every placeholder/chart/form tracked | In Progress |
| 4 | Story form → fact_story_submission | Form output matches the database table design | Verify |
| 5 | Chart configs use MetricKeys | Charts reference data by MetricKey, not hard-coded values | Partial |
| 6 | DATA-DICTIONARY.md complete | Every field explained in plain English | Verify |
| 7 | Gold DDL matches static shape | Database table definitions match the data structure | Verify |
| 8 | DAX measures verified | Power BI formulas produce same numbers as static dashboard | Verify |
| 9 | IT discovery answers collected | HAP IT team has answered the readiness questions | Pending IT |
| 10 | PBI theme uses HAP tokens | Power BI reports look like the dashboard (same colors, fonts) | Verify |

---

## What the Supervisor Does on Every Change

1. **Identifies** which agents need to review (based on files changed)
2. **Runs** each agent's checklist mentally
3. **Reports** any failures with specific fix instructions
4. **Updates** the semantic layer registry if new data points are introduced
5. **Verifies** cross-surface impact (does this break BASIC? print? OW?)
6. **Produces** a merge readiness summary:

```
SUPERVISOR MERGE CHECK:
├── N1  Novice Readability .......... PASS
├── D1  Semantic Layer .............. PASS
├── C1  PA 340B Compliance .......... PASS
├── S1  Security .................... PASS
├── P1  Performance ................. PASS
├── PM1 Cross-Surface ............... PASS
├── PBI1 Power BI Readiness ......... PASS
├── Q1  QA / No Regressions ......... PASS
└── VERDICT: APPROVED
```

---

## Quick Reference: Agent Tags

Use these tags when requesting specific agent review or flagging issues:

| Tag | Meaning |
|-----|---------|
| `AGENT[N1]` | Needs novice-friendly comments or explanations |
| `AGENT[D1]` | Needs semantic layer / data dictionary update |
| `AGENT[C1]` | Needs 340B compliance verification |
| `AGENT[S1]` | Needs security review |
| `AGENT[P1]` | Needs performance review |
| `AGENT[F1]` | Needs frontend/UI review |
| `AGENT[F2]` | Needs mobile/UX review |
| `AGENT[A1]` | Needs advocacy messaging review |
| `AGENT[AI1]` | Needs AI helper review |
| `AGENT[B1]` | Needs data layer review |
| `AGENT[PBI1]` | Needs Power BI readiness check |
| `AGENT[Q1]` | Needs QA/testing |
| `AGENT[CR1]` | Needs creative/storytelling review |
| `AGENT[PM1]` | Needs cross-surface coordination |

---

## Related Documents

- [../JARVIS.md](../JARVIS.md) — **Jarvis** copilot orientation (always-on assistant + supervisor in Cursor)
- [../.cursor/rules/jarvis-supervisor-assistant.mdc](../.cursor/rules/jarvis-supervisor-assistant.mdc) — Jarvis always-on rule
- [MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md) — The existing 10-agent wave system (runs via Node.js)
- [DATA-DICTIONARY.md](DATA-DICTIONARY.md) — Plain-English data field guide
- [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) — Static-to-Gold mapping
- [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md) — Step-by-step PBI onboarding
- [../powerbi/metric-registry.json](../powerbi/metric-registry.json) — MetricKey registry
- [../powerbi/semantic-layer-registry.json](../powerbi/semantic-layer-registry.json) — Full placeholder/chart/form registry
- [NOVICE-CODE-TOUR.md](NOVICE-CODE-TOUR.md) — Guided walkthrough for beginners
- [../.cursor/rules/multi-agent-supervisor.mdc](../.cursor/rules/multi-agent-supervisor.mdc) — The Cursor rule that enforces this system
