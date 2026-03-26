/**
 * Agent 1 — Data Integrity & Validation
 * Validates raw/processed datasets, metadata, timestamps; suggests corrections.
 */
"use strict";

var path = require("path");
var shared = require("./shared");

var ROOT = shared.ROOT;

function run(context) {
  var log = [];
  var proposals = [];
  var stateData = shared.readProjectFile("state-data.js");
  var meta = shared.readProjectFile("data/dataset-metadata.js");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-01-data-integrity" });

  if (!stateData) {
    log.push({ action: "error", message: "state-data.js not found" });
    return { proposals: [], log, summary: "Data Integrity: state-data.js missing." };
  }

  var warnings = [];
  if (!meta) warnings.push("data/dataset-metadata.js not found.");
  if (!/CONFIG\s*=\s*\{/.test(stateData)) warnings.push("CONFIG object not found in state-data.js.");
  if (!/STATE_340B\s*=\s*\{/.test(stateData)) warnings.push("STATE_340B not found.");
  if (!/STATE_NAMES\s*=\s*\{/.test(stateData)) warnings.push("STATE_NAMES not found.");
  if (meta && !/lastUpdated:\s*["']/.test(meta)) warnings.push("dataset-metadata.js missing lastUpdated.");
  if (stateData && meta) {
    var configMatch = stateData.match(/lastUpdated:\s*["']([^"']+)["']/);
    var metaMatch = meta.match(/lastUpdated:\s*["']([^"']+)["']/);
    if (configMatch && metaMatch && configMatch[1] !== metaMatch[1]) {
      warnings.push("CONFIG.lastUpdated and DATASET_METADATA.lastUpdated out of sync.");
      proposals.push(shared.createProposal("agent-01-data-integrity", context.wave || 1, {
        changeType: "sync",
        targetFile: "data/dataset-metadata.js",
        description: "Sync lastUpdated with state-data.js CONFIG.lastUpdated",
        executiveImpact: 3,
        maintainability: 8,
        instructions: ["Set lastUpdated in data/dataset-metadata.js to match CONFIG.lastUpdated in state-data.js."]
      }));
    }
  }

  var stateIdx = stateData.indexOf("STATE_340B");
  if (stateIdx !== -1) {
    var block = stateData.substring(stateIdx, stateIdx + 15000);
    var abbrRegex = /\b([A-Z]{2})\s*:\s*\{/g;
    var abbrs = [];
    var m;
    while ((m = abbrRegex.exec(block)) !== null) {
      if (m[1] && abbrs.indexOf(m[1]) === -1) abbrs.push(m[1]);
    }
    abbrs.forEach(function (abbr) {
      var nameRegex = new RegExp("STATE_NAMES[\\s\\S]*?\\b" + abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*:");
      if (!nameRegex.test(stateData)) {
        warnings.push("STATE_340B has " + abbr + " but STATE_NAMES may be missing it.");
      }
    });
  }

  if (warnings.length > 0) {
    proposals.push(shared.createProposal("agent-01-data-integrity", context.wave || 1, {
      changeType: "validation",
      targetFile: "state-data.js",
      description: "Resolve " + warnings.length + " data validation issue(s): " + warnings.join(" "),
      executiveImpact: 6,
      maintainability: 7,
      instructions: warnings.map(function (w) { return "Fix: " + w; })
    }));
  }

  log.push({ action: "complete", warnings: warnings.length, proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Data Integrity: " + warnings.length + " warning(s), " + proposals.length + " proposal(s)."
  };
}

module.exports = { run };
