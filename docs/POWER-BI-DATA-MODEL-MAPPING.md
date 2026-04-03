# Power BI Gold layer — mapping from static 340B dashboard

This document maps **today’s static sources** to the **logical Gold tables** described in [HAP-POWER-BI-DATA-FACTORY-SPEC.md](HAP-POWER-BI-DATA-FACTORY-SPEC.md) §4. Physical table and column names are **owned by IT**; adjust connectors and DAX to match what they publish.

**Rule:** Values in production Power BI must come from **warehouse columns** with documented lineage—not from retyping HTML or this doc.

---

## 1. State law and map dimensions → `dim_state_law` (logical)

| Static source | Location | Gold column (suggested) | Type / notes |
|---------------|----------|-------------------------|--------------|
| State code | `STATE_340B` keys (e.g. `PA`) | `StateCode` | `CHAR(2)` or `VARCHAR(2)`; allowlist US + DC per policy |
| State name | `STATE_NAMES[abbr]` | `StateName` | `NVARCHAR` |
| FIPS (map joins) | `FIPS_TO_ABBR` | `StateFips` | Optional; integer or string; join to map topo if used in PBI |
| Contract pharmacy protection | `STATE_340B[abbr].cp` | `ContractPharmacyProtected` | `BIT` / boolean |
| PBM-related law | `STATE_340B[abbr].pbm` | `PBMProtected` or `HasPbmLaw` | `BIT` (name per SME) |
| Year enacted | `STATE_340B[abbr].y` | `YearEnacted` | `INT` nullable |
| Notes | `STATE_340B[abbr].notes` | `Notes` | `NVARCHAR`; approved text only |
| Row version / hash | (pipeline) | `RowHash`, `SourceSystem`, `ExtractedAt` | Per data factory spec |

**Derived in app today (mirror in DAX or as warehouse columns):**

| Logic | Static reference | Power BI approach |
|--------|------------------|-------------------|
| “States with protection” | `STATES_WITH_PROTECTION` in [state-data.js](../state-data.js) | Measure: count distinct `StateCode` where `ContractPharmacyProtected = TRUE` |
| 50-state headline counts | [340b.js](../340b.js) excludes D.C. from some chip totals | Add `IncludeInFiftyStateHeadline BIT` or filter `StateCode <> "DC"` in measures—**confirm with Advocacy** |

**CSV export parity:** [340b.js](../340b.js) `buildDatasetCsv()` columns map as:

| CSV header | Gold field |
|------------|------------|
| State | `StateName` |
| Abbr | `StateCode` |
| Contract Pharmacy | `ContractPharmacyProtected` (Yes/No → bit in DB) |
| Year Enacted | `YearEnacted` |
| PBM | `PBMProtected` (Yes/No → bit) |
| Notes | `Notes` |

---

## 2. Headline KPIs and stat cards → `fact_dashboard_kpi` (logical)

These appear as **numbers in** [340b.html](../340b.html) (`data-count-up`) and **provenance labels** in [340b.js](../340b.js) `DATA_DATES`. Each needs a **MetricKey** agreed with Strategic Analytics and a **source citation** in the warehouse.

| UI context (illustrative) | Suggested `MetricKey` | `DATA_DATES` key (provenance label) | Notes |
|---------------------------|----------------------|--------------------------------------|--------|
| PA hospitals (340B) | `PA_HOSPITALS_340B_COUNT` | `paHospitals` | Integer; source per org |
| States with contract pharmacy protection | `US_STATES_CP_PROTECTION_COUNT` | `stateLaws` | Often derived from `dim_state_law`; may still be stored as KPI for audit |
| States without (50-state framing) | `US_STATES_NO_CP_PROTECTION_COUNT` | `stateLaws` | Same; confirm DC exclusion rules |
| Community benefit ($B) | `COMMUNITY_BENEFIT_TOTAL_BILLIONS` | `communityBenefit` | Numeric + unit |
| Drug market share % (340B) | `OUTPATIENT_SHARE_PCT` | `outpatientShare` | HAP Mar 2026 talking points cite Commonwealth Fund for 7% of total U.S. drug market (`metric-registry.json`) |
| HRSA audits (illustrative count) | `HRSA_AUDIT_COUNT` | `hrsaAudits` | Must match HRSA reporting extract |
| Other banner metrics (30%, 49%, 53%, etc.) | Define per SME | (varies) | Each gets its own key and citation |

**Suggested `fact_dashboard_kpi` columns** (align with spec §4):

| Column | Purpose |
|--------|---------|
| `MetricKey` | Stable key (snake_case or PascalCase per IT) |
| `ValueNumeric` | Primary value when numeric |
| `ValueText` | Text KPIs if any |
| `Unit` | e.g. `COUNT`, `PERCENT`, `USD_BILLIONS` |
| `AsOfDate` | Date grain for the value |
| `SourceCitation` | Short approved citation string |
| `LoadedAt` | Pipeline load timestamp |

---

## 3. Freshness and methodology → `dim_data_freshness` (logical)

| Static source | Location | Gold column (suggested) |
|---------------|----------|-------------------------|
| Dashboard “last updated” | `CONFIG.lastUpdated`, `CONFIG.dataFreshness` | `DisplayAsOf` or `DisplayAsOfText` |
| Dataset version | `data/dataset-metadata.js` (`DATASET_METADATA`) | `DatasetVersion` (optional row) |
| Methodology / limitations | `CONFIG.copy.sourcesLimitations`, verification order | `MethodologyText` — **approved copy only** |

Use a **single-row** or **DashboardKey** grain so report titles and cards can pull “Data as of …” from the model.

---

## 4. CONFIG copy (not facts)

`CONFIG.copy` in [state-data.js](../state-data.js) (HAP position bullets, overview lead, etc.) is **advocacy copy**, not warehouse facts.

| Delivery | Recommendation |
|----------|----------------|
| Power BI | Static text boxes or **approved** strings in a small `dim_report_copy` table if IT requires data-driven copy |
| Do not | Generate or infer policy text with LLMs in production datasets (per data factory spec §6) |

---

## 5. Bill tracker / federal banner

`PA_BILL_CONFIG` and `FEDERAL_BILL_CONFIG` in [340b.js](../340b.js) are **tracker** fields. If they appear in Power BI:

| Approach | When to use |
|----------|-------------|
| Separate `dim_legislative_tracker` (grain: jurisdiction × bill) | Multiple bills / history |
| Rows in `fact_dashboard_kpi` + text dimensions | Simple single-row “current bill” |

Lineage must trace to **legislative source** or internal tracker DB—not the JS file alone.

---

## 6. Trend / sparkline series

`TREND_DATA` in [340b.js](../340b.js) is labeled illustrative for the static executive sparklines. **Do not** assume those arrays are authoritative for Power BI unless the warehouse exposes the **same** time series from source.

| Static | Power BI |
|--------|----------|
| `TREND_DATA.communityBenefit`, `paHospitals`, etc. | Replace with `fact_metric_trend` (MetricKey, Year, Value) from pipeline if leadership needs trends |

---

## Related files

- [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md) — ordered steps when access is approved  
- [../powerbi/metric-registry.json](../powerbi/metric-registry.json) — `MetricKey` list aligned to `DATA_DATES` and KPI cards  
- [../powerbi/gold-schema-reference.sql](../powerbi/gold-schema-reference.sql) — illustrative DDL + `vw_pbi_*` consumer views  
- [../powerbi/measures-340b.dax](../powerbi/measures-340b.dax) — measures assuming logical names above  
- [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md)  
