/**
 * HAP 340B Policy Impact Simulator — Core Logic
 * ==============================================
 *
 * WHO THIS IS FOR: Anyone wiring the Policy simulator UI (340b.html or 340b-mobile.html).
 *
 * WHAT IT DOES: Pure functions — given a scenario id string, returns labels and illustrative
 * numbers for the briefing cards. No DOM, no network, no side effects.
 *
 * HOW IT CONNECTS: impact-data.js must load first (it creates window.HAP340B_IMPACT).
 * impact-ui.js calls IMPACT.getScenarioImpact() when users tap scenario buttons.
 *
 * COMPLIANCE: Values are advocacy illustrations — not HRSA statistics. See semantic-layer-registry
 * advocacyTools.policyImpactSimulator and docs/DATA-DICTIONARY.md §1a.
 *
 * ISOLATION: Does NOT depend on 340b.js, the map, or print/PDF.
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
      takeaway: scenario.takeaway || "",
      pharmaciesImpacted: estimates.pharmaciesImpacted,
      pharmaciesDisplayValue: estimates.pharmaciesDisplayValue != null ? estimates.pharmaciesDisplayValue : null,
      pharmaciesLabel: estimates.pharmaciesLabel || "pharmacies",
      pharmaciesNote: estimates.pharmaciesNote != null ? estimates.pharmaciesNote : estimates.patientAccessNote,
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
