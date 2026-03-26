/**
 * Agent 6 — Performance & Optimization
 * Refactor for maintainability, reduce memory, optimize DOM, cache and lazy-load.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var js = shared.readProjectFile("340b.js");
  var settings = shared.readProjectFile("config/settings.js");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-06-performance" });

  var hasCacheDom = js && (/cacheDom|appState\.dom/.test(js));
  var hasDeferPanels = settings && (/deferSecondaryPanels|performance/.test(settings));
  var hasRunTaskSafely = js && (/runTaskSafely|try\s*\{/.test(js));
  var hasResizeThrottle = js && (/(resizeTimer|setTimeout.*resize|debounce)/.test(js));

  if (!hasCacheDom) {
    proposals.push(shared.createProposal("agent-06-performance", context.wave || 6, {
      targetFile: "340b.js",
      description: "Cache DOM references to avoid repeated querySelector/getElementById",
      executiveImpact: 3,
      maintainability: 7,
      performance: 8,
      instructions: ["Store frequently used DOM nodes in an object (e.g. appState.dom) and reuse."]
    }));
  }
  if (!hasDeferPanels) {
    proposals.push(shared.createProposal("agent-06-performance", context.wave || 6, {
      targetFile: "config/settings.js",
      description: "Add performance.deferSecondaryPanels to defer below-fold updates",
      executiveImpact: 4,
      maintainability: 5,
      performance: 8,
      instructions: ["Add performance: { deferSecondaryPanels: true }; run secondary panel fill in requestAnimationFrame."]
    }));
  }
  if (!hasRunTaskSafely) {
    proposals.push(shared.createProposal("agent-06-performance", context.wave || 6, {
      targetFile: "340b.js",
      description: "Wrap init tasks in try/catch so one failure does not break the app",
      executiveImpact: 5,
      maintainability: 8,
      performance: 3,
      instructions: ["Use runTaskSafely(name, fn) or try/catch around each init step."]
    }));
  }
  if (!hasResizeThrottle && js && /resize|addEventListener.*resize/.test(js)) {
    proposals.push(shared.createProposal("agent-06-performance", context.wave || 6, {
      targetFile: "340b.js",
      description: "Throttle or debounce window resize handler for map redraw",
      executiveImpact: 2,
      maintainability: 4,
      performance: 7,
      instructions: ["Use setTimeout to throttle resize so map does not redraw on every resize event."]
    }));
  }

  log.push({ action: "complete", proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Performance: " + proposals.length + " proposal(s) for caching and lazy-load."
  };
}

module.exports = { run };
