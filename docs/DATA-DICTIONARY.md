# 340B Dashboard — Data Dictionary (mobile + shared DataLayer)

**What this file is:** A plain-English guide to every piece of data in the HAP 340B mobile dashboard and shared `DataLayer` metrics. If you see a number, chart, or label in the app and wonder "where does that come from?" — this is your answer.

**Who this is for:** Anyone. You do not need a data or coding background. If you can read a table, you can use this file.

**How to use it:** Find the section that matches what you see in the app (Home screen, Map, PA Focus, etc.). Each entry tells you what the number means, where it lives in the code today, and where it will come from when the dashboard connects to the data warehouse / Power BI.

---

## Quick glossary

| Term | What it means |
|------|---------------|
| **340B** | A federal program (Section 340B of the Public Health Service Act) that lets eligible hospitals buy certain drugs at a discount. |
| **Contract pharmacy** | A pharmacy that isn't owned by the hospital but has an agreement to fill 340B prescriptions for the hospital's patients. |
| **PBM** | Pharmacy Benefit Manager — a company that manages prescription drug benefits. Some states regulate PBMs related to 340B. |
| **FIPS code** | A number the government assigns to each state (e.g., 42 = Pennsylvania). Used by map software to draw state shapes. |
| **Power BI** | Microsoft's data visualization tool. The future plan is to connect this dashboard to Power BI so data updates automatically. |
| **Data warehouse** | A central database where the organization stores all its data. Think of it as a big, organized filing cabinet that computers can read from. |
| **Gold table** | In data warehouse terms, this is the "final, clean" version of the data that reports pull from. |
| **Semantic model** | A layer on top of the warehouse that gives human-friendly names to database columns (e.g., "States Protected" instead of `cp_count_excl_dc`). |

---

## 1a. Policy Impact Simulator (Home tab + full desktop dashboard)

**What you see:** A “CEO briefing” block on the **mobile Home** tab and the **Policy simulator** section on `340b.html` — three buttons (protect the discount / keep today’s mix / remove protections) and three result cards.

**What it means:** These are **illustrative advocacy storylines** so executives can compare directions of travel. They are **not** live forecasts, HRSA statistics, or warehouse-backed metrics.

**Where the data lives today:** `modules/impact-data.js` defines `HAP340B_IMPACT` (scenario labels + rounded “estimates” for briefings). `modules/impact-simulator.js` reads that object. `modules/impact-ui.js` draws the UI into `#policy-impact-simulator-root` (desktop) and `#mobile-impact-simulator-root` (mobile).

**Power BI later:** Tracked in `powerbi/semantic-layer-registry.json` under `advocacyTools.policyImpactSimulator` with `validationStatus: illustrative_only`. IT would need an explicit Gold/dim design before any “real” numbers appear here.

**How to update copy or illustration values:** Edit `modules/impact-data.js` only after advocacy/SME sign-off — do not present these as verified program statistics in external materials without review.

---

## 1. Home Screen KPIs

These are the four big number cards at the top of the Home tab.

### 72 PA Hospitals

| Question | Answer |
|----------|--------|
| **What you see** | "72" with the label "PA Hospitals" |
| **What it means** | The number of hospitals in Pennsylvania that participate in the 340B program |
| **Where it lives today** | Hard-coded in `340b-mobile.html` as `data-count="72"` on a KPI card |
| **Code variable** | None — it's in the HTML directly |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'PA_HOSPITALS_340B_COUNT'` |
| **Gold table** | `fact_dashboard_kpi` |
| **How often it changes** | When HRSA updates the 340B covered entity list (roughly quarterly) |
| **Who owns the number** | HAP advocacy team confirms; HRSA is the original source |
| **Update trigger** | HRSA publishes a new covered entity list → HAP staff verifies PA count → update the HTML or warehouse |

### $7.95B Community Benefit

| Question | Answer |
|----------|--------|
| **What you see** | "$7.95B" with the label "Community Benefit" |
| **What it means** | The total dollar amount of community benefit (free care, charity programs, etc.) that 340B hospitals reported nationally in 2024 |
| **Where it lives today** | Hard-coded in `340b-mobile.html` as `data-count="7.95"` with `data-prefix="$"` and `data-suffix="B"` |
| **Code variable** | None — it's in the HTML directly |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'COMMUNITY_BENEFIT_TOTAL_BILLIONS'` |
| **Gold table** | `fact_dashboard_kpi` |
| **How often it changes** | Annually, when hospitals file their community benefit reports |
| **Who owns the number** | 340B Health and AHA publish aggregates; HAP confirms for advocacy use |
| **Update trigger** | New annual community benefit data released → HAP reviews → update |

### 21 States Protected

| Question | Answer |
|----------|--------|
| **What you see** | "21" with the label "States Protected" |
| **What it means** | The number of U.S. states (out of 50, excluding D.C.) that have enacted a law protecting 340B contract pharmacy relationships |
| **Where it lives today** | Computed from `state-data.js`: count of states where `STATE_340B[abbr].cp === true`, excluding D.C. |
| **Code variable** | `STATES_WITH_PROTECTION` array in `state-data.js` → filtered to exclude "DC" → `.length` |
| **MetricKey** | `US_STATES_CP_PROTECTION_COUNT` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'US_STATES_CP_PROTECTION_COUNT'`, or DAX: `COUNTROWS(FILTER(dim_state_law, [ContractPharmacyProtected] = TRUE AND [StateCode] <> "DC"))` |
| **Gold table** | `fact_dashboard_kpi` or derived from `dim_state_law` |
| **How often it changes** | When a new state passes (or repeals) a contract pharmacy protection law |
| **Who owns the number** | HAP advocacy team verifies against MultiState, ASHP, and America's Essential Hospitals |
| **Update trigger** | New state legislation signed → HAP confirms → update `state-data.js` or warehouse |

### 29 States Without

| Question | Answer |
|----------|--------|
| **What you see** | "29" with the label "States Without" |
| **What it means** | 50 minus the number of states with contract pharmacy protection = states that have NOT enacted protection |
| **Where it lives today** | Computed in `340b-mobile.js` as `50 - protectedCount` |
| **Code variable** | Calculated at runtime |
| **MetricKey** | `US_STATES_NO_CP_PROTECTION_COUNT` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'US_STATES_NO_CP_PROTECTION_COUNT'`, or DAX: `50 - [States Protected Count]` |
| **Gold table** | `fact_dashboard_kpi` or derived from `dim_state_law` |
| **How often it changes** | Whenever the "States Protected" count changes |
| **Who owns the number** | Same as States Protected |
| **Update trigger** | Same as States Protected |

### 7% — 340B Drug Market Share

| Question | Answer |
|----------|--------|
| **What you see** | "7%" with the label "340B Drug Market Share" |
| **What it means** | 340B purchases represent approximately 7% of the total U.S. outpatient drug market — a small fraction despite industry claims |
| **Where it lives today** | `HAP_STATIC_METRICS.OUTPATIENT_SHARE_PCT` in `state-data.js`; hard-coded `data-count="7"` in HTML |
| **MetricKey** | `OUTPATIENT_SHARE_PCT` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'OUTPATIENT_SHARE_PCT'` |
| **Gold table** | `fact_dashboard_kpi` |
| **Source** | HAP March 2026 talking points, citing Commonwealth Fund |
| **Update trigger** | New market share analysis published → HAP reviews → update |

### 184 — HRSA Audits (Aggregate)

| Question | Answer |
|----------|--------|
| **What you see** | "184" with the label "HRSA Audits (FY 2024)" |
| **What it means** | Total HRSA Program Integrity audits in FY 2024 (179 hospital + 5 manufacturer). Shown on the executive KPI strip as the combined figure |
| **Where it lives today** | `HAP_STATIC_METRICS.HRSA_AUDIT_COUNT` in `state-data.js` |
| **MetricKey** | `HRSA_AUDIT_COUNT` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'HRSA_AUDIT_COUNT'` |
| **Gold table** | `fact_dashboard_kpi` |
| **Source** | HRSA Program Integrity FY 2024 audit results |
| **Update trigger** | HRSA publishes new fiscal year audit data → HAP updates |
| **Note** | Split into `HRSA_HOSPITAL_AUDIT_COUNT` (179) and `HRSA_MANUFACTURER_AUDIT_COUNT` (5) for the oversight disparity visual |

---

## 2. Map & State Data

The interactive U.S. map and the state cards below it. Each state has the following fields:

### State Code (abbreviation)

| Question | Answer |
|----------|--------|
| **What you see** | Two-letter code like "PA" on state cards and tooltips |
| **What it means** | The standard U.S. postal abbreviation for the state |
| **Where it lives today** | Keys of `STATE_340B` object and `STATE_NAMES` object in `state-data.js` |
| **Power BI column** | `dim_state_law.StateCode` |
| **How often it changes** | Never (states don't change their abbreviations) |

### State Name

| Question | Answer |
|----------|--------|
| **What you see** | Full name like "Pennsylvania" on cards and in the bottom sheet |
| **What it means** | The full name of the state |
| **Where it lives today** | `STATE_NAMES[abbr]` in `state-data.js` (e.g., `STATE_NAMES["PA"]` = `"Pennsylvania"`) |
| **Power BI column** | `dim_state_law.StateName` |
| **How often it changes** | Never |

### FIPS Code

| Question | Answer |
|----------|--------|
| **What you see** | You don't see it directly — it's used behind the scenes to draw the map |
| **What it means** | A number the federal government assigns to each state (Pennsylvania = 42) |
| **Where it lives today** | `FIPS_TO_ABBR` object in `state-data.js` (e.g., `FIPS_TO_ABBR[42]` = `"PA"`) |
| **Power BI column** | `dim_state_law.StateFips` (optional) |
| **How often it changes** | Never |

### Contract Pharmacy Protection (yes/no)

| Question | Answer |
|----------|--------|
| **What you see** | Blue color on the map, "Protected" label on state card, blue dot |
| **What it means** | Has this state passed a law that protects hospitals' ability to use contract pharmacies for 340B? |
| **Where it lives today** | `STATE_340B[abbr].cp` in `state-data.js` — `true` or `false` |
| **Power BI column** | `dim_state_law.ContractPharmacyProtected` (boolean / BIT) |
| **How often it changes** | When a state passes or repeals a contract pharmacy law |
| **Update trigger** | New legislation → verify with MultiState → update `state-data.js` |

### PBM Regulation (yes/no)

| Question | Answer |
|----------|--------|
| **What you see** | Light blue color on map if PBM-only, "PBM only" label on state card |
| **What it means** | Has this state passed a law regulating Pharmacy Benefit Managers (PBMs) in the context of 340B? |
| **Where it lives today** | `STATE_340B[abbr].pbm` in `state-data.js` — `true` or `false` |
| **Power BI column** | `dim_state_law.PBMProtected` or `dim_state_law.HasPbmLaw` (boolean / BIT) |
| **How often it changes** | When a state passes PBM-related legislation |

### Year Enacted

| Question | Answer |
|----------|--------|
| **What you see** | Year shown in the state detail bottom sheet (e.g., "2021") |
| **What it means** | The year the state's 340B-related law was enacted |
| **Where it lives today** | `STATE_340B[abbr].y` in `state-data.js` — a number like `2021` or `null` if no law |
| **Power BI column** | `dim_state_law.YearEnacted` (integer, nullable) |
| **How often it changes** | When a new law passes |

### Notes

| Question | Answer |
|----------|--------|
| **What you see** | Extra context in the state detail sheet (e.g., "First to enact; upheld in court.") |
| **What it means** | Approved editorial notes about the state's 340B legal status |
| **Where it lives today** | `STATE_340B[abbr].notes` in `state-data.js` — a text string |
| **Power BI column** | `dim_state_law.Notes` (text) |
| **How often it changes** | When advocacy staff update notes after court rulings or legislative changes |

---

## 3. PA Focus Stats

These appear on the "PA Focus" tab as stat cards.

### 72 — 340B Hospitals (Pennsylvania)

Same as Home Screen KPI. See Section 1.

### 38% — Rural Hospitals

| Question | Answer |
|----------|--------|
| **What you see** | "38%" with the label "Rural Hospitals" |
| **What it means** | 38% of Pennsylvania's 340B hospitals are classified as rural |
| **Where it lives today** | Hard-coded in `340b-mobile.html` as `data-count="38"` with `data-suffix="%"` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'PA_RURAL_HOSPITAL_PCT'` |
| **Source** | HAP March 2026 PA fact sheet |
| **Update trigger** | New hospital classification data from HRSA or Census → HAP confirms |

### 63% — Operating at a Loss

| Question | Answer |
|----------|--------|
| **What you see** | "63%" with the label "Operating at a Loss" |
| **What it means** | 63% of Pennsylvania's 340B hospitals are operating at a financial loss (spending more than they earn) |
| **Where it lives today** | Hard-coded in `340b-mobile.html` as `data-count="63"` with `data-suffix="%"` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'PA_HOSPITALS_OPERATING_LOSS_PCT'` |
| **Source** | HAP March 2026 PA fact sheet |

### 95% — L&D Services

| Question | Answer |
|----------|--------|
| **What you see** | "95%" with the label "L&D Services" |
| **What it means** | 95% of Pennsylvania's labor and delivery (maternity) services are provided by 340B hospitals |
| **Where it lives today** | Hard-coded in `340b-mobile.html` as `data-count="95"` with `data-suffix="%"` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'PA_LD_SERVICES_PCT'` |
| **Source** | HAP March 2026 PA fact sheet |

### 179 vs 5 — HRSA Audit Comparison

| Question | Answer |
|----------|--------|
| **What you see** | "179" HRSA audits of hospitals vs "5" manufacturer audits |
| **What it means** | In fiscal year 2024, HRSA conducted 179 audits of 340B hospitals but only 5 audits of drug manufacturers — showing hospitals face 36x more oversight |
| **Where it lives today** | Hard-coded in `340b-mobile.html` as `data-count="179"` and `data-count="5"` |
| **Power BI column** | `fact_dashboard_kpi.ValueNumeric` where `MetricKey = 'HRSA_HOSPITAL_AUDIT_COUNT'` and `'HRSA_MANUFACTURER_AUDIT_COUNT'` |
| **Source** | HRSA Program Integrity FY 2024 report |
| **Update trigger** | HRSA publishes new fiscal year audit data → HAP updates |

### $7.95B — Community Benefit

Same as Home Screen KPI. See Section 1.

---

## 4. Legislator Data

### PA State Legislature — Key Committee Members

These are hard-coded HTML cards in `340b-mobile.html` on the Policy tab. Each card has:

| Field | What it means | Where it lives today | Power BI column (future) |
|-------|--------------|---------------------|-------------------------|
| **Name** | The legislator's name (e.g., "Rep. Dan Frankel") | HTML in `340b-mobile.html` | `dim_pa_legislator.MemberName` |
| **District** | Their legislative district number (e.g., "District 23") | HTML | `dim_pa_legislator.DistrictNumber` |
| **Party** | Political party — D (Democrat) or R (Republican) | HTML | `dim_pa_legislator.Party` |
| **Engagement posture** | Supportive / Engage / Opposed — how they're expected to respond to 340B advocacy | HTML + CSS badge class | `dim_pa_legislator.EngagementPosture` |
| **Suggested action** | What the advocacy team should do next (e.g., "Schedule policy meeting") | HTML | `dim_pa_legislator.SuggestedAction` |

**Update trigger:** After elections, committee assignments, or meetings that change a legislator's posture.

### PA Congressional Delegation (Federal)

These are rendered dynamically from a JavaScript array in `340b-mobile.js`.

| Field | What it means | Code variable | Power BI column (future) |
|-------|--------------|--------------|-------------------------|
| **Member** | Full name (e.g., "John Fetterman") | `PA_DELEGATION[i].member` | `dim_pa_delegation.MemberName` |
| **Chamber** | "Senate" or "House" | `PA_DELEGATION[i].chamber` | `dim_pa_delegation.Chamber` |
| **District** | "Statewide" for senators, "District 1" etc. for House | `PA_DELEGATION[i].district` | `dim_pa_delegation.DistrictLabel` |
| **Party** | "D" or "R" | `PA_DELEGATION[i].party` | `dim_pa_delegation.Party` |
| **340B Position** | cosponsor / supportive / unknown / opposed | `PA_DELEGATION[i].position` | `dim_pa_delegation.Position340B` |
| **Last Contact** | Date of last advocacy contact (e.g., "03/15/2026") | `PA_DELEGATION[i].lastContact` | `dim_pa_delegation.LastContactDate` |
| **Suggested Action** | Next step for the advocacy team | `PA_DELEGATION[i].action` | `dim_pa_delegation.SuggestedAction` |

**Update trigger:** After meetings, votes, or co-sponsorship changes.

---

## 5. PA District Map Data

The interactive PA legislative district maps on the PA Focus tab. Data is loaded from files in `data/pa-districts/`.

| Field | What it means | Source file | Power BI column (future) |
|-------|--------------|------------|-------------------------|
| **District boundaries** | Geographic shapes of PA House (203) and Senate (50) districts | `PaHouse2024_03.js`, `PaSenatorial2024_03.js` | Spatial data in warehouse or Shape map visual |
| **Hospital locations** | Latitude/longitude of each 340B hospital in PA | `pa-340b-hospitals.js` | `dim_pa_hospitals.Latitude`, `.Longitude` |
| **Hospital name** | Name of each 340B hospital | `pa-340b-hospitals.js` | `dim_pa_hospitals.HospitalName` |
| **Hospitals per district** | Count of 340B hospitals in each legislative district | Computed at runtime by the map module | DAX measure from spatial join |
| **ZIP centroids** | Center point of each PA ZIP code (used for ZIP lookup) | `pa-zip-centroids.js` | `dim_pa_zip.CentroidLat`, `.CentroidLon` |

**Update trigger:** Redistricting (every 10 years), or when HRSA updates covered entity locations.

---

## 6. Configuration & Copy

These are settings and text used across the app. They come from `CONFIG` in `state-data.js`.

| Field | What it means | Code path | Likely Power BI home |
|-------|--------------|-----------|---------------------|
| **Dashboard title** | "340B Drug Pricing Program" shown in page title | `CONFIG.dashboardTitle` | `dim_report_copy` or static text box |
| **Data freshness** | "March 2026" — when the data was last verified | `CONFIG.dataFreshness` | `dim_data_freshness.DisplayAsOfText` |
| **Overview lead** | The introductory paragraph about 340B | `CONFIG.copy.overviewLead` | `dim_report_copy` (approved text only) |
| **HAP position lead** | HAP's policy position statement | `CONFIG.copy.hapPositionLead` | `dim_report_copy` |
| **HAP ask items** | The 3 things HAP is asking lawmakers to do | `CONFIG.copy.hapAskItems[]` — array of `{label, impactLine}` | `dim_report_copy` |
| **Executive strip** | Three summary cards on Home (priority, landscape, trust) | `CONFIG.copy.executiveStrip.*` | `dim_report_copy` |
| **Source summary** | Citation list for data sources | `CONFIG.copy.sourceSummary` | `dim_report_copy` |
| **Limitations** | Known limitations of the data | `CONFIG.copy.sourcesLimitations` | `dim_report_copy` |

**Update trigger:** HAP staff update advocacy messaging or data verification dates.

---

## 7. Story Submissions (new — Phase 3)

When the story form is built, each submission will contain:

| Field | What it means | Storage today | Power BI column (future) |
|-------|--------------|--------------|-------------------------|
| **Hospital name** | Name of the hospital sharing a story | `sessionStorage` (browser only) | `fact_story_submission.HospitalName` |
| **County** | PA county the hospital is in | `sessionStorage` | `fact_story_submission.County` |
| **Category** | Type of story: Patient Access / Community Benefit / Rural Care / Financial Impact | `sessionStorage` | `fact_story_submission.Category` |
| **Story text** | The actual story (up to 500 characters) | `sessionStorage` | `fact_story_submission.StoryText` |
| **Contact email** | Optional email for follow-up | `sessionStorage` | `fact_story_submission.ContactEmail` |
| **Timestamp** | When the story was submitted | `sessionStorage` | `fact_story_submission.SubmittedAt` |

**Update trigger:** Each time a user submits a story through the app.

---

## Advocacy Lab (`340b-advocacy-lab.html`)

**What it is:** A separate, heavily commented page for new developers. It uses **local scripts only** (no Leaflet/Chart.js/jsPDF CDNs) and **verified** data from this repo.

### PA hospital map (dots)

| Question | Answer |
|----------|--------|
| **What you see** | Blue circles on a Pennsylvania outline |
| **What it means** | Approximate locations of participating hospitals from the HAP Resource Center list used in `pa-340b-hospitals.js` |
| **Where it lives** | `window.HAP_PA_340B_HOSPITALS` → loaded via `DataLayer.getPA340bHospitalPoints()` in `modules/advocacy-lab.js` |
| **What is not shown** | **Per-hospital 340B dollar savings** — not in the static file; IT must supply a Gold table before any savings map/chart |
| **Geocode source** | OpenStreetMap Nominatim (see each hospital row `source` / `display_name`) |
| **Power BI** | Future `dim_pa_340b_hospital` or `fact_facility_location` (lat/lon, name, geocode source) |

### KPI bar chart

| Question | Answer |
|----------|--------|
| **What you see** | Horizontal bars for selected `MetricKey` values |
| **Where it comes from** | `DataLayer.getKPIs()` — same keys as `fact_dashboard_kpi` |
| **Community benefit** | MetricKey `COMMUNITY_BENEFIT_TOTAL_BILLIONS` is documented separately; it is **not** on the same axis as the lab chart (mixed units) |

### Story form (extended fields)

| Form field | JSON property | Future Gold column (example) |
|------------|---------------|------------------------------|
| Hospital name | `hospitalName` | `fact_story_submission.HospitalName` |
| County | `county` | `fact_story_submission.County` |
| Category | `category` | `fact_story_submission.Category` |
| Approx. savings (text) | `savingsApproximate` | Extend Gold / SME — self-reported |
| Community programs | `communityProgramsFunded` | Extend Gold — narrative |
| Contract pharmacy | `contractPharmacyUse` | Extend Gold — narrative |
| Manufacturer comms | `manufacturerCommunications` | Extend Gold — narrative |
| Composed body (≤500 chars) | `storyText` | `fact_story_submission.StoryText` |
| Email | `contactEmail` | `fact_story_submission.ContactEmail` |
| Time | `submittedAt` | `fact_story_submission.SubmittedAt` |

Legacy keys `hospital`, `story`, `email`, `timestamp`, `version` are duplicated for compatibility with the mobile form payload.

---

## How data flows today vs. in the future

```
TODAY (static):
  state-data.js (hand-edited file)
       ↓
  340b-mobile.js reads globals directly
       ↓
  HTML shows the numbers

FUTURE (near-real-time):
  Data warehouse (SQL/Snowflake/Fabric)
       ↓
  Gold tables (dim_state_law, fact_dashboard_kpi, etc.)
       ↓
  JSON API endpoint (or Power BI REST API)
       ↓
  DataLayer.refresh() polls every 15 minutes
       ↓
  340b-mobile.js gets data from DataLayer
       ↓
  HTML updates automatically
```

---

## Related documents

- [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md) — technical mapping of static fields to Gold schema columns
- [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md) — step-by-step guide for when IT grants access
- [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md) — questions for the IT/data team
- [HAP-POWER-BI-DATA-FACTORY-SPEC.md](HAP-POWER-BI-DATA-FACTORY-SPEC.md) — technical spec for the data pipeline
