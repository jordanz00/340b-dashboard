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
      { name: "340B Health and AHA survey", role: "Community benefit figures", period: "2024" },
      { name: "HRSA", role: "FY 2024: 179 covered entity audits, 5 manufacturer audits", period: "2024" }
    ],
    /** Short methodology note for the About Data panel */
    methodology: "State law data reflects enacted contract pharmacy and PBM protection laws. Verification order: MultiState → ASHP → America's Essential Hospitals. Community benefit from 340B Health and AHA (HAP/PA figures). HRSA Program Integrity FY 2024: 179 covered entity audits, 5 manufacturer audits.",
    /** Optional: link to download raw or processed data (CSV/JSON). Leave empty if no public download. */
    downloadLink: "",
    /** License or use note */
    usageNote: "Data is for advocacy and policy education. Verify critical figures against primary sources before formal use."
  };

  /** Expose for dashboard and validation scripts */
  global.DATASET_METADATA = DATASET_METADATA;
})(typeof window !== "undefined" ? window : this);
