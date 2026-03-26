/**
 * Agent 5 — Security & Data Safety
 * Sanitize dynamic content, safe JSON, external links, XSS prevention, vulnerability logging.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var js = shared.readProjectFile("340b.js");
  var html = shared.readProjectFile("340b.html");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-05-security" });

  var hasInnerHTML = js && /\.innerHTML\s*=/.test(js);
  var hasSafeText = js && (/safeText|textContent/.test(js));
  var hasNoopener = html && (/rel=["']noopener\s+noreferrer["']|rel=["']noreferrer\s+noopener["']/.test(html));
  var hasTargetBlank = html && /target=["']_blank["']/.test(html);
  var hasEval = js && /\beval\s*\(/.test(js);

  if (hasInnerHTML) {
    proposals.push(shared.createProposal("agent-05-security", context.wave || 5, {
      targetFile: "340b.js",
      description: "Replace innerHTML assignment with textContent or safeText() to prevent XSS",
      executiveImpact: 3,
      security: 10,
      maintainability: 6,
      instructions: ["Search for .innerHTML = ; use textContent or a safeText() helper for dynamic data."]
    }));
  }
  if (!hasSafeText && js) {
    proposals.push(shared.createProposal("agent-05-security", context.wave || 5, {
      targetFile: "340b.js",
      description: "Add safeText() helper and use for all dynamic content",
      executiveImpact: 2,
      security: 9,
      maintainability: 7,
      instructions: ["Implement safeText(value) that returns sanitized string; use for user-facing dynamic text."]
    }));
  }
  if (hasTargetBlank && !hasNoopener) {
    proposals.push(shared.createProposal("agent-05-security", context.wave || 5, {
      targetFile: "340b.html",
      description: "Add rel='noopener noreferrer' to all target=_blank links",
      executiveImpact: 2,
      security: 8,
      instructions: ["Ensure every <a target=\"_blank\"> has rel=\"noopener noreferrer\"."]
    }));
  }
  if (hasEval) {
    proposals.push(shared.createProposal("agent-05-security", context.wave || 5, {
      targetFile: "340b.js",
      description: "Remove eval() usage; use safe JSON.parse with try/catch",
      executiveImpact: 1,
      security: 10,
      maintainability: 6,
      instructions: ["Remove eval; if JSON parsing is needed use JSON.parse in try/catch."]
    }));
  }

  log.push({ action: "complete", proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Security: " + proposals.length + " proposal(s) for sanitization and safe links."
  };
}

module.exports = { run };
