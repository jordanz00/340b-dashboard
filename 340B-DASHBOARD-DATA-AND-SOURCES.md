# HAP 340B dashboard — data dictionary (plain language)

This document is a **human-readable map** of what the 340B advocacy dashboard shows, **where each piece lives in the project**, and **what it is allowed to mean** for briefings and publishing. It avoids internal code names as labels; when a file or variable is listed, it is only so editors can find and update the right place.

**Primary HTML reference on the live page:** section **“Data sources”** (`#data-sources` in `340b.html`) and **“Data transparency & methodology”** (`#methodology-section`).

---

## 1. When the dashboard was last framed for audiences

| What this means | What you see | Where it is set | Source of the date |
|-----------------|--------------|-----------------|-------------------|
| “How current is this page?” | **Data as of March 2026** and **Last updated March 2026** (wording may vary slightly by section) | `state-data.js` → `CONFIG.dataFreshness`, `CONFIG.lastUpdated` | HAP editorial choice; should match policy verification cadence |

---

## 2. Numbers and facts that are meant to trace to real reports or files

Each row is a **verified or report-backed** line item as described on the dashboard. Do not treat the **illustrative** items in section 4 the same way.

| What you see (plain English) | Typical value on the page | Where it lives in the project | Where the number or claim comes from | Time period / “as of” |
|------------------------------|---------------------------|--------------------------------|----------------------------------------|-------------------------|
| How many states have a **state law** protecting **hospital use of contract pharmacies** | **21** states with protection; **29** of **50** states without (headline counts) | `state-data.js` → `STATE_340B` (per state: protection flags). Counts on screen use **50 states**; **Washington, D.C.** is stored in the same file but **not** counted in those headline totals (so the map chip lists match the big numbers). | MultiState, then ASHP, then America’s Essential Hospitals — cross-checked in that order; HAP policy verification | March 2026 (per Data sources table) |
| **National** dollars hospitals report reinvesting in communities through the program | **$7.95 billion** for **2024**, with narrative that support grew about **9%** vs. prior year | `340b.html` KPIs and narrative; trend label in `340b.js` → `TREND_DATA.communityBenefit` is **only for the small sparkline shape** (see section 4) | 340B Health and American Hospital Association **reported program totals** (national narrative) | 2024 data, cited March 2026 |
| **Federal audits**: hospitals and similar entities vs. drug manufacturers | **179** covered-entity audits vs. **5** manufacturer audits | `340b.html` KPI and related copy | HRSA Program Integrity — FY 2024 audit results: https://www.hrsa.gov/opa/program-integrity/fy-24-audit-results | FY 2024 |
| **Pennsylvania hospitals** that participate in 340B | **72** | `340b.html` / KPIs; aligned with `modules/pa-impact-data.js` → `PA_ANCHORS.hospitalsParticipating` | HRSA **OPAIS** 340B participation file, **reconciled by HAP** | January 2026 (per Data sources table) |
| **Share of all Pennsylvania hospitals** that participate | **30%** | `340b.html` (Pennsylvania stakes area) | Dashboard ties the **72** count to HRSA/HAP reconciliation; the **percentage** is the share of Pennsylvania hospitals — **confirm the denominator** with HAP before citing outside the dashboard | Same vintage as PA hospital count |
| **Share of national outpatient medicine use** attributed to 340B | **7%** | `340b.html` key findings / KPIs | IQVIA market analysis (market context on the page) | 2023 |
| **Rural share** of Pennsylvania 340B hospitals; hospitals **losing money overall**; **labor and delivery** losses | **49%**, **53%**, **49%** (three separate stats) | `340b.html` Pennsylvania metrics | Oliver Wyman **hospital sustainability analysis commissioned by HAP** — full definitions in `OW_report_dashboard.html` | Same vintage as that report |
| **Typical discount** on drug purchases under the program (survey-based, not an audit) | **23%** average (wording: illustrative / survey-based) | Community benefit and methodology copy in `340b.html` | 340B Health and AHA **survey methodology** (comparison of list price vs. statutory ceiling price); **not independently audited** | Per survey cycle described in methodology |
| **Pennsylvania legislative district map** (hospitals by district) | Map and counts from local files | `data/pa-districts/` (hospital points, district boundaries, zip centroids where used) | HAP-maintained hospital points + **Pennsylvania Legislative Redistricting Commission** district boundaries; zip file notes cite upstream JSON for centroids where applicable | Per file metadata inside each data file |
| **Legal landscape** text (courts, vetoes, state actions) | Narrative band on the page | `340b.html` legal trends content | HAP Finance and Legal Affairs verification; **not a substitute for legal advice or docket research** | March 2026 |
| **Duplicate discount** safeguard (why Medicaid and 340B don’t “double dip” the same sale) | Educational copy | `340b.html` policy section + footnote | U.S. law citation **42 U.S.C. 256b**; HRSA/CMS coordination described in footnote | Statute / federal guidance (see on-page footnote) |

---

## 3. Pennsylvania and federal **bill status** (workflow content, not statistical surveys)

These blocks help advocacy teams **track bills and talking points**. They are **edited in code** and should be refreshed with **Advocacy / Government Affairs** before external use.

| What you see | Where it is edited | How to treat it |
|--------------|-------------------|-----------------|
| Pennsylvania contract pharmacy **bill card** (title, committees, session deadline, last action, HAP position, link) | `340b.js` → `PA_BILL_CONFIG` | **Operational snapshot** — confirm against the Pennsylvania legislature website and HAP Advocacy |
| Federal **340B PATIENTS Act** line (bill numbers, committee status, link) | `340b.js` → `FEDERAL_BILL_CONFIG` | **Operational snapshot** — confirm against Congress.gov |
| **Pennsylvania congressional delegation** table (cosponsor / supportive / opposed / unknown, last contact, suggested action) | `340b.js` → `PA_DELEGATION_MEMBERS` | **Internal relationship tracking** — update when sponsorship or meetings change; not a public database extract |
| **Committee member** names and “HAP relationship” badges (House / Senate) | `340b.html` tables under PA legislature | **Advocacy targeting** — maintain with HAP State Advocacy |

---

## 4. **Illustrative** content — good for storyboarding, **not** primary evidence

These items are **labeled** on the page or in code as illustrative, scenario-based, or decorative. **Do not cite them as if they came from HRSA, IQVIA, or audited filings** without HAP review.

| What it is | Plain English | Where it lives | Why it is separate |
|------------|---------------|----------------|-------------------|
| **Policy impact simulator** (national scenarios) | Three fixed stories (“protect the discount,” “today’s mix,” “remove protections”) with rounded **partnership counts** and **qualitative** access/funding labels | `modules/impact-data.js` | Explicitly **not** a forecast, CBO-style score, or facility model — see “How this simulator works” in `340b.html` |
| **Pennsylvania impact mode** (scenarios) | PA-specific **storylines** tied to the same three scenarios; uses **72** and **$7.95B** as anchors but adds **estimated** pharmacy counts and qualitative impacts | `modules/pa-impact-data.js` | **Advocacy storytelling**; `PA_SCENARIO_ESTIMATES` numbers (e.g. pharmacies affected **420 / 180 / 60**) are **not** OPAIS extracts |
| **PA “share of national” anchor** for scenario math | **4.2%** used inside PA impact logic | `modules/pa-impact-data.js` → `PA_ANCHORS.paShareOfNationalPct` | **Internal scenario anchor** — not documented here as a published third-party statistic |
| **Small trend / sparkline charts** next to some headline stats | Smooth year-by-year **shapes** and labels like “↑ 9% from 2023” | `340b.js` → `TREND_DATA` | Code comment: **illustrative series for sparklines only** — the **endpoints** are meant to align with headline KPIs, but the **intermediate years** are for visual rhythm, not a published time series |
| **Internal verification labels** in JavaScript | Strings such as “October 2025” next to certain themes | `340b.js` → `DATA_DATES` | UI provenance hints; **align** with Data sources and HAP policy dates when you change copy |

---

## 5. Map and geography (technical layers)

| What it is | Purpose | Where it lives |
|------------|---------|----------------|
| U.S. state outlines for the map | Drawing the map | `assets/vendor/states-10m.js` (or equivalent local topojson in repo) |
| Numeric state IDs → two-letter codes | Match map shapes to `STATE_340B` | `state-data.js` → `FIPS_TO_ABBR`, `STATE_NAMES` |
| List of states with protection (for coloring) | Derived from `STATE_340B` | `state-data.js` → `STATES_WITH_PROTECTION` |

---

## 6. How verification is ordered (state laws)

For **state statute and contract-pharmacy protection** questions, the dashboard assumes this **order of review**:

1. MultiState  
2. ASHP  
3. America’s Essential Hospitals  

Stated in: `state-data.js` → `CONFIG.copy.verificationOrder` and on-page methodology.

---

## 7. Known limitations (from the dashboard’s own methodology)

- **State law counts change** whenever legislatures pass new bills.  
- **Community benefit totals** are **self-reported aggregates**, not independently audited.  
- **Legal narrative** is briefing material, not legal advice.  
- **Simulator and PA impact scenarios** are **not** mixed into the official “Data sources” fact table on purpose.

---

## 8. Quick file index for editors

| File | Role |
|------|------|
| `state-data.js` | Page titles, dates, share text, **all state law rows**, CONFIG copy |
| `340b.html` | Layout, KPI numbers as shown, Data sources table, methodology, most visible copy |
| `340b.js` | Map behavior, print payload, PA/federal bill cards, delegation table data, sparkline data, some provenance dates |
| `modules/impact-data.js` | National policy simulator scenario text and illustrative numbers |
| `modules/pa-impact-data.js` | Pennsylvania impact scenario text and illustrative numbers; anchors **72** and **7.95** |
| `OW_report_dashboard.html` | Pennsylvania hospital sustainability report (context for **49% / 53% / 49%**) |
| `data/pa-districts/` | District map support files and metadata |

---

## 9. Suggested citation line for external decks

> Figures follow HAP’s 340B advocacy dashboard unless noted. State law: MultiState, ASHP, America’s Essential Hospitals (HAP verification, March 2026). Community benefit: 340B Health / AHA reported totals (2024). Audits: HRSA Program Integrity FY 2024. Pennsylvania hospital count: HRSA OPAIS, HAP-reconciled (January 2026). Market share: IQVIA (2023). Pennsylvania operating statistics: Oliver Wyman analysis for HAP (see PA hospitals report). Illustrative simulator and scenario numbers are not government statistics.

---

*Generated to match the repository’s stated sources and structure. Update this file when you change headline KPIs, `STATE_340B`, or the Data sources table.*
