/**
 * Agent 10 — CEO Executive Experience Auditor
 * Simulates executive use; scores clarity, polish, decision-readiness; suggests refinements.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var html = shared.readProjectFile("340b.html");
  var css = shared.readProjectFile("340b.css");
  var js = shared.readProjectFile("340b.js");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-10-ceo-auditor" });

  var score = { clarity: 5, polish: 5, decisionReadiness: 5 };
  var findings = [];

  if (html) {
    if (/key finding|executive|7\.95B|72\s+PA|community benefit/i.test(html)) score.clarity += 2;
    else findings.push("Key figures not prominent for CEO scan.");
    if (/policy priority|national landscape|trust/i.test(html)) score.decisionReadiness += 1;
    if (/About this data|methodology|source/i.test(html)) score.clarity += 1;
  }
  if (css && /:root|--primary|--text|@media print/.test(css)) score.polish += 2;
  else findings.push("Design tokens or print styles could improve polish.");
  if (js && (/applyStateFilter|map-tooltip|safeText|runTaskSafely/.test(js))) score.polish += 1;
  if (!html || html.length < 5000) findings.push("Dashboard content may be thin for executive depth.");

  score.clarity = Math.min(10, score.clarity);
  score.polish = Math.min(10, score.polish);
  score.decisionReadiness = Math.min(10, score.decisionReadiness);
  var overall = (score.clarity + score.polish + score.decisionReadiness) / 3;

  if (findings.length > 0) {
    proposals.push(shared.createProposal("agent-10-ceo-auditor", context.wave || 10, {
      targetFile: "340b.html",
      description: "CEO experience: " + findings.join(" "),
      executiveImpact: 9,
      maintainability: 5,
      scores: {
        executiveImpact: Math.round(overall),
        maintainability: 5,
        security: 5,
        performance: 5
      },
      instructions: findings.map(function (f) { return "Improve for executive: " + f; })
    }));
  }

  log.push({
    action: "complete",
    score: { clarity: score.clarity, polish: score.polish, decisionReadiness: score.decisionReadiness, overall: Math.round(overall * 10) / 10 },
    findings
  });

  return {
    proposals,
    log,
    summary: "CEO Auditor: overall " + Math.round(overall * 10) / 10 + "/10 (clarity " + score.clarity + ", polish " + score.polish + ", decision-readiness " + score.decisionReadiness + "). " + proposals.length + " proposal(s).",
    executiveScore: score,
    findings
  };
}

module.exports = { run };
