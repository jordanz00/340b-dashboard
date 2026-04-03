# Power BI report blueprint — 340B advocacy parity

Use this layout after the **semantic model** connects to **Gold** tables. Numbers on every visual must bind to **fields or measures**, not static text. Theme: [../powerbi/hap-340b-theme.json](../powerbi/hap-340b-theme.json). Measures: [../powerbi/measures-340b.dax](../powerbi/measures-340b.dax).

---

## Page 1 — Executive overview

| Visual | Data binding | Notes |
|--------|--------------|--------|
| Title + subtitle | `Data As Of Display` measure + static org title | Subtitle from `gold_dim_data_freshness` if preferred |
| KPI cards | `gold_fact_dashboard_kpi` via measures (one measure per official `MetricKey`) | e.g. PA hospitals, community benefit, protection count |
| Short methodology | Text box **or** single card pulling approved `MethodologyText` | No LLM-generated insight tiles |

**Interactivity:** None required; optional **slicer** on `AsOfDate` if multiple KPI snapshots exist.

---

## Page 2 — State map and filters

| Visual | Data binding | Notes |
|--------|--------------|--------|
| Filled map or Shape map | `StateName` or `StateCode` + color by `ContractPharmacyProtected` | Confirm org standard (Azure Maps vs built-in) |
| Slicer: protection | `ContractPharmacyProtected` | Mirrors All / Protection / No protection |
| Table or matrix | `StateCode`, `StateName`, `ContractPharmacyProtected`, `PBMProtected`, `YearEnacted` | Sortable; optional `Notes` column |

**Interactivity:** Cross-filter map ↔ table. **Tooltip page** (optional): show `Notes` + citation when hovering a state.

---

## Page 3 — State detail (drillthrough)

**Drillthrough on:** `gold_dim_state_law[StateCode]` (or from matrix row).

| Visual | Content |
|--------|---------|
| Card | State name, flags, year enacted |
| Text | `Notes` field—ensure length and wrapping |
| Related KPIs | Only if model relates state to facts; otherwise hide |

---

## Page 4 — Data freshness and sources

| Visual | Data binding |
|--------|--------------|
| Table | `gold_dim_data_freshness` columns |
| Table | Distinct `MetricKey`, `SourceCitation`, `AsOfDate` from `gold_fact_dashboard_kpi` |

Supports audit questions without mixing narrative with uncited AI text.

---

## Bookmarks (optional, advanced)

| Bookmark | Action |
|----------|--------|
| View: All states | Clear protection slicer |
| View: Protection only | Slicer = TRUE |
| View: No protection | Slicer = FALSE |

Use **buttons** linked to bookmarks to mimic the static filter chips.

---

## Accessibility

- Do not rely on color alone for protection vs non-protection; use **labels** or **patterns** where the built-in map allows, or a companion table.
- Slicer targets ≥ 44px height where possible (align with dashboard UX rules).

---

## Related

- [POWER-BI-DATA-MODEL-MAPPING.md](POWER-BI-DATA-MODEL-MAPPING.md)  
- [POWER-BI-PUBLISH-RUNBOOK.md](POWER-BI-PUBLISH-RUNBOOK.md)  
