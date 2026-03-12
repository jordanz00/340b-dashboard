/**
 * HAP 340B Pennsylvania Impact Mode — Engine
 * ===========================================
 *
 * Pure logic. Computes PA-specific impact for a scenario.
 * No DOM, no side effects. Isolated from core dashboard.
 */

(function (global) {
  "use strict";

  var PA = global.HAP340B_PA_IMPACT;

  if (!PA) {
    console.warn("[PA Impact] HAP340B_PA_IMPACT not loaded. pa-impact-data.js must load first.");
    return;
  }

  /* ==========================================
     PA IMPACT ENGINE — COMPUTE
     ==========================================
     Returns PA impact for a given scenario ID.
     */
  function getPaImpact(scenarioId) {
    var estimates = PA.PA_SCENARIO_ESTIMATES[scenarioId];
    if (!estimates) return null;

    var anchors = PA.PA_ANCHORS;
    return {
      scenarioId: scenarioId,
      hospitalsImpacted: estimates.hospitalsImpacted,
      hospitalsNote: estimates.hospitalsNote,
      pharmaciesAffected: estimates.pharmaciesAffected,
      pharmaciesNote: estimates.pharmaciesNote,
      patientAccessChange: estimates.patientAccessChange,
      patientAccessNote: estimates.patientAccessNote,
      communityBenefitImpact: estimates.communityBenefitImpact,
      communityBenefitNote: estimates.communityBenefitNote,
      narrative: estimates.narrative,
    };
  }

  PA.getPaImpact = getPaImpact;
  PA.getAnchors = function () { return PA.PA_ANCHORS; };

})(typeof window !== "undefined" ? window : this);
