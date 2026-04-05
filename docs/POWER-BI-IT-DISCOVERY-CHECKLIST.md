# Power BI + data warehouse — IT / data discovery checklist

Use this worksheet with **IT**, **data platform**, and **Strategic Analytics** before you build production Power BI content. Record answers in the **Decision log** at the bottom. This aligns with [HAP-POWER-BI-DATA-FACTORY-SPEC.md](HAP-POWER-BI-DATA-FACTORY-SPEC.md).

**Before your first working session:** read [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md) for the ordered **day-one** steps, Power Query notes, and the IT email template.

---

## 1. Platform and connectivity

| # | Question | Your answer |
|---|----------|-------------|
| 1.1 | What is the **authoritative warehouse** (e.g. Fabric Lakehouse/Warehouse, Azure Synapse, Snowflake, Databricks SQL, SQL Server)? | |
| 1.2 | What **Power BI connector** should report authors use for that source? | |
| 1.3 | Is connectivity from Power BI **cloud** direct, via **private link**, or **on-premises data gateway**? | |
| 1.4 | Who provisions **credentials** (Key Vault, service principal, OAuth) and approves **least-privilege** access for the semantic model? | |

---

## 2. Refresh and performance policy

| # | Question | Your answer |
|---|----------|-------------|
| 2.1 | Org policy: **Import**, **DirectQuery**, **Dual**, or **Composite** for this dataset? | |
| 2.2 | Expected **refresh SLA** (e.g. nightly, hourly) and **failure alerting** owner? | |
| 2.3 | Maximum **model size** or **Premium/Fabric capacity** workspace assigned? | |

---

## 3. Curated data (Gold layer)

| # | Question | Your answer |
|---|----------|-------------|
| 3.1 | Do **approved tables or views** already exist for 340B / state law / advocacy KPIs? If yes, list **fully qualified names**. (Repo reference: `vw_pbi_*` in [../powerbi/gold-schema-reference.sql](../powerbi/gold-schema-reference.sql).) | |
| 3.1b | **Read-only** principal or AD group name granted to the report author: | |
| 3.2 | If not, who **owns the pipeline** (Bronze → Silver → Gold) and the **validation gates** per the data factory spec? | |
| 3.3 | What is the **system of record** for each metric class (state law flags, PA hospital counts, community benefit, HRSA audits, etc.)? | |

---

## 4. Security and governance

| # | Question | Your answer |
|---|----------|-------------|
| 4.1 | Is **row-level security (RLS)** required on any dimension or fact? Define roles. | |
| 4.2 | **Certified / promoted dataset** policy: who signs off before leadership-facing reports? | |
| 4.3 | **Sensitivity labels** or export restrictions for this workspace? | |

---

## 5. Report delivery

| # | Question | Your answer |
|---|----------|-------------|
| 5.1 | Target **Power BI workspace** name and **naming convention** for reports/datasets. | |
| 5.2 | Is **external embedding** (public or partner) in scope, or **internal only**? | |
| 5.3 | Standard **map visual** (Filled map, Shape map, Azure Maps) per org standards? | |

---

## 6. Optional: parity with static dashboard

| # | Question | Your answer |
|---|----------|-------------|
| 6.1 | Should numbers in Power BI **match** the public [340b.html](../340b.html) stack for the same **as-of date**? If yes, who approves **dual publishing** (Gold export → static) vs. retiring static KPIs? | |
| 6.2 | For dev-only prototyping, is **CSV export** from the dashboard ([buildDatasetCsv in 340b.js](../340b.js)) allowed, or must all dev use **sanitized warehouse dev** tables only? | |

---

## 7. JSON API for custom dashboard (Path A)

The custom HTML dashboard can consume warehouse data via a JSON API endpoint, keeping the existing design while pulling live data. See [WAREHOUSE-INTEGRATION-GUIDE.md](WAREHOUSE-INTEGRATION-GUIDE.md).

| # | Question | Your answer |
|---|----------|-------------|
| 7.1 | Can IT publish a **JSON API** (REST endpoint or scheduled file export) from the Gold tables? URL: | |
| 7.2 | What **auth method** does the endpoint use (Azure AD cookie, API key, none for internal)? | |
| 7.3 | **CORS policy** — can the HTML dashboard fetch from this endpoint from its hosting domain? | |
| 7.4 | Is there a **POST endpoint** for story submissions (`fact_story_submission`)? URL: | |
| 7.5 | What is the **update cadence** for the JSON data? (Drives the dashboard's polling interval) | |
| 7.6 | Does the JSON shape need to differ from `data/mock-api-response.json`, or can IT match it? | |

---

## Decision log

| Date | Decision | Owner |
|------|----------|-------|
| 2026-04-04 | Warehouse access granted to Jordan | VP Strategic Analytics |
| | | |

---

## Related docs

- [WAREHOUSE-INTEGRATION-GUIDE.md](WAREHOUSE-INTEGRATION-GUIDE.md) — all three connection paths (Path A/B/C)
- [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) — field mapping from `state-data.js` / `340b.js` to Gold tables  
- [POWER-BI-REPORT-BLUEPRINT.md](POWER-BI-REPORT-BLUEPRINT.md) — report layout and interactivity  
- [POWER-BI-PUBLISH-RUNBOOK.md](POWER-BI-PUBLISH-RUNBOOK.md) — publish, refresh, lineage  
- [../powerbi/README.md](../powerbi/README.md) — DAX, theme, SQL reference artifacts  
