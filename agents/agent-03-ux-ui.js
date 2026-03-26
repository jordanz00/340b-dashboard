/**
 * Agent 3 — UX/UI & Visual Design
 * Readability, contrast, typography, layout, card and map aesthetics.
 */
"use strict";

var shared = require("./shared");

function run(context) {
  var log = [];
  var proposals = [];
  var css = shared.readProjectFile("340b.css");
  var html = shared.readProjectFile("340b.html");

  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-03-ux-ui" });

  var hasDesignTokens = css && (/:root\s*\{/.test(css) && /--primary|--text|--space/.test(css));
  var hasPrintBlock = css && /@media\s+print/.test(css);
  var hasCardStyles = css && (/\.card|\.intro-section|\.state-list-block/.test(css));
  var hasMapStyles = css && (/\.map|#us-map|\.state-chip/.test(css));

  if (!hasDesignTokens) {
    proposals.push(shared.createProposal("agent-03-ux-ui", context.wave || 3, {
      targetFile: "340b.css",
      description: "Use design tokens (--primary, --text, --space) for consistency",
      executiveImpact: 6,
      maintainability: 9,
      performance: 5,
      instructions: ["Define :root variables for colors, spacing, typography; use them in components."]
    }));
  }
  if (!hasPrintBlock) {
    proposals.push(shared.createProposal("agent-03-ux-ui", context.wave || 3, {
      targetFile: "340b.css",
      description: "Add @media print block for executive PDF output",
      executiveImpact: 8,
      maintainability: 6,
      instructions: ["Add @media print with scaling, page-break-inside: avoid, and print-only visibility."]
    }));
  }
  if (html && !/aria-|role=/.test(html)) {
    proposals.push(shared.createProposal("agent-03-ux-ui", context.wave || 3, {
      targetFile: "340b.html",
      description: "Add ARIA and roles for accessibility and executive screen readers",
      executiveImpact: 5,
      maintainability: 6,
      instructions: ["Add aria-label, aria-live, role where appropriate for filters and status."]
    }));
  }

  log.push({ action: "complete", proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "UX/UI: " + proposals.length + " proposal(s) for visual and accessibility polish."
  };
}

module.exports = { run };
