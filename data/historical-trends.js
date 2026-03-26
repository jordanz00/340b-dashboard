/**
 * Historical Trends — 340B Dashboard (100X / Wave 2)
 * ===================================================
 * Year-over-year and policy adoption timeline data for charts and analytics.
 * Depends on STATE_340B (state-data.js) and complements analytics/policy-insights.js.
 *
 * NOVICE: Edit state law data in state-data.js; this file only derives trends.
 */
(function (global) {
  "use strict";

  /** Year-over-year adoption counts: [{ year, count }, ...] sorted by year ascending. */
  function getAdoptionTrendArray() {
    if (typeof POLICY_INSIGHTS !== "undefined" && POLICY_INSIGHTS && POLICY_INSIGHTS.getAdoptionTimelineArray) {
      return POLICY_INSIGHTS.getAdoptionTimelineArray();
    }
    var timeline = {};
    if (typeof STATE_340B === "object" && STATE_340B) {
      Object.keys(STATE_340B).forEach(function (abbr) {
        var row = STATE_340B[abbr];
        if (!row || row.y == null) return;
        var y = Number(row.y);
        timeline[y] = (timeline[y] || 0) + 1;
      });
    }
    return Object.keys(timeline)
      .map(function (y) { return { year: parseInt(y, 10), count: timeline[y] }; })
      .sort(function (a, b) { return a.year - b.year; });
  }

  /** Cumulative adoptions by year: [{ year, cumulative }, ...] for area/line charts. */
  function getCumulativeAdoptions() {
    var arr = getAdoptionTrendArray();
    var cum = 0;
    return arr.map(function (d) {
      cum += d.count;
      return { year: d.year, cumulative: cum };
    });
  }

  var HISTORICAL_TRENDS = {
    getAdoptionTrendArray: getAdoptionTrendArray,
    getCumulativeAdoptions: getCumulativeAdoptions
  };

  if (typeof global !== "undefined") {
    global.HISTORICAL_TRENDS = HISTORICAL_TRENDS;
  }
})(typeof window !== "undefined" ? window : this);
