/**
 * HAP 340B Policy Impact Simulator — Core Logic
 * ==============================================
 *
 * Pure computation. No DOM, no side effects.
 * Takes a scenario ID and returns structured impact data for the UI.
 *
 * ISOLATION: This module does NOT depend on 340b.js, the map, or print/PDF.
 * It only reads HAP340B_IMPACT from impact-data.js.
 */

(function (global) {
  "use strict";

  var IMPACT = global.HAP340B_IMPACT;

  if (!IMPACT) {
    console.warn("[Impact Simulator] HAP340B_IMPACT not loaded. impact-data.js must load first.");
    return;
  }

  /* ==========================================
     IMPACT SIMULATOR — COMPUTE
     ==========================================
     Returns the combined scenario + estimates for a given scenario ID.
     */
  function getScenarioImpact(scenarioId) {
    var scenario = IMPACT.SCENARIOS[scenarioId];
    var estimates = IMPACT.SCENARIO_ESTIMATES[scenarioId];

    if (!scenario || !estimates) {
      return null;
    }

    return {
      id: scenario.id,
      label: scenario.label,
      description: scenario.description,
      narrative: scenario.narrative,
      pharmaciesImpacted: estimates.pharmaciesImpacted,
      pharmaciesLabel: estimates.pharmaciesLabel || "pharmacies",
      patientAccessImpact: estimates.patientAccessImpact,
      patientAccessNote: estimates.patientAccessNote,
      hospitalFundingImpact: estimates.hospitalFundingImpact,
      hospitalFundingNote: estimates.hospitalFundingNote,
    };
  }

  /* ==========================================
     PUBLIC API
     ==========================================
     Exposed on HAP340B_IMPACT for use by impact-ui.js.
     */
  IMPACT.getScenarioImpact = getScenarioImpact;

  IMPACT.getScenarioIds = function () {
    return [IMPACT.SCENARIO_EXPAND, IMPACT.SCENARIO_CURRENT, IMPACT.SCENARIO_REMOVE];
  };

})(typeof window !== "undefined" ? window : this);
