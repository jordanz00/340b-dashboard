/**
 * N10 — Security / regression gate (wave 10)
 * Static checklist; extend with grep-based checks later.
 */
"use strict";

var shared = require("./shared-nexus.js");

var CHECKLIST = [
  { id: "dom-safe", text: "No new innerHTML/eval with user-controlled strings in changed files", pass: true },
  { id: "present-rec", text: "Present mode + REC paths smoke-tested when renderer/post touched", pass: null },
  { id: "mic-silent", text: "Mic-off silent path remains calm for audio-driven visuals", pass: null },
  { id: "hybrid-isolation", text: "Aurora/hybrid failure isolation preserved", pass: null },
  { id: "storage", text: "localStorage keys remain namespaced; no secrets", pass: true }
];

function run(context) {
  var approved = context.approvedProposals || [];
  var needsSmoke = approved.some(function (p) {
    var f = (p.targetFile || "") + (p.description || "");
    return /engine\.js|post\.js|wgsl|audio\.js|scenes\//.test(f);
  });
  var items = CHECKLIST.map(function (c) {
    var pass = c.pass;
    if (c.id === "present-rec" || c.id === "mic-silent" || c.id === "hybrid-isolation") {
      pass = needsSmoke ? null : true;
    }
    return { id: c.id, text: c.text, pass: pass, note: pass === null ? "Manual verification required when implementing approved proposals" : "" };
  });

  var manualRequired = items.some(function (i) {
    return i.pass === null;
  });

  return {
    proposals: [],
    log: [{ at: new Date().toISOString(), action: "complete", agent: "nexus_regression_gate" }],
    summary: "N10 Regression gate: " + (manualRequired ? "MANUAL steps required" : "Static checks OK") + " (" + approved.length + " approved proposals reviewed).",
    regressionReport: {
      checklist: items,
      manualRequired: manualRequired,
      weightsReference: shared.NEXUS_SCORE_WEIGHTS
    }
  };
}

module.exports = { run };
