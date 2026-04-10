/**
 * N2 — WebGPU / WGSL (wave 2)
 */
"use strict";

var shared = require("./shared-nexus.js");

function run() {
  var proposals = [];
  if (shared.nexusFileExists("js/nexus-engine/wgsl-graph.js")) {
    proposals.push(shared.createNexusProposal("N2-WebGPU-WGSL", 2, {
      id: "n2-wgsl-gating-audit",
      changeType: "refactor",
      targetFile: "js/nexus-engine/wgsl-graph.js",
      description: "Audit WGSL enable path: ensure feature detection, half-res fallback, and clean disable when WebGPU absent (Safari).",
      phase: "phase2",
      roadmapRows: [1],
      safariIosRisk: "high",
      featureDetectionFallback: "Hide or no-op WGSL chain when adapter is null; document in README.",
      rollback: "Revert wgsl-graph.js; toggle default off in UI if needed.",
      scores: { productImpact: 8, maintainability: 6, security: 8, performance: 7, safariInterop: 6 },
      peerConflicts: [{ lane: "N1", topic: "Phase boundary" }, { lane: "N6", topic: "Composite/recording cost" }],
      instructions: ["grep nx-wgpu / WgslGraph; verify tryInit catch paths", "Add matrix row to README WebGPU column"],
      benchmarkNotes: "Method C with WGSL on vs off; same scene"
    }));
  }
  return {
    proposals: proposals,
    log: [{ at: new Date().toISOString(), action: "complete", lane: "N2" }],
    summary: "N2: " + proposals.length + " proposal(s)"
  };
}

module.exports = { run };
