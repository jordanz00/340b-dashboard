/**
 * Analytics — 340B Dashboard Logic Layer (100X)
 * ==============================================
 * Thin wrapper exposing policy insights and validation for the dashboard.
 * Load after analytics/policy-insights.js and analytics/validate-data.js.
 *
 * NOVICE: Edit metrics in analytics/policy-insights.js; this file only re-exports.
 */
(function (global) {
  "use strict";

  var ANALYTICS = {
    /** Policy adoption timeline, national benchmark, recent adopters (from policy-insights.js). */
    policy: typeof POLICY_INSIGHTS !== "undefined" ? POLICY_INSIGHTS : null,
    /** Historical trend arrays (from data/historical-trends.js if loaded). */
    trends: typeof HISTORICAL_TRENDS !== "undefined" ? HISTORICAL_TRENDS : null
  };

  if (typeof global !== "undefined") {
    global.ANALYTICS = ANALYTICS;
  }
})(typeof window !== "undefined" ? window : this);
