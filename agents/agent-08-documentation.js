/**
 * Agent 8 — Documentation & Maintenance
 * Operations manual, README, PROMPTS, SECURITY, inline comments and labels.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var readme = shared.readProjectFile("README.md");
  var ops = shared.readProjectFile("docs/OPERATIONS_MANUAL.md");
  var promptsDoc = shared.readProjectFile("docs/PROMPTS.md");
  var security = shared.readProjectFile("SECURITY.md");
  var js = shared.readProjectFile("340b.js");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-08-documentation" });

  if (!readme || readme.length < 500) {
    proposals.push(shared.createProposal("agent-08-documentation", context.wave || 8, {
      targetFile: "README.md",
      description: "README: overview, file table, quick edits, running locally",
      executiveImpact: 4,
      maintainability: 10,
      instructions: ["Ensure README.md has project overview, file purposes, and novice-friendly edit guide."]
    }));
  }
  if (!ops || !/self-update|self_upgrade|Adding or updating data/.test(ops)) {
    proposals.push(shared.createProposal("agent-08-documentation", context.wave || 8, {
      targetFile: "docs/OPERATIONS_MANUAL.md",
      description: "OPERATIONS_MANUAL: data updates, charts/UI, republish, self-update waves",
      executiveImpact: 4,
      maintainability: 10,
      instructions: ["Add sections: updating data, updating charts/UI, republishing, running self-update."]
    }));
  }
  if (!promptsDoc) {
    proposals.push(shared.createProposal("agent-08-documentation", context.wave || 8, {
      targetFile: "docs/PROMPTS.md",
      description: "PROMPTS.md: document ultra_prompts workflow and wave order",
      executiveImpact: 3,
      maintainability: 9,
      instructions: ["Create docs/PROMPTS.md with workflow, wave order, and example cycle."]
    }));
  }
  if (!security || !/innerHTML|noopener|textContent/.test(security)) {
    proposals.push(shared.createProposal("agent-08-documentation", context.wave || 8, {
      targetFile: "SECURITY.md",
      description: "SECURITY.md: code patterns (textContent, noopener, JSON parse)",
      executiveImpact: 3,
      maintainability: 8,
      security: 7,
      instructions: ["Document code patterns: use textContent/safeText, no innerHTML with data, rel=noopener noreferrer."]
    }));
  }
  if (js && !/\/\*\*|\* NOVICE|CODE MAP/.test(js)) {
    proposals.push(shared.createProposal("agent-08-documentation", context.wave || 8, {
      targetFile: "340b.js",
      description: "Add top-of-file comment block: CODE MAP and NOVICE guidance",
      executiveImpact: 2,
      maintainability: 9,
      instructions: ["Add comment at top of 340b.js with CODE MAP and where to edit for novice maintainers."]
    }));
  }

  log.push({ action: "complete", proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Documentation: " + proposals.length + " proposal(s) for README, manual, and comments."
  };
}

module.exports = { run };
