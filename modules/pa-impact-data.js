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
      hospitalsNote: "72 PA hospitals gain protection; predictable pharmacy networks",
      pharmaciesAffected: 420,
      pharmaciesNote: "Estimated PA network expansion",
      patientAccessChange: "High",
      patientAccessNote: "More patients access affordable meds at local pharmacies",
      communityBenefitImpact: "Stable to growing",
      communityBenefitNote: "Program sustainability improves; community benefit expands",
      narrative: "PA enacts protection. All 72 hospitals operate with predictable networks. Patient access and community benefit strengthen.",
    },
    CURRENT_STATUS: {
      hospitalProgramStatus: "Exposed",
      hospitalsNote: "72 PA hospitals participate; PA has no state protection — rely on manufacturer policies",
      pharmaciesAffected: 180,
      pharmaciesNote: "Limited by manufacturer restrictions; narrow networks",
      patientAccessChange: "Constrained",
      patientAccessNote: "Distance and network barriers to 340B pricing",
      communityBenefitImpact: "At risk",
      communityBenefitNote: "Exposed to manufacturer policy changes",
      narrative: "PA has no contract pharmacy protection. Programs operate under manufacturer limits. Community benefit and patient access remain vulnerable.",
    },
    REMOVE_PROTECTIONS: {
      hospitalProgramStatus: "At risk",
      hospitalsNote: "72 PA hospitals face harsher limits; networks shrink",
      pharmaciesAffected: 60,
      pharmaciesNote: "Network shrinks; single-pharmacy constraints increase",
      patientAccessChange: "Low",
      patientAccessNote: "Access declines; rural and underserved hit hardest",
      communityBenefitImpact: "Declining",
      communityBenefitNote: "Community benefit threatened across PA hospitals",
      narrative: "National rollback. PA faces harsher limits. Networks shrink; patient access suffers.",
    },
  };

  PA_NS.getScenarioIds = function () {
    return [PA_NS.SCENARIO_EXPAND, PA_NS.SCENARIO_CURRENT, PA_NS.SCENARIO_REMOVE];
  };

})(typeof window !== "undefined" ? window : this);
