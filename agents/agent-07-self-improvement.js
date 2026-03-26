/**
 * Agent 7 — Self-Improvement Manager
 * Reads ultra_prompts.json, runs improvement cycles, tracks versioning and logs.
 */
"use strict";

var path = require("path");
var fs = require("fs");
var shared = require("./shared");

var ROOT = shared.ROOT;
var PROMPTS_ROOT = path.join(ROOT, "ultra_prompts.json");
var PROMPTS_LEGACY = path.join(ROOT, "self_upgrade", "ultra_prompts.json");
var ARCHIVE_DIR = path.join(ROOT, "data", "archive");
var LOG_PATH = path.join(ARCHIVE_DIR, "upgrade-log.json");

function loadConfig() {
  try {
    var p = path.join(ROOT, "config.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {}
  return {};
}

function run(context) {
  var log = [];
  var proposals = [];
  log.push({ at: new Date().toISOString(), action: "start", agent: "agent-07-self-improvement" });

  var config = loadConfig();
  if (config.archive_path) {
    ARCHIVE_DIR = path.isAbsolute(config.archive_path) ? config.archive_path : path.join(ROOT, config.archive_path);
  }
  if (config.daily_update) log.push({ action: "config", daily_update: true });

  var promptsRaw = null;
  var promptsPath = PROMPTS_ROOT;
  if (fs.existsSync(PROMPTS_ROOT)) {
    try { promptsRaw = fs.readFileSync(PROMPTS_ROOT, "utf8"); } catch (e) {}
  }
  if (!promptsRaw && fs.existsSync(PROMPTS_LEGACY)) {
    promptsPath = PROMPTS_LEGACY;
    try { promptsRaw = fs.readFileSync(PROMPTS_LEGACY, "utf8"); } catch (e) {}
  }
  if (!promptsRaw) {
    log.push({ action: "error", message: "ultra_prompts.json not found (tried root and self_upgrade/)" });
    proposals.push(shared.createProposal("agent-07-self-improvement", context.wave || 7, {
      targetFile: "ultra_prompts.json",
      description: "Ensure ultra_prompts.json exists at project root or self_upgrade/ with waves array",
      executiveImpact: 4,
      maintainability: 9,
      instructions: ["Create ultra_prompts.json at root or self_upgrade/ with schemaVersion and waves."]
    }));
    return { proposals, log, summary: "Self-Improvement: prompts file missing or invalid." };
  }

  var prompts = null;
  try {
    prompts = JSON.parse(promptsRaw);
  } catch (e) {
    log.push({ action: "error", message: "ultra_prompts.json invalid JSON" });
    return { proposals, log, summary: "Self-Improvement: invalid JSON in ultra_prompts.json." };
  }

  var waveCount = (prompts.waves && prompts.waves.length) || 0;
  if (waveCount < 6) {
    proposals.push(shared.createProposal("agent-07-self-improvement", context.wave || 7, {
      targetFile: "ultra_prompts.json",
      description: "Extend ultra_prompts to at least 10 waves for full agent coverage",
      executiveImpact: 5,
      maintainability: 9,
      instructions: ["Add waves 7–10: Self-Improvement, Documentation, Cross-Validation, Executive Audit."]
    }));
  }

  if (!shared.fileExists("data/archive/upgrade-log.json") && !fs.existsSync(ARCHIVE_DIR)) {
    proposals.push(shared.createProposal("agent-07-self-improvement", context.wave || 7, {
      targetFile: "data/archive/",
      description: "Ensure data/archive exists for upgrade logs and backups",
      executiveImpact: 2,
      maintainability: 8,
      instructions: ["Create data/archive directory; self_update.js will write upgrade-log.json there."]
    }));
  }

  log.push({ action: "complete", waveCount, proposals: proposals.length });
  return {
    proposals,
    log,
    summary: "Self-Improvement: " + waveCount + " wave(s) in prompts, " + proposals.length + " proposal(s)."
  };
}

module.exports = { run };
