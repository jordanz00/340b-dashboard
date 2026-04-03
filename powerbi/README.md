# Power BI artifacts (340B)

Supporting files for building an internal **Power BI** semantic model and report aligned with the static dashboard and [docs/HAP-POWER-BI-DATA-FACTORY-SPEC.md](../docs/HAP-POWER-BI-DATA-FACTORY-SPEC.md).

**Start here when clearance is pending:** [docs/POWER-BI-READINESS-PLAYBOOK.md](../docs/POWER-BI-READINESS-PLAYBOOK.md) — pre-work, first session after read-only access, parameters, website/embed notes, IT email template.

| File | Purpose |
|------|---------|
| [gold-schema-reference.sql](gold-schema-reference.sql) | Illustrative **Gold** DDL + optional **`vw_pbi_*`** views for read-only report authors |
| [metric-registry.json](metric-registry.json) | **`MetricKey`** ↔ static `DATA_DATES` / provenance labels for IT and DAX alignment |
| [measures-340b.dax](measures-340b.dax) | **DAX** measures to paste into Power BI Desktop (adjust table/column names) |
| [hap-340b-theme.json](hap-340b-theme.json) | **Report theme** (import via View → Themes → Browse for themes) |

**Docs**

- [docs/POWER-BI-READINESS-PLAYBOOK.md](../docs/POWER-BI-READINESS-PLAYBOOK.md) — **day-one readiness** (before/after warehouse access)  
- [docs/POWER-BI-IT-DISCOVERY-CHECKLIST.md](../docs/POWER-BI-IT-DISCOVERY-CHECKLIST.md) — questions for IT  
- [docs/POWER-BI-DATA-MODEL-MAPPING.md](../docs/POWER-BI-DATA-MODEL-MAPPING.md) — `state-data.js` / `340b.js` → Gold columns  
- [docs/POWER-BI-REPORT-BLUEPRINT.md](../docs/POWER-BI-REPORT-BLUEPRINT.md) — pages, visuals, interactivity  
- [docs/POWER-BI-PUBLISH-RUNBOOK.md](../docs/POWER-BI-PUBLISH-RUNBOOK.md) — publish, refresh, lineage  

**Workflow**

1. Follow the **readiness playbook** and complete the IT discovery checklist; obtain **approved** Gold table or **view** names (prefer `vw_pbi_*` if IT deploys them).  
2. In Power BI Desktop: **Get Data** → connect to those objects; set relationships (typically `gold_dim_state_law` standalone or linked to a conformed geography dim).  
3. Add measures from `measures-340b.dax` (rename tables to match); align `MetricKey` values with `metric-registry.json` and IT’s Gold load.  
4. Apply `hap-340b-theme.json`; build pages per the report blueprint.  
5. Follow the publish runbook before sharing broadly.

Do **not** use personal Excel files as the production source of truth; numbers must trace to the warehouse and validation pipeline. **Do not** commit warehouse passwords, connection strings, or service principal secrets to this repo.
