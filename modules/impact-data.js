/**
 * HAP 340B Policy Impact Simulator — Scenario Data
 * ==================================================
 *
 * Defines the three policy scenarios and their estimated impact values.
 * Values are for executive storytelling and advocacy—not predictive modeling.
 *
 * HOW TO MODIFY
 * - Edit scenario labels and copy in SCENARIOS
 * - Edit estimated values in SCENARIO_ESTIMATES
 * - Keep keys (EXPAND_PROTECTIONS, CURRENT_STATUS, REMOVE_PROTECTIONS) stable
 *
 * This file is read by impact-simulator.js and impact-ui.js.
 */

(function (global) {
  "use strict";

  var IMPACT_NS = global.HAP340B_IMPACT = global.HAP340B_IMPACT || {};

  /* ==========================================
     SCENARIO KEYS
     ==========================================
     Used by simulator logic. Do not rename without updating impact-simulator.js.
     */
  IMPACT_NS.SCENARIO_EXPAND = "EXPAND_PROTECTIONS";
  IMPACT_NS.SCENARIO_CURRENT = "CURRENT_STATUS";
  IMPACT_NS.SCENARIO_REMOVE = "REMOVE_PROTECTIONS";

  /* ==========================================
     SCENARIO DEFINITIONS
     ==========================================
     Labels and narrative copy for each policy scenario.
     */
  IMPACT_NS.SCENARIOS = {
    EXPAND_PROTECTIONS: {
      id: "EXPAND_PROTECTIONS",
      label: "Expand protections nationwide",
      description: "All states enact contract pharmacy protection.",
      narrative: "Patient access up. Predictable pharmacy networks. Programs grow.",
    },
    CURRENT_STATUS: {
      id: "CURRENT_STATUS",
      label: "Current status",
      description: "Today's mix of protected and unprotected states.",
      narrative: "Some benefit; many exposed. Patchwork of state laws.",
    },
    REMOVE_PROTECTIONS: {
      id: "REMOVE_PROTECTIONS",
      label: "Remove existing protections",
      description: "Rollback enacted state protections.",
      narrative: "Access down. Programs at risk. Patient continuity threatened.",
    },
  };

  /* ==========================================
     ESTIMATED IMPACT VALUES
     ==========================================
     Used for storytelling. Not predictive—align with advocacy messaging.
     */
  IMPACT_NS.SCENARIO_ESTIMATES = {
    EXPAND_PROTECTIONS: {
      pharmaciesImpacted: 12000,
      pharmaciesLabel: "pharmacies",
      patientAccessImpact: "High",
      patientAccessNote: "Nationwide contract pharmacy access",
      hospitalFundingImpact: "Stable",
      hospitalFundingNote: "Predictable networks; programs expand",
    },
    CURRENT_STATUS: {
      pharmaciesImpacted: 4500,
      pharmaciesLabel: "pharmacies",
      patientAccessImpact: "Mixed",
      patientAccessNote: "~25 states protected; many exposed",
      hospitalFundingImpact: "Variable",
      hospitalFundingNote: "Protected states have steadier revenue",
    },
    REMOVE_PROTECTIONS: {
      pharmaciesImpacted: 0,
      pharmaciesLabel: "pharmacies",
      patientAccessImpact: "Low",
      patientAccessNote: "Access would shrink significantly",
      hospitalFundingImpact: "At risk",
      hospitalFundingNote: "Program sustainability threatened",
    },
  };

})(typeof window !== "undefined" ? window : this);
