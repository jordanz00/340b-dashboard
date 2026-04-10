/**
 * N6 — Performance + mobile (wave 6)
 */
"use strict";

var shared = require("./shared-nexus.js");

function run() {
  var proposals = [];
  if (shared.nexusFileExists("js/engine.js")) {
    proposals.push(shared.createNexusProposal("N6-Perf-Mobile", 6, {
      id: "n6-adaptive-review",
      changeType: "perf",
      targetFile: "js/engine.js",
      description: "Review adaptive GPU + iOS coarse pointer caps; add benchmark hooks comment block pointing to docs/BENCHMARK-HARNESS.md.",
      phase: "now",
      roadmapRows: [3, 4, 8],
      safariIosRisk: "med",
      featureDetectionFallback: "Existing quality presets remain default.",
      rollback: "Revert comment-only or small constant tweaks.",
      scores: { productImpact: 7, maintainability: 8, security: 9, performance: 9, safariInterop: 8 },
      peerConflicts: [{ lane: "N2", topic: "WGSL composite cost" }, { lane: "N3", topic: "Scene cost flags" }],
      instructions: ["Read tickAdaptiveFps and iOS branch", "Document baseline in proposal benchmarkNotes when changing constants"],
      benchmarkNotes: "BENCHMARK-HARNESS.md full matrix row"
    }));
  }
  return {
    proposals: proposals,
    log: [{ at: new Date().toISOString(), action: "complete", lane: "N6" }],
    summary: "N6: " + proposals.length + " proposal(s)"
  };
}

module.exports = { run };
