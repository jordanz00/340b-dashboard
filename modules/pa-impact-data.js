/**
 * HAP 340B Pennsylvania Impact Mode — Scenario Data
 * ==================================================
 *
 * PA-specific estimates for each policy scenario.
 * Values support advocacy storytelling for hospital leadership.
 *
 * HOW TO MODIFY
 * - Edit PA_ANCHORS (baseline facts)
 * - Edit PA_SCENARIO_ESTIMATES
 * - Keep scenario keys aligned with impact-data.js
 */

(function (global) {
  "use strict";

  var PA_NS = global.HAP340B_PA_IMPACT = global.HAP340B_PA_IMPACT || {};

  /* ==========================================
     PENNSYLVANIA BASELINE ANCHORS
     ==========================================
     Facts used across all scenarios. Sync with dashboard KPI and state-data.
     */
  PA_NS.PA_ANCHORS = {
    hospitalsParticipating: 72,
    nationalCommunityBenefitB: 7.95,
    paShareOfNationalPct: 4.2,
  };

  /* ==========================================
     SCENARIO KEYS
     ==========================================
     Must match impact-data.js (EXPAND_PROTECTIONS, CURRENT_STATUS, REMOVE_PROTECTIONS).
     */
  PA_NS.SCENARIO_EXPAND = "EXPAND_PROTECTIONS";
  PA_NS.SCENARIO_CURRENT = "CURRENT_STATUS";
  PA_NS.SCENARIO_REMOVE = "REMOVE_PROTECTIONS";

  /* ==========================================
     PA-SPECIFIC SCENARIO ESTIMATES
     ==========================================
     Per-scenario impact for Pennsylvania hospitals, pharmacies, patients, community benefit.
     */
  PA_NS.PA_SCENARIO_ESTIMATES = {
    EXPAND_PROTECTIONS: {
      hospitalProgramStatus: "Protected",
      hospitalsNote: "72 PA hospitals would gain contract pharmacy protection and operate with predictable pharmacy networks",
      pharmaciesAffected: 420,
      pharmaciesNote: "Estimated PA contract pharmacy network expansion",
      patientAccessChange: "High",
      patientAccessNote: "More patients could access affordable medications at local pharmacies",
      communityBenefitImpact: "Stable to growing",
      communityBenefitNote: "Program sustainability would improve; community benefit programs could expand",
      narrative: "If Pennsylvania enacted contract pharmacy protection, all 72 participating hospitals would operate with predictable pharmacy networks. Patient access and community benefit programs would strengthen.",
    },
    CURRENT_STATUS: {
      hospitalProgramStatus: "Exposed",
      hospitalsNote: "72 PA hospitals participate today; PA has no state protection law — programs rely on manufacturer policies",
      pharmaciesAffected: 180,
      pharmaciesNote: "Limited by manufacturer restrictions; single-pharmacy or narrow networks",
      patientAccessChange: "Constrained",
      patientAccessNote: "Many patients face distance or network barriers to 340B pricing",
      communityBenefitImpact: "At risk",
      communityBenefitNote: "Exposed to manufacturer policy changes; program integrity under pressure",
      narrative: "Pennsylvania has no 340B contract pharmacy protection. Hospital programs operate under manufacturer restrictions. Community benefit and patient access remain vulnerable.",
    },
    REMOVE_PROTECTIONS: {
      hospitalProgramStatus: "At risk",
      hospitalsNote: "72 PA hospitals would face harsher manufacturer limits; pharmacy networks would shrink",
      pharmaciesAffected: 60,
      pharmaciesNote: "Pharmacy network would shrink; more single-pharmacy constraints",
      patientAccessChange: "Low",
      patientAccessNote: "Patient access would decline; rural and underserved areas hit hardest",
      communityBenefitImpact: "Declining",
      communityBenefitNote: "Community benefit programs would be threatened across all PA hospitals",
      narrative: "If existing state protections were rolled back nationally, PA hospitals would face a harsher environment. Pharmacy networks would shrink and patient access would suffer.",
    },
  };

  PA_NS.getScenarioIds = function () {
    return [PA_NS.SCENARIO_EXPAND, PA_NS.SCENARIO_CURRENT, PA_NS.SCENARIO_REMOVE];
  };

})(typeof window !== "undefined" ? window : this);
