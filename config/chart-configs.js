/**
 * Chart & Visualization Config — 340B Dashboard
 * =============================================
 * Central place for chart options, colors, and display defaults.
 * Map-specific options stay in config/settings.js (map.*).
 *
 * NOVICE: Edit here to change how charts or KPI strips look (e.g. number format, colors).
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
    }
  };

  if (global.CHART_CONFIG === undefined) {
    global.CHART_CONFIG = CHART_CONFIG;
  }
})(typeof window !== "undefined" ? window : this);
