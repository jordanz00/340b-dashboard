/**
 * NEXUS agent mesh — shared proposal schema and CrossValidator scoring.
 * NEXUS root = parent of this agents/ directory.
 */
"use strict";

var path = require("path");
var fs = require("fs");

var NEXUS_ROOT = path.resolve(__dirname, "..");

/** CrossValidator (N9) weights — see docs/AGENT-MESH.md */
var NEXUS_SCORE_WEIGHTS = {
  productImpact: 0.25,
  maintainability: 0.2,
  security: 0.2,
  performance: 0.2,
  safariInterop: 0.15
};

/**
 * @param {string} agentId
 * @param {number} wave
 * @param {object} opts
 */
function createNexusProposal(agentId, wave, opts) {
  var scores = opts.scores || {};
  return {
    agentId: agentId,
    wave: wave,
    id: opts.id || agentId + "-" + Date.now(),
    changeType: opts.changeType || "suggestion",
    targetFile: opts.targetFile || null,
    description: opts.description || "",
    phase: opts.phase || "now",
    roadmapRows: opts.roadmapRows || [],
    safariIosRisk: opts.safariIosRisk || "med",
    featureDetectionFallback: opts.featureDetectionFallback || "",
    rollback: opts.rollback || "",
    scores: {
      productImpact: scores.productImpact != null ? scores.productImpact : 5,
      maintainability: scores.maintainability != null ? scores.maintainability : 5,
      security: scores.security != null ? scores.security : 5,
      performance: scores.performance != null ? scores.performance : 5,
      safariInterop: scores.safariInterop != null ? scores.safariInterop : 5
    },
    peerConflicts: opts.peerConflicts || [],
    instructions: opts.instructions || [],
    benchmarkNotes: opts.benchmarkNotes || "",
    conflictWith: opts.conflictWith || [],
    timestamp: new Date().toISOString()
  };
}

function weightedScoreNexus(proposal) {
  var s = proposal.scores || {};
  return (
    (s.productImpact != null ? s.productImpact : 5) * NEXUS_SCORE_WEIGHTS.productImpact +
    (s.maintainability != null ? s.maintainability : 5) * NEXUS_SCORE_WEIGHTS.maintainability +
    (s.security != null ? s.security : 5) * NEXUS_SCORE_WEIGHTS.security +
    (s.performance != null ? s.performance : 5) * NEXUS_SCORE_WEIGHTS.performance +
    (s.safariInterop != null ? s.safariInterop : 5) * NEXUS_SCORE_WEIGHTS.safariInterop
  );
}

function readNexusFile(relPath) {
  var p = path.join(NEXUS_ROOT, relPath);
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    return null;
  }
}

function nexusFileExists(relPath) {
  return fs.existsSync(path.join(NEXUS_ROOT, relPath));
}

module.exports = {
  NEXUS_ROOT,
  NEXUS_SCORE_WEIGHTS,
  createNexusProposal,
  weightedScoreNexus,
  readNexusFile,
  nexusFileExists
};
