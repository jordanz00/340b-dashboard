/**
 * Dataset Metadata — 340B Advocacy Dashboard
 * ==========================================
 * Single source of truth for data provenance, versioning, and methodology.
 * Used by the "About Data" panel and for validation. Edit when you update data or methodology.
 *
 * NOVICE: Update lastUpdated and datasetVersion when you change state-data.js or CONFIG.
 */
(function (global) {
  "use strict";

  var DATASET_METADATA = {
    /** Human-readable dataset name */
    name: "340B State Law & Community Benefit",
    /** Version string; bump when you change STATE_340B or CONFIG in state-data.js */
    datasetVersion: "2.0",
    /** Last time the underlying data was updated (match state-data.js CONFIG.lastUpdated) */
    lastUpdated: "March 2026",
    /** Primary sources for state law and protection status */
    sources: [
      { name: "MultiState", role: "Legislative status", url: "https://www.multistate.us/", rel: "noopener noreferrer" },
      { name: "ASHP", role: "Pharmacy-policy cross-check", url: "https://www.ashp.org/", rel: "noopener noreferrer" },
      { name: "America's Essential Hospitals", role: "Advocacy confirmation", url: "https://essentialhospitals.org/", rel: "noopener noreferrer" }
    ],
    /** Community benefit and KPI sources */
    kpiSources: [
      { name: "340B Health", role: "Community benefit figures (with AHA survey context)", period: "2024", url: "https://www.340bhealth.org/", rel: "noopener noreferrer" },
      { name: "American Hospital Association", role: "Hospital community benefit reporting", period: "2024", url: "https://www.aha.org/", rel: "noopener noreferrer" },
      { name: "HRSA Program Integrity", role: "FY 2024 audit counts (179 covered entity, 5 manufacturer)", period: "2024", url: "https://www.hrsa.gov/opa/program-integrity/fy-24-audit-results", rel: "noopener noreferrer" },
      { name: "Commonwealth Fund", role: "7% of total U.S. drug market (340B) — cited in HAP Mar 2026 talking points", period: "2025 explainer", url: "https://www.commonwealthfund.org/publications/explainer/2025/aug/340b-drug-pricing-program-how-it-works-and-why-its-controversial", rel: "noopener noreferrer" }
    ],
    /**
     * HAP-approved March 2026 PDFs (same directory as 340b.html on deploy). Not https — listed for provenance;
     * linked from the dashboard methodology block with relative hrefs.
     */
    hapPriorityPdfFiles: [
      { name: "340B protects access to care in Pennsylvania (HAP fact sheet, March 2026)", file: "fact-sheet-hap-2026-protects-access-to-care-pennsylvania-march2026.pdf" },
      { name: "340B Drug Pricing Program — Talking Points (HAP, March 2026)", file: "340b-talking-points-march2026.pdf" }
    ],
    /** Short methodology note for the About Data panel */
    methodology:
      "Priority HAP materials (March 2026): fact-sheet-hap-2026-protects-access-to-care-pennsylvania-march2026.pdf and 340b-talking-points-march2026.pdf (same folder as the dashboard). Sources: MultiState · ASHP · America's Essential Hospitals (state law) · 340B Health · AHA (community benefit) · Commonwealth Fund (7% total U.S. drug market, per HAP talking points) · HRSA Program Integrity FY 2024 (audit counts). Verification order (state law): MultiState, then ASHP, then America's Essential Hospitals. Limitations: state law counts change as legislatures meet; community benefit totals are self-reported aggregates, not independently audited. PA operating statistics (49% / 53% / 49%): Oliver Wyman for HAP. Data stewardship: haponline.org/contact.",
    /** Optional: link to download raw or processed data (CSV/JSON). Leave empty if no public download. */
    downloadLink: "",
    /** License or use note */
    usageNote: "Data is for advocacy and policy education. Verify critical figures against primary sources before formal use."
  };

  /** Expose for dashboard and validation scripts */
  global.DATASET_METADATA = DATASET_METADATA;
})(typeof window !== "undefined" ? window : this);
