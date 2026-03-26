/**
 * Agent 2 — Executive Metrics & Insights
 * Identifies key CEO metrics, executive summaries, state/trend comparisons.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var html = shared.readProjectFile("340b.html");
  var js = shared.readProjectFile("340b.js");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-02-executive-metrics" });

  var hasKeyFinding = html && (/7\.95B|7%|72\s+PA\s+hospitals|community\s+benefit/i.test(html));
  var hasPolicyInsights = js && (/applyPolicyInsights|policy-insights|POLICY_INSIGHTS/.test(js));
  var hasExecutiveStrip = html && (/executive|policy priority|national landscape/i.test(html));

  if (!hasKeyFinding) {
    proposals.push(shared.createProposal("agent-02-executive-metrics", context.wave || 2, {
      targetFile: "340b.html",
      description: "Surface key figures upfront: $7.95B benefit, 72 PA hospitals, 7% market share",
      executiveImpact: 9,
      maintainability: 6,
      instructions: ["Add or highlight key finding strip with $7.95B, 72 PA hospitals, 7% market share for CEO scanning."]
    }));
  }
  if (!hasPolicyInsights) {
    proposals.push(shared.createProposal("agent-02-executive-metrics", context.wave || 2, {
      targetFile: "340b.js",
      description: "Wire POLICY_INSIGHTS / applyPolicyInsights for national benchmark and adoption summary",
      executiveImpact: 8,
      maintainability: 5,
      instructions: ["Ensure analytics/policy-insights.js is loaded and applyPolicyInsights() fills national policy strip."]
    }));
  }
  if (!hasExecutiveStrip) {
    proposals.push(shared.createProposal("agent-02-executive-metrics", context.wave || 2, {
      targetFile: "340b.html",
      description: "Add executive strip: policy priority, national landscape, trust",
      executiveImpact: 8,
      maintainability: 6,
      instructions: ["Add three-card executive strip with plain-language policy priority, landscape, and trust cues."]
    }));
  }

  log.push({ action: "complete", proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Executive Metrics: " + proposals.length + " proposal(s) for CEO-ready insights."
  };
}

module.exports = { run };
