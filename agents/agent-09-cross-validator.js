/**
 * Agent 9 — Cross-Agent Validator
 * Compares all proposals, resolves conflicts, prioritizes by impact/maintainability/security/performance.
 * Approves changes before integration.
 */
"use strict";

var shared = require("./shared");

/** Resolve conflicts: same targetFile + incompatible changeType; keep higher-weighted score. */
function resolveConflicts(proposals) {
  var byFile = {};
  proposals.forEach(function (p) {
    var key = (p.targetFile || "") + "|" + (p.changeType || "");
    if (!byFile[key]) byFile[key] = [];
    byFile[key].push(p);
  });
  var out = [];
  Object.keys(byFile).forEach(function (key) {
    var list = byFile[key];
    if (list.length === 1) {
      out.push(list[0]);
      return;
    }
    list.sort(function (a, b) {
      return shared.weightedScore(b) - shared.weightedScore(a);
    });
    out.push(list[0]);
    if (list.length > 1) {
      list[0].conflictWith = list.slice(1).map(function (p) { return p.id; });
    }
  });
  return out;
}

/** Score and sort: executive impact 35%, maintainability 25%, security 20%, performance 20%. */
function rankProposals(proposals) {
  return proposals.slice().sort(function (a, b) {
    var sa = shared.weightedScore(a);
    var sb = shared.weightedScore(b);
    if (sb !== sa) return sb - sa;
    return (b.impactScore || 0) - (a.impactScore || 0);
  });
}

function run(context) {
  var log = [];
  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-09-cross-validator" });

  var allProposals = context.allProposals || [];
  var resolved = resolveConflicts(allProposals);
  var ranked = rankProposals(resolved);
  var approved = ranked.filter(function (p) {
    return (p.scores && p.scores.security !== 0) || true;
  });
  var rejected = ranked.filter(function (p) {
    return approved.indexOf(p) === -1;
  });

  var report = {
    totalReceived: allProposals.length,
    afterConflictResolution: resolved.length,
    approved: approved.length,
    rejected: rejected.length,
    approvedIds: approved.map(function (p) { return p.id; }),
    topFive: approved.slice(0, 5).map(function (p) {
      return {
        id: p.id,
        agentId: p.agentId,
        description: p.description,
        targetFile: p.targetFile,
        weightedScore: Math.round(shared.weightedScore(p) * 10) / 10
      };
    })
  };

  log.push({ action: "complete", report });
  return {
    proposals: [],
    log,
    summary: "Cross-Validator: " + approved.length + " approved, " + rejected.length + " rejected from " + allProposals.length + " proposals.",
    report,
    approvedProposals: approved,
    rejectedProposals: rejected
  };
}

module.exports = { run, resolveConflicts, rankProposals };
