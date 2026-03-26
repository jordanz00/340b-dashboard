/**
 * Policy Insights — 340B Advocacy Dashboard (Wave 2)
 * ===================================================
 * Computes advanced metrics from STATE_340B for executive summaries:
 * - Policy adoption timeline (states enacting by year)
 * - National benchmark (% of states with contract pharmacy protection)
 * - Recent adopters (e.g. 2024–2025)
 * - Executive summary text for the dashboard
 *
 * NOVICE: Edit STATE_340B in state-data.js; this file only derives metrics.
 * Add more metrics (e.g. hospital-type breakdown) when data is available.
 */
(function (global) {
  "use strict";

  /** Build adoption timeline: { year: count } for states with enacted year. */
  function getAdoptionTimeline() {
    var timeline = {};
    if (typeof STATE_340B !== "object" || !STATE_340B) return timeline;
    Object.keys(STATE_340B).forEach(function (abbr) {
      var row = STATE_340B[abbr];
      if (!row || row.y == null) return;
      var y = Number(row.y);
      if (!timeline[y]) timeline[y] = 0;
      timeline[y] += 1;
    });
    return timeline;
  }

  /** States that adopted contract pharmacy protection in the last N years (from a reference year). */
  function getRecentAdopters(refYear, lastNYears) {
    refYear = refYear != null ? refYear : 2025;
    lastNYears = lastNYears != null ? lastNYears : 2;
    var minYear = refYear - lastNYears;
    var list = [];
    if (typeof STATE_340B !== "object" || !STATE_340B) return list;
    Object.keys(STATE_340B).forEach(function (abbr) {
      var row = STATE_340B[abbr];
      if (!row || !row.cp || row.y == null) return;
      if (row.y >= minYear && row.y <= refYear) list.push({ abbr: abbr, year: row.y });
    });
    list.sort(function (a, b) { return b.year - a.year; });
    return list;
  }

  /** National benchmark: share of states (with data) that have contract pharmacy protection. */
  function getNationalBenchmark() {
    if (typeof STATE_340B !== "object" || !STATE_340B) return { percent: 0, withProtection: 0, total: 0 };
    var keys = Object.keys(STATE_340B);
    var withProtection = keys.filter(function (abbr) { return STATE_340B[abbr] && STATE_340B[abbr].cp === true; }).length;
    var total = keys.length;
    var percent = total ? Math.round((withProtection / total) * 100) : 0;
    return { percent: percent, withProtection: withProtection, total: total };
  }

  /** Executive summary for policy adoption (one short paragraph). */
  function getPolicyAdoptionSummary() {
    var bench = getNationalBenchmark();
    var recent = getRecentAdopters(2025, 2);
    var text = bench.total + " states are tracked. " + bench.withProtection + " (" + bench.percent + "%) have enacted contract pharmacy protection.";
    if (recent.length > 0) {
      text += " " + recent.length + " state(s) adopted or expanded protection in 2024–2025.";
    }
    return text;
  }

  /** Adoption timeline as array of { year, count } for display (e.g. chart or list). */
  function getAdoptionTimelineArray() {
    var timeline = getAdoptionTimeline();
    return Object.keys(timeline)
      .map(function (y) { return { year: parseInt(y, 10), count: timeline[y] }; })
      .sort(function (a, b) { return a.year - b.year; });
  }

  var POLICY_INSIGHTS = {
    getAdoptionTimeline: getAdoptionTimeline,
    getAdoptionTimelineArray: getAdoptionTimelineArray,
    getRecentAdopters: getRecentAdopters,
    getNationalBenchmark: getNationalBenchmark,
    getPolicyAdoptionSummary: getPolicyAdoptionSummary
  };

  global.POLICY_INSIGHTS = POLICY_INSIGHTS;
})(typeof window !== "undefined" ? window : this);
