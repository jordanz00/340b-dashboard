# Power BI — publish, refresh, and lineage runbook (340B)

Use this after the report is built in Power BI Desktop. Aligns with [HAP-POWER-BI-DATA-FACTORY-SPEC.md](HAP-POWER-BI-DATA-FACTORY-SPEC.md) §3 and §7.

---

## 1. Pre-publish checklist

- [ ] Dataset uses **only** IT-approved **Gold** tables or views (no personal Excel as primary source).  
- [ ] **Gateway** (if required) is installed and assigned to the data sources you use.  
- [ ] **Measures** match definitions agreed with Strategic Analytics (no ad-hoc `SUM` of ambiguous columns).  
- [ ] **RLS** roles tested if applicable (view as role in Desktop).  
- [ ] **Theme** applied; no hardcoded numbers in visuals that duplicate KPI measures.

---

## 2. Publish to the service

1. **Home → Publish** → select the **workspace** named in [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md).  
2. Open the dataset in **Power BI Service → Settings → Gateway and cloud connections**; map each source to credentials / gateway.  
3. **Scheduled refresh:** set frequency per org SLA; note **timezone** for `AsOfDate` alignment.  
4. Run **Refresh now** once and fix errors before announcing.

---

## 3. Certification and promotion

Per org policy:

1. Request **dataset certification** (or equivalent) from the owning team after DQ sign-off.  
2. Document **lineage:** for each `MetricKey`, link to warehouse column and upstream source (ADF/Fabric job name, extract date).  
3. Store the **data dictionary** or link to IT’s catalog in the workspace **description** or internal wiki.

---

## 4. Failure response

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Refresh failed — credentials | Expired secret or SPN | IT rotates credentials; update connection |
| Refresh failed — gateway | Gateway offline or wrong cluster | IT restores gateway; remap |
| Wrong numbers after refresh | Bad Gold load | Pause refresh; open pipeline incident per spec §6.4 |
| Partial blank visuals | RLS too strict | Review role filters |

---

## 5. Lineage template (copy to wiki or ticket)

| Metric / visual | Model table.column or measure | Gold object | Pipeline / source | Owner |
|-----------------|------------------------------|-------------|-------------------|-------|
| *example* | `[PA Hospitals 340B]` | `gold_fact_dashboard_kpi` | `MetricKey = PA_HOSPITALS_340B_COUNT` | Strategic Analytics |

---

## 6. Optional: static site parity

If leadership requires the public [340b.html](../340b.html) numbers to match Power BI for a given **as-of date**, treat that as a **governance** decision: either export from Gold to the static build job or clearly label different audiences. Do not manually sync numbers without pipeline control.

---

## Related

- [POWER-BI-READINESS-PLAYBOOK.md](POWER-BI-READINESS-PLAYBOOK.md)  
- [POWER-BI-IT-DISCOVERY-CHECKLIST.md](POWER-BI-IT-DISCOVERY-CHECKLIST.md)  
- [../powerbi/README.md](../powerbi/README.md)  
