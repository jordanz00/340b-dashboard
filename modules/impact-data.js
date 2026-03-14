/**
 * HAP 340B Policy Impact Simulator — Scenario Data
 * ==================================================
 *
 * Plain-language scenarios for advocates and lay audiences.
 * Values are for storytelling—not predictive modeling.
 *
 * HOW TO MODIFY
 * - Edit scenario labels and copy in SCENARIOS
 * - Edit estimated values in SCENARIO_ESTIMATES
 * - Keep keys (EXPAND_PROTECTIONS, CURRENT_STATUS, REMOVE_PROTECTIONS) stable
 */

(function (global) {
  "use strict";

  var IMPACT_NS = global.HAP340B_IMPACT = global.HAP340B_IMPACT || {};

  IMPACT_NS.SCENARIO_EXPAND = "EXPAND_PROTECTIONS";
  IMPACT_NS.SCENARIO_CURRENT = "CURRENT_STATUS";
  IMPACT_NS.SCENARIO_REMOVE = "REMOVE_PROTECTIONS";

  IMPACT_NS.SCENARIOS = {
    EXPAND_PROTECTIONS: {
      id: "EXPAND_PROTECTIONS",
      label: "Protect the discount everywhere",
      description: "Every state protects hospitals’ ability to use the 340B discount with community pharmacies.",
      narrative: "More patients get affordable meds. Hospitals and pharmacies work together in every state. Programs grow.",
      takeaway: "Maximum stability for hospitals and patients.",
    },
    CURRENT_STATUS: {
      id: "CURRENT_STATUS",
      label: "Keep today’s mix",
      description: "Some states protect the discount; many don’t.",
      narrative: "Patchwork: some hospitals and patients benefit; many stay exposed.",
      takeaway: "Programs continue with moderate risk.",
    },
    REMOVE_PROTECTIONS: {
      id: "REMOVE_PROTECTIONS",
      label: "Weaken or remove protections",
      description: "States roll back laws that protect the discount.",
      narrative: "Fewer patients get the benefit. Hospital programs at risk. Harder to serve our communities.",
      takeaway: "Access and hospital programs at high risk.",
    },
  };

  IMPACT_NS.SCENARIO_ESTIMATES = {
    EXPAND_PROTECTIONS: {
      pharmaciesImpacted: 12000,
      pharmaciesDisplayValue: null,
      pharmaciesLabel: "pharmacies",
      pharmaciesNote: "Hospitals could partner with this many pharmacies to get discount meds to patients.",
      patientAccessImpact: "Strong",
      patientAccessNote: "More patients can get affordable medications close to home.",
      hospitalFundingImpact: "Stable",
      hospitalFundingNote: "Predictable rules; programs can grow.",
    },
    CURRENT_STATUS: {
      pharmaciesImpacted: 4500,
      pharmaciesDisplayValue: null,
      pharmaciesLabel: "pharmacies",
      pharmaciesNote: "Roughly this many pharmacy partnerships today; many states lack protection.",
      patientAccessImpact: "Mixed",
      patientAccessNote: "Depends on the state—some protected, many not.",
      hospitalFundingImpact: "Uneven",
      hospitalFundingNote: "Protected states are on firmer ground.",
    },
    REMOVE_PROTECTIONS: {
      pharmaciesImpacted: 0,
      pharmaciesDisplayValue: "At risk",
      pharmaciesLabel: "partnerships",
      pharmaciesNote: "Existing hospital–pharmacy partnerships would be threatened.",
      patientAccessImpact: "Weak",
      patientAccessNote: "Fewer patients would get the discount; access shrinks.",
      hospitalFundingImpact: "At risk",
      hospitalFundingNote: "Programs that serve our communities would be at risk.",
    },
  };

})(typeof window !== "undefined" ? window : this);
