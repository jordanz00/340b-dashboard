/**
 * Shared schema and helpers for 340B multi-agent system.
 * Proposal format, scoring weights, and logging. Used by all agents and the orchestrator.
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ROOT = path.resolve(__dirname, "..");

/** Scoring dimensions for Agent 9 (Cross-Validator). Higher = better. */
var SCORE_WEIGHTS = {
  executiveImpact: 0.35,
  maintainability: 0.25,
  security: 0.20,
  performance: 0.20
};

/** Proposal schema: each agent emits an array of these. */
function createProposal(agentId, wave, opts) {
  return {
    agentId: agentId,
    wave: wave,
    id: opts.id || (agentId + "-" + Date.now()),
    changeType: opts.changeType || "suggestion",
    targetFile: opts.targetFile || null,
    description: opts.description || "",
    impactScore: Math.min(10, Math.max(0, opts.impactScore != null ? opts.impactScore : 5)),
    scores: {
      executiveImpact: opts.executiveImpact != null ? opts.executiveImpact : 5,
      maintainability: opts.maintainability != null ? opts.maintainability : 5,
      security: opts.security != null ? opts.security : 5,
      performance: opts.performance != null ? opts.performance : 5
    },
    conflictWith: opts.conflictWith || [],
    instructions: opts.instructions || [],
    timestamp: new Date().toISOString()
  };
}

/** Read file at project-relative path; return null on error. */
function readProjectFile(relPath) {
  var p = path.join(ROOT, relPath);
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    return null;
  }
}

/** Check if file exists. */
function fileExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

/** Compute weighted score for a proposal (for Agent 9). */
function weightedScore(proposal) {
  var s = proposal.scores || {};
  return (
    (s.executiveImpact != null ? s.executiveImpact : 5) * SCORE_WEIGHTS.executiveImpact +
    (s.maintainability != null ? s.maintainability : 5) * SCORE_WEIGHTS.maintainability +
    (s.security != null ? s.security : 5) * SCORE_WEIGHTS.security +
    (s.performance != null ? s.performance : 5) * SCORE_WEIGHTS.performance
  );
}

module.exports = {
  ROOT,
  SCORE_WEIGHTS,
  createProposal,
  readProjectFile,
  fileExists,
  weightedScore
};
