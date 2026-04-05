/**
 * Chart & Visualization Config — 340B Dashboard
 * =============================================
 * WHO THIS IS FOR: Any developer working on charts, KPIs, or data visuals.
 * WHAT IT DOES: Central registry of every chart/visual in the dashboard with
 *   its data source, MetricKey references, and Power BI visual type mapping.
 * HOW IT CONNECTS: Referenced by 340b-mobile.js and 340b.js for rendering;
 *   mirrors powerbi/semantic-layer-registry.json "charts" section for PBI parity.
 *
 * POWER BI MAPPING: Each entry's pbiVisualType and goldTables fields correspond
 *   to the suggested Power BI visual and warehouse tables. See docs/POWER-BI-DATA-MODEL-MAPPING.md.
 *
 * NOVICE: Edit here to change how charts or KPI strips look (e.g. number format, colors).
 *   The "charts" array documents every visual — add a new entry when you add a new chart.
 */
(function (global) {
  "use strict";

  var CHART_CONFIG = {
    /** Executive/KPI strip: number and label display */
    kpi: {
      communityBenefitFormat: "currency",
      marketShareDecimals: 0,
      paHospitalsLabel: "PA hospitals"
    },

    /** Color keys for state map and lists (must match CSS and 340b.js) */
    mapStates: {
      protection: "protection",
      noProtection: "no-protection"
    },

    /**
     * Chart registry — every rendered visual, its data source, fields, and PBI mapping.
     * Keep in sync with powerbi/semantic-layer-registry.json "charts" section.
     */
    charts: [
      {
        chartId: "protection-map",
        title: "Contract Pharmacy Protection by State",
        dataSource: "DataLayer.getStates()",
        fields: [
          { field: "stateCode", metricKey: null, goldColumn: "dim_state_law.StateCode" },
          { field: "hasContractPharmacyLaw", metricKey: "US_STATES_CP_PROTECTION_COUNT", goldColumn: "dim_state_law.ContractPharmacyProtected" },
          { field: "hasPbmLaw", metricKey: null, goldColumn: "dim_state_law.PBMProtected" },
          { field: "yearEnacted", metricKey: null, goldColumn: "dim_state_law.YearEnacted" }
        ],
        pbiVisualType: "Shape Map or Filled Map",
        goldTables: ["dim_state_law"]
      },
      {
        chartId: "oversight-comparison",
        title: "HRSA Oversight: Hospital vs Manufacturer Audits",
        dataSource: "DataLayer.getPA()",
        fields: [
          { field: "hrsaHospitalAudits", metricKey: "HRSA_HOSPITAL_AUDIT_COUNT", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "hrsaManufacturerAudits", metricKey: "HRSA_MANUFACTURER_AUDIT_COUNT", goldColumn: "fact_dashboard_kpi.ValueNumeric" }
        ],
        pbiVisualType: "Clustered Bar Chart",
        goldTables: ["fact_dashboard_kpi"]
      },
      {
        chartId: "pa-district-map",
        title: "PA Legislative District Map with 340B Hospitals",
        dataSource: "modules/pa-district-map.js (GeoJSON + pa-340b-hospitals.js)",
        fields: [
          { field: "districtBoundaries", metricKey: null, source: "data/pa-districts/*.js" },
          { field: "hospitalLocations", metricKey: null, source: "data/pa-districts/pa-340b-hospitals.js" }
        ],
        pbiVisualType: "ArcGIS or Shape Map with hospital layer",
        goldTables: ["dim_pa_hospitals (future)"],
        pbiReady: false
      },
      {
        chartId: "kpi-home-strip",
        title: "Home Tab — Four Headline KPIs",
        dataSource: "DataLayer.getKPIs()",
        fields: [
          { field: "PA_HOSPITALS_340B_COUNT", metricKey: "PA_HOSPITALS_340B_COUNT", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "COMMUNITY_BENEFIT_TOTAL_BILLIONS", metricKey: "COMMUNITY_BENEFIT_TOTAL_BILLIONS", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "US_STATES_CP_PROTECTION_COUNT", metricKey: "US_STATES_CP_PROTECTION_COUNT", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "US_STATES_NO_CP_PROTECTION_COUNT", metricKey: "US_STATES_NO_CP_PROTECTION_COUNT", goldColumn: "fact_dashboard_kpi.ValueNumeric" }
        ],
        pbiVisualType: "Multi-row Card",
        goldTables: ["fact_dashboard_kpi"]
      },
      {
        chartId: "pa-focus-stats",
        title: "PA Focus — State-Specific Stat Cards",
        dataSource: "DataLayer.getPA()",
        fields: [
          { field: "hospitalCount", metricKey: "PA_HOSPITALS_340B_COUNT", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "ruralPercent", metricKey: "PA_RURAL_HOSPITAL_PCT", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "operatingAtLossPercent", metricKey: "PA_HOSPITALS_OPERATING_LOSS_PCT", goldColumn: "fact_dashboard_kpi.ValueNumeric" },
          { field: "ldServicesPercent", metricKey: "PA_LD_SERVICES_PCT", goldColumn: "fact_dashboard_kpi.ValueNumeric" }
        ],
        pbiVisualType: "Multi-row Card",
        goldTables: ["fact_dashboard_kpi"]
      }
    ]
  };

  if (global.CHART_CONFIG === undefined) {
    global.CHART_CONFIG = CHART_CONFIG;
  }
})(typeof window !== "undefined" ? window : this);
