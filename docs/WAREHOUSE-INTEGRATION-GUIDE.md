# Warehouse Integration Guide — 340B Dashboard

**What this file is:** A single-page guide to connecting the 340B dashboard to the HAP data warehouse so all numbers come from real, governed data that updates automatically.

**See also:** [Mobile + Power BI alignment summary](MOBILE-POWERBI-ALIGNMENT-SUMMARY.md) — novice-friendly steps and every `MetricKey` used on `340b-mobile.html`.

**Who this is for:** Jordan, IT/Strategic Analytics, or any developer doing the integration.

**Status:** Warehouse access granted. Dashboard is integration-ready — all three paths below are supported in `modules/data-layer.js`.

---

## Three Connection Paths

All paths can run simultaneously. Pick the ones that fit your needs.

| Path | What it does | Who benefits | Effort |
|------|-------------|-------------|--------|
| **A: Warehouse → JSON → Your Dashboard** | IT publishes a JSON API from Gold tables; your dashboard fetches it and renders with your design | Legislators, advocates, public — they see your polished custom design with live data | Low (IT publishes endpoint; you set one config value) |
| **B: Warehouse → Power BI Report** | Standard PBI report connected to the same Gold tables | VP Strategic Analytics, internal staff — they get self-service slicing and PBI governance | Medium (build PBI report using existing DAX/theme) |
| **C: Power BI Embed in Dashboard** | Embed specific PBI visuals inside your HTML dashboard | Hybrid audiences — your design with live PBI tiles | Higher (requires PBI JS SDK + embed tokens) |

---

## Path A: Warehouse → JSON API → Dashboard (recommended)

This is the simplest and most powerful path. Your dashboard looks exactly the same; the data just comes from the warehouse instead of `state-data.js`.

### What IT needs to provide

A JSON API endpoint that returns data shaped like `data/mock-api-response.json`:

```json
{
  "dim_state_law": [ { "StateCode": "PA", "StateName": "Pennsylvania", ... } ],
  "fact_dashboard_kpi": [ { "MetricKey": "PA_HOSPITALS_340B_COUNT", "ValueNumeric": 72, ... } ],
  "dim_data_freshness": { "DashboardKey": "340B_ADVOCACY", "DisplayAsOfText": "March 2026", ... }
}
```

The table/column names match `powerbi/gold-schema-reference.sql`. IT can adjust names — just keep the JSON keys consistent.

### How to connect

**Option 1: Config file (recommended for production)**

Edit `config/settings.js`:

```javascript
warehouse: {
  enabled: true,
  endpointUrl: "https://internal.haponline.org/api/340b/data.json",
  pollIntervalMs: 900000,   // 15 minutes
  storyApiUrl: "https://internal.haponline.org/api/340b/stories",
  headers: {}  // IT may require auth headers
}
```

Then in your app init code, add:

```javascript
if (DASHBOARD_SETTINGS.warehouse.enabled) {
  DataLayer.connectWarehouse(
    DASHBOARD_SETTINGS.warehouse.endpointUrl,
    {
      intervalMs: DASHBOARD_SETTINGS.warehouse.pollIntervalMs,
      storyApiUrl: DASHBOARD_SETTINGS.warehouse.storyApiUrl,
      headers: DASHBOARD_SETTINGS.warehouse.headers
    }
  );
}
```

**Option 2: Console / quick test**

```javascript
DataLayer.connectWarehouse("data/mock-api-response.json");
```

This loads the mock data file and confirms the full pipeline works before going live.

### What happens

1. `DataLayer.connectWarehouse()` fetches the Gold-shaped JSON
2. Caches the response in memory
3. All `DataLayer.getStates()`, `getKPIs()`, `getPA()`, etc. read from cache
4. Polls the endpoint every 15 minutes (configurable)
5. Fires `onRefresh` callbacks so the UI re-renders automatically
6. If the API is down, the dashboard still works with the last cached data

### How the data maps

| Gold table/column | DataLayer method | Dashboard renders as |
|---|---|---|
| `dim_state_law.*` | `getStates()` | US map colors, state cards, filter counts |
| `fact_dashboard_kpi.PA_HOSPITALS_340B_COUNT` | `getKPIs()` | "72 PA Hospitals" KPI card |
| `fact_dashboard_kpi.COMMUNITY_BENEFIT_TOTAL_BILLIONS` | `getKPIs()` | "$7.95B Community Benefit" card |
| `fact_dashboard_kpi.US_STATES_CP_PROTECTION_COUNT` | `getKPIs()` | "21 States Protected" card |
| `fact_dashboard_kpi.PA_RURAL_HOSPITAL_PCT` | `getPA()` | "38% Rural" stat card |
| `fact_dashboard_kpi.HRSA_HOSPITAL_AUDIT_COUNT` | `getPA()` | "179" oversight bar |
| `dim_data_freshness.DisplayAsOfText` | `getFreshness()` | "Data as of March 2026" |
| `dim_pa_delegation.*` | `getDelegation()` | Congressional delegation table |
| `dim_pa_legislator.*` | `getLegislators()` | State legislator cards |

---

## Path B: Power BI Report (internal analytics)

Build a standard PBI report using the same Gold tables. Everything you need is already in the repo.

### Steps

1. Open Power BI Desktop
2. Import theme: `powerbi/hap-340b-theme.json`
3. Connect to warehouse tables (names from IT — see `docs/POWER-BI-IT-DISCOVERY-CHECKLIST.md`)
4. Paste measures from `powerbi/measures-340b.dax` (rename table references to match IT's names)
5. Build pages per `docs/POWER-BI-REPORT-BLUEPRINT.md`
6. Publish per `docs/POWER-BI-PUBLISH-RUNBOOK.md`

### Key files

| File | Purpose |
|------|---------|
| `powerbi/hap-340b-theme.json` | Brand colors for PBI |
| `powerbi/measures-340b.dax` | All DAX measures (12 measures, ready to paste) |
| `powerbi/gold-schema-reference.sql` | Table DDL + consumer views |
| `powerbi/metric-registry.json` | All 11 MetricKeys with sources |
| `docs/POWER-BI-DATA-MODEL-MAPPING.md` | Static → Gold field mapping |
| `docs/POWER-BI-READINESS-PLAYBOOK.md` | Step-by-step connection guide |

---

## Path C: Power BI Embed (hybrid)

Embed live PBI visuals inside your HTML dashboard.

### Prerequisites

- PBI report published (Path B)
- PBI JS SDK loaded on the page
- IT provides embed token / registered app

### How to connect

```javascript
DataLayer.connectPowerBI({
  type: "report",
  id: "your-report-id",
  embedUrl: "https://app.powerbi.com/reportEmbed?reportId=...",
  accessToken: "from-IT-managed-auth"
});
```

This mounts the PBI iframe in the `#pbi-embed-slot` container on the page.

---

## Testing the Integration

### Quick test (no warehouse needed)

Open the dashboard in a browser, open the console, and run:

```javascript
DataLayer.connectWarehouse("data/mock-api-response.json");
```

Then verify:
- KPI cards show correct values (72, $7.95B, 21, 29)
- Map colors match state protection status
- PA Focus stats are correct (38%, 63%, 95%, 179 vs 5)
- `DataLayer.getStatus()` shows `source: "warehouse-gold"` and `cacheLoaded: true`

### Export test

```javascript
DataLayer.exportJSON().then(function(data) {
  console.log(JSON.stringify(data, null, 2));
});
```

This outputs the complete dashboard data in Gold-shaped JSON — useful for sharing with the data team to confirm parity.

### Verify connection status

```javascript
DataLayer.getStatus();
// → { source: "warehouse-gold", isLive: true, lastRefreshed: ..., cacheLoaded: true }
```

---

## What to ask IT / Strategic Analytics

1. **JSON API endpoint URL** — what URL serves the Gold-shaped JSON?
2. **Auth method** — Azure AD? Cookie-based? API key in header? (Never hardcode secrets)
3. **Refresh cadence** — how often does the Gold data update? (Drives poll interval)
4. **Story submission API** — is there a POST endpoint for `fact_story_submission`?
5. **Table names** — do the Gold tables match `gold-schema-reference.sql` or use different names?

See `docs/POWER-BI-IT-DISCOVERY-CHECKLIST.md` for the full checklist.

---

## Architecture diagram

```
DATA WAREHOUSE (Gold tables)
    │
    ├──→ JSON API endpoint ──→ DataLayer.connectWarehouse() ──→ Your HTML Dashboard
    │    (IT publishes)         (polls every 15 min)            (your design, live data)
    │
    ├──→ Power BI Desktop ──→ PBI Service ──→ Internal analysts
    │    (DAX measures)        (scheduled refresh)
    │
    └──→ PBI JS SDK ──→ DataLayer.connectPowerBI() ──→ Embedded tiles in your dashboard
         (optional)     (iframe in #pbi-embed-slot)
```

All three paths read from the **same Gold tables**. Same data, same governance — different presentations for different audiences.

---

## Related files

| File | Purpose |
|------|---------|
| `modules/data-layer.js` | The code that makes all three paths work |
| `config/settings.js` | Where you configure warehouse URL and poll interval |
| `data/mock-api-response.json` | Test data matching Gold schema shape |
| `powerbi/metric-registry.json` | All 11 MetricKeys |
| `powerbi/semantic-layer-registry.json` | Every placeholder and its warehouse mapping |
| `docs/DATA-DICTIONARY.md` | Plain-English guide to every data field |
