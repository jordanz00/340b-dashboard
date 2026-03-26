/**
 * Agent 4 — Interactivity & Analytics
 * Filters, hover highlights, tooltips, responsiveness, new visualizations.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var js = shared.readProjectFile("340b.js");
  var html = shared.readProjectFile("340b.html");
  var css = shared.readProjectFile("340b.css");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-04-interactivity" });

  var hasFilter = js && (/state-filter|applyStateFilter|currentFilter/.test(js));
  var hasMapTooltip = js && (/map-tooltip|mapTooltip|tooltip/.test(js));
  var hasRankedTable = html && (/ranked-state-table|ranked-state-tbody/.test(html));
  var hasResponsive = css && (/@media|min-width|max-width/.test(css));

  if (!hasFilter) {
    proposals.push(shared.createProposal("agent-04-interactivity", context.wave || 4, {
      targetFile: "340b.js",
      description: "Implement state filter (All / Protection / No protection) with dropdown sync",
      executiveImpact: 7,
      maintainability: 6,
      performance: 5,
      instructions: ["Add filter buttons and optional dropdown; sync selection and applyStateFilter()."]
    }));
  }
  if (!hasMapTooltip) {
    proposals.push(shared.createProposal("agent-04-interactivity", context.wave || 4, {
      targetFile: "340b.js",
      description: "Add map hover tooltips with state name and protection status",
      executiveImpact: 6,
      maintainability: 5,
      instructions: ["Show tooltip on state hover with state name and protection/cp status."]
    }));
  }
  if (!hasRankedTable) {
    proposals.push(shared.createProposal("agent-04-interactivity", context.wave || 4, {
      targetFile: "340b.html",
      description: "Add ranked state table (by year enacted) for quick scan",
      executiveImpact: 6,
      maintainability: 6,
      instructions: ["Add table of states with protection, sorted by year enacted; fill via JS."]
    }));
  }
  if (!hasResponsive) {
    proposals.push(shared.createProposal("agent-04-interactivity", context.wave || 4, {
      targetFile: "340b.css",
      description: "Add responsive breakpoints for mobile and tablet",
      executiveImpact: 6,
      maintainability: 7,
      performance: 5,
      instructions: ["Use @media (min-width: ...) for grid and font scaling on small screens."]
    }));
  }

  log.push({ action: "complete", proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Interactivity: " + proposals.length + " proposal(s) for filters, tooltips, and responsiveness."
  };
}

module.exports = { run };
