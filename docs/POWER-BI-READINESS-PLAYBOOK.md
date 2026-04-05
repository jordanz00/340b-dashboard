# Power BI readiness playbook — 340B dashboard

**Purpose:** Use this **before** and **immediately after** IT grants project approval and **read-only** warehouse access. It ties the static advocacy stack (`state-data.js`, `340b.html`, `340b.js`) to the org-standard **Gold → semantic model → report** path described in [HAP-POWER-BI-DATA-FACTORY-SPEC.md](HAP-POWER-BI-DATA-FACTORY-SPEC.md).

**Rule:** Do not put **passwords**, connection strings, or service principal secrets in this repo. Store credentials in **IT-approved** locations (Key Vault, Power BI data source credentials, gateway configuration).

---

## 1. What “ready” means

| Layer | Ready when… |
|-------|-------------|
| **Documentation** | IT discovery checklist filled; Gold object names recorded; refresh mode agreed. |
| **Semantic model** | Power BI Desktop connects to **approved** views/tables; relationships and measures validate. |
| **Report** | Pages follow [POWER-BI-REPORT-BLUEPRINT.md](POWER-BI-REPORT-BLUEPRINT.md); theme applied. |
| **Operations** | Publish runbook followed; scheduled refresh or DirectQuery path tested. |
| **Website (optional)** | Governance decided: internal PBI only vs embed vs **export job** from Gold → static build (see §6). |

---

## 2. What you can do **now** (no warehouse access)

1. Read [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md) and draft answers where you already know them.  
2. Send IT/data the **email template** in §8 (adjust names).  
3. Import [../powerbi/hap-340b-theme.json](../powerbi/hap-340b-theme.json) into a blank **Power BI Desktop** file and save as `HAP-340B-Advocacy-DRAFT.pbix` locally (no data yet — OK).  
4. Review [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) and [../powerbi/metric-registry.json](../powerbi/metric-registry.json) so you speak the same **MetricKey** language as Strategic Analytics.  
5. Skim [../powerbi/measures-340b.dax](../powerbi/measures-340b.dax) — after connect, you will **rename table references** to match IT’s physical names.

---

## 3. First session after read-only access (suggested order)

| Step | Action |
|------|--------|
| 1 | Record **fully qualified** table/view names in the discovery checklist §3.1. Prefer **views** built for reporting (e.g. `vw_pbi_*` in [../powerbi/gold-schema-reference.sql](../powerbi/gold-schema-reference.sql)) if IT publishes them. |
| 2 | In Power BI Desktop: **Get Data** → connector IT specified (SQL Server, Snowflake, Azure SQL, Fabric Warehouse, Databricks, etc.). |
| 3 | Connect using **your** read-only principal; use **parameters** for server/database (see §4). |
| 4 | Load the three logical areas: **state law dimension**, **KPI fact**, **freshness dimension** (see data factory spec §4). |
| 5 | Set **relationships** (typically KPI and freshness unrelated to state; state dim standalone or linked to a conformed geo dim if IT provides one). |
| 6 | Paste measures from `measures-340b.dax`; **replace** `gold_*` table names with your model’s names. |
| 7 | Build visuals per [POWER-BI-REPORT-BLUEPRINT.md](POWER-BI-REPORT-BLUEPRINT.md). |
| 8 | Run through [POWER-BI-PUBLISH-RUNBOOK.md](POWER-BI-PUBLISH-RUNBOOK.md) before sharing. |

---

## 4. Parameters and security (Desktop)

1. **Modeling → New parameter** (or **Power Query parameters**) for `WarehouseServer` and `WarehouseDatabase` — type **Text**, **optional** default blank until IT gives values.  
2. In **Power Query**, reference parameters in the connector step; **never** hardcode passwords in M — use **organizational sign-in** or gateway-managed credentials after publish.  
3. Confirm with IT whether **Import** (scheduled refresh), **DirectQuery**, or **composite** is required. Read-only access is compatible with both; **refresh SLA** drives perceived “freshness” on the website if you only embed PBI.

---

## 5. Power Query starter (SQL Database–style sources)

Use **Advanced Editor** after creating a blank query; replace placeholders. IT may give a **hostname**, **database**, and **schema** instead of `dbo`.

```powerquery
let
    ServerName = /* e.g. from parameter: WarehouseServer */,
    DatabaseName = /* e.g. from parameter: WarehouseDatabase */,
    Source = Sql.Database(ServerName, DatabaseName),
    StateLaw = Source{[Schema="dbo",Item="vw_pbi_dim_state_law"]}[Data]
in
    StateLaw
```

Repeat for `vw_pbi_fact_dashboard_kpi` and `vw_pbi_dim_data_freshness` **if** those view names match IT’s deployment. If IT uses different names, change `Schema` and `Item` only — keep the rest of the model design.

**Snowflake:** use the Snowflake connector and IT’s **warehouse / role**; do not paste secrets into M.

**Fabric:** use **Get Data → SQL endpoint** or **Lakehouse / Warehouse** per Microsoft guidance for your SKU.

---

## 6. Website and “real-time” expectations

| Approach | Fits when… | Notes |
|----------|------------|--------|
| **Power BI Service only** | Internal leadership and staff | No change to `340b.html`; share report links or workspace apps. |
| **Embed (secure)** | Approved public or partner embed | Requires IT **embed tokens** / registered app; not a repo change. |
| **Gold → export → static build** | Public site must show **same numbers** as PBI for an `AsOfDate` | Batch job writes JSON or regenerates `state-data.js` from Gold; governed pipeline (see factory spec §1, §7). |
| **DirectQuery** | KPIs must reflect warehouse **within minutes** | Heavier load; needs IT performance review. |

**Important:** Standard **Import** refresh is **not** millisecond-real-time; it is **scheduled** (hourly, daily, etc.). True streaming is a separate architecture (factory spec §2).

---

## 7. Parity checklist (static dashboard vs Power BI)

- [ ] Map **CSV export** columns ([`buildDatasetCsv` in `340b.js`](../340b.js)) to the same fields as `dim_state_law` (see [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) §1).  
- [ ] For each card on `340b.html` with a provenance chip, confirm a matching **`MetricKey`** in [../powerbi/metric-registry.json](../powerbi/metric-registry.json) exists in `fact_dashboard_kpi` with the same **AsOfDate** policy.  
- [ ] Confirm **50-state vs DC** rules with Advocacy (`IncludeInFiftyStateHeadline` vs filter in DAX).  
- [ ] **Do not** treat `TREND_DATA` in `340b.js` as authoritative for PBI unless the warehouse exposes the same series ([POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) §6).

---

## 8. Email template (IT / data platform)

**Subject:** Read-only warehouse access + Gold objects for 340B Power BI semantic model

**Body (edit bracketed fields):**

> We are standing up an internal **Power BI** report aligned with the HAP 340B advocacy dashboard. Please grant **[read-only]** access for **[identity / group]** to the approved **Gold** objects for 340B / state law / advocacy KPIs.  
>  
> **Requested information:**  
> - Warehouse platform and **connector** for Power BI Desktop  
> - **Fully qualified** names for: state law dimension, KPI fact, data freshness dimension (or equivalent views)  
> - **Import vs DirectQuery** policy for this dataset  
> - **Gateway / private link** requirements and credential method (no shared passwords by email)  
> - **Refresh SLA** and failure alerting owner  
> - Whether **row-level security** applies  
>  
> Our repo maps static fields to logical Gold columns in `docs/POWER-BI-DATA-MODEL-MAPPING.md` and includes illustrative DDL/views under `powerbi/`. We will adapt table names to your standards.

---

## 9. Related files (quick links)

| Doc / artifact | Role |
|----------------|------|
| [HAP-POWER-BI-DATA-FACTORY-SPEC.md](HAP-POWER-BI-DATA-FACTORY-SPEC.md) | Architecture, validation gates, AI/data integrity policy |
| [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md) | Connectivity, Gold, RLS, workspace |
| [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) | `state-data.js` / `340b.js` → Gold |
| [POWER-BI-REPORT-BLUEPRINT.md](POWER-BI-REPORT-BLUEPRINT.md) | Pages and visuals |
| [POWER-BI-PUBLISH-RUNBOOK.md](POWER-BI-PUBLISH-RUNBOOK.md) | Publish and lineage |
| [../powerbi/README.md](../powerbi/README.md) | Theme, DAX, SQL reference, metric registry |

---

---

## 10. Mobile App Integration (`DataLayer` swap point)

The **340B mobile dashboard** (`340b-mobile.html`) uses a data abstraction layer (`modules/data-layer.js`) that decouples the UI from raw data globals. This is the **single swap point** for connecting the mobile app to live data.

### How it works today (static)

`DataLayer` methods (`getStates()`, `getKPIs()`, `getPA()`, etc.) read from global variables defined in `state-data.js` and return Promises that resolve immediately.

### How to connect to the warehouse

1. **Publish a JSON API** that returns the same shape as `state-data.js` (STATE_340B, STATE_NAMES, CONFIG objects).
2. In the mobile app's init code, call:
   ```js
   DataLayer.connectAPI("https://your-api.haponline.org/340b/data.json");
   ```
3. `DataLayer` will poll that endpoint every 15 minutes and re-render all components.
4. The "Data Connection" card in the More tab will show "Live — Warehouse API" with a green indicator.

### Power BI embed path

For embedded PBI visuals, call:
```js
DataLayer.connectPowerBI({ type: "report", id: "...", embedUrl: "...", accessToken: "..." });
```
This mounts the PBI iframe in the `#pbi-embed-slot` container.

### Field mapping

See [DATA-DICTIONARY.md](DATA-DICTIONARY.md) for plain-English descriptions of every field, including the Power BI column name for each.

---

*Last aligned with dashboard `DATA_DATES` and `CONFIG` as documented in `powerbi/metric-registry.json` — update that file when static provenance changes.*
