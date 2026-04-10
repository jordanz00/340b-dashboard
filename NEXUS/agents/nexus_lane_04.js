/**
 * N4 — Post + hybrid composite (wave 4)
 */
"use strict";

var shared = require("./shared-nexus.js");

function run() {
  var proposals = [];
  if (shared.nexusFileExists("js/post.js")) {
    proposals.push(shared.createNexusProposal("N4-Post-Hybrid", 4, {
      id: "n4-post-aurora-boundary",
      changeType: "docs",
      targetFile: "README.md",
      description: "Document post vs Aurora Field responsibilities to avoid duplicate bloom; add short troubleshooting subsection.",
      phase: "now",
      roadmapRows: [6, 7],
      safariIosRisk: "low",
      featureDetectionFallback: "N/A",
      rollback: "Revert doc-only edits.",
      scores: { productImpact: 6, maintainability: 9, security: 9, performance: 7, safariInterop: 8 },
      peerConflicts: [{ lane: "N2", topic: "WGSL vs post order" }, { lane: "N3", topic: "Scene-only grade" }],
      instructions: ["Add short subsection to README troubleshooting on post vs Aurora Field"],
      benchmarkNotes: "Optional: compare bloom on/off Method A"
    }));
  }
  return {
    proposals: proposals,
    log: [{ at: new Date().toISOString(), action: "complete", lane: "N4" }],
    summary: "N4: " + proposals.length + " proposal(s)"
  };
}

module.exports = { run };
