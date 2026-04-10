/**
 * N9 — NEXUS CrossValidator (wave 9)
 * Conflict resolution + weighted ranking per docs/AGENT-MESH.md
 */
"use strict";

var shared = require("./shared-nexus.js");

function resolveConflicts(proposals) {
  var byKey = {};
  proposals.forEach(function (p) {
    var key = (p.targetFile || "") + "|" + (p.changeType || "");
    if (!byKey[key]) byKey[key] = [];
    byKey[key].push(p);
  });
  var out = [];
  Object.keys(byKey).forEach(function (key) {
    var list = byKey[key];
    if (list.length === 1) {
      out.push(list[0]);
      return;
    }
    list.sort(function (a, b) {
      return shared.weightedScoreNexus(b) - shared.weightedScoreNexus(a);
    });
    out.push(list[0]);
    list[0].conflictWith = list.slice(1).map(function (p) {
      return p.id;
    });
  });
  return out;
}

function rankProposals(proposals) {
  return proposals.slice().sort(function (a, b) {
    var sa = shared.weightedScoreNexus(a);
    var sb = shared.weightedScoreNexus(b);
    if (sb !== sa) return sb - sa;
    return (b.scores && b.scores.productImpact || 0) - (a.scores && a.scores.productImpact || 0);
  });
}

function isBlocked(p) {
  var s = p.scores || {};
  if ((s.security != null && s.security < 3) || (s.safariInterop != null && s.safariInterop < 3)) {
    return true;
  }
  if (!p.featureDetectionFallback || String(p.featureDetectionFallback).trim().length < 4) {
    if (p.changeType !== "docs") return true;
  }
  return false;
}

function backlogTiers(ranked) {
  var p0 = [];
  var p1 = [];
  var p2 = [];
  ranked.forEach(function (p) {
    if (p.changeType === "spike") p0.push(p.id);
    else if (p.changeType === "refactor" || p.changeType === "perf") p1.push(p.id);
    else p2.push(p.id);
  });
  return { P0: p0, P1: p1, P2: p2 };
}

function run(context) {
  var log = [{ at: new Date().toISOString(), action: "start", agent: "nexus_validator" }];
  var allProposals = context.allProposals || [];
  var resolved = resolveConflicts(allProposals);
  var ranked = rankProposals(resolved);
  var blocked = ranked.filter(isBlocked);
  var approved = ranked.filter(function (p) {
    return blocked.indexOf(p) === -1;
  });
  var tiers = backlogTiers(approved);

  var report = {
    totalReceived: allProposals.length,
    afterConflictResolution: resolved.length,
    blockedCount: blocked.length,
    approvedCount: approved.length,
    blockedIds: blocked.map(function (p) {
      return p.id;
    }),
    approvedIds: approved.map(function (p) {
      return p.id;
    }),
    backlog: tiers,
    topFive: approved.slice(0, 5).map(function (p) {
      return {
        id: p.id,
        agentId: p.agentId,
        description: p.description,
        targetFile: p.targetFile,
        weightedScore: Math.round(shared.weightedScoreNexus(p) * 100) / 100
      };
    })
  };

  log.push({ action: "complete", report });
  return {
    proposals: [],
    log: log,
    summary: "N9 CrossValidator: " + approved.length + " approved, " + blocked.length + " blocked (policy), from " + allProposals.length + " proposals.",
    report: report,
    approvedProposals: approved,
    blockedProposals: blocked
  };
}

module.exports = { run, resolveConflicts, rankProposals, weightedScoreNexus: shared.weightedScoreNexus };
