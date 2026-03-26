#!/usr/bin/env node
/**
 * Multi-Agent Wave Runner — 340B Dashboard
 * Runs agents by wave, collects proposals, runs Agent 9 (Cross-Validator), logs results.
 *
 * Usage:
 *   node agents/run-waves.js              # Run all waves (agents 1–8, then 9, then 10)
 *   node agents/run-waves.js --wave=3     # Run only wave 3 (Agent 3)
 *   node agents/run-waves.js --dry-run    # No file writes, only stdout
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ROOT = path.resolve(__dirname, "..");
var ARCHIVE_DIR = path.join(ROOT, "data", "archive");
var AGENTS_DIR = path.join(ARCHIVE_DIR, "agents");

/** Wave → agent file (prefer new names agent_data.js etc.; fallback to agent-01-... ). */
var WAVE_AGENT_FILES = [
  "agent_data.js",
  "agent_metrics.js",
  "agent_ui.js",
  "agent_interactivity.js",
  "agent_security.js",
  "agent_performance.js",
  "agent_self_improvement.js",
  "agent_doc.js",
  "agent_validator.js",
  "agent_executive_audit.js"
];
var WAVE_AGENT_LEGACY = {
  1: "./agent-01-data-integrity.js",
  2: "./agent-02-executive-metrics.js",
  3: "./agent-03-ux-ui.js",
  4: "./agent-04-interactivity.js",
  5: "./agent-05-security.js",
  6: "./agent-06-performance.js",
  7: "./agent-07-self-improvement.js",
  8: "./agent-08-documentation.js",
  9: "./agent-09-cross-validator.js",
  10: "./agent-10-ceo-auditor.js"
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function runAgent(agentPath, wave, context) {
  try {
    var agent = require(agentPath);
    return agent.run(context);
  } catch (e) {
    return {
      proposals: [],
      log: [{ at: new Date().toISOString(), action: "error", message: e.message }],
      summary: "Error: " + e.message
    };
  }
}

function loadConfig() {
  var configPath = path.join(ROOT, "config.json");
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (e) {}
  return {
    archive_path: "data/archive",
    max_agents: 10,
    ultra_prompt_wave_size: 10,
    rules_per_wave: 10
  };
}

function getAgentPath(waveNum) {
  var name = WAVE_AGENT_FILES[waveNum - 1];
  if (name) {
    var p = path.join(__dirname, name);
    if (fs.existsSync(p)) return path.join(__dirname, name);
  }
  return path.join(__dirname, WAVE_AGENT_LEGACY[waveNum]);
}

function runWave(waveNum, context, dryRun) {
  var agentPath = getAgentPath(waveNum);
  if (!agentPath || !fs.existsSync(agentPath)) return null;
  return runAgent(agentPath, waveNum, context);
}

function main() {
  var args = process.argv.slice(2);
  var singleWave = null;
  var dryRun = false;
  args.forEach(function (arg) {
    if (arg === "--dry-run") dryRun = true;
    if (arg.indexOf("--wave=") === 0) singleWave = parseInt(arg.replace("--wave=", ""), 10);
  });

  var config = loadConfig();
  if (config.archive_path) {
    ARCHIVE_DIR = path.isAbsolute(config.archive_path) ? config.archive_path : path.join(ROOT, config.archive_path);
    AGENTS_DIR = path.join(ARCHIVE_DIR, "agents");
  }

  var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  var context = {
    wave: singleWave != null ? singleWave : 1,
    projectRoot: ROOT,
    timestamp: new Date().toISOString()
  };

  if (!dryRun) {
    ensureDir(ARCHIVE_DIR);
    ensureDir(AGENTS_DIR);
  }

  var allProposals = [];
  var agentResults = {};
  var waveOrder = singleWave != null ? [singleWave] : [1, 2, 3, 4, 5, 6, 7, 8];

  console.log("\n340B Multi-Agent System — Wave Run");
  console.log("==================================\n");

  waveOrder.forEach(function (w) {
    context.wave = w;
    var result = runWave(w, context, dryRun);
    if (result) {
      agentResults["wave" + w] = result;
      if (Array.isArray(result.proposals)) {
        result.proposals.forEach(function (p) {
          p.wave = w;
          allProposals.push(p);
        });
      }
      console.log("Wave " + w + ": " + (result.summary || "OK"));
    }
  });

  var validatorResult = null;
  if (singleWave === 9 || singleWave == null) {
    context.wave = 9;
    context.allProposals = allProposals;
    validatorResult = runWave(9, context, dryRun);
    if (validatorResult) {
      agentResults.wave9 = validatorResult;
      console.log("Wave 9 (Cross-Validator): " + (validatorResult.summary || "OK"));
      if (validatorResult.report) {
        console.log("  Approved: " + validatorResult.report.approved);
        console.log("  Top 5: " + JSON.stringify(validatorResult.report.topFive, null, 2).split("\n").join("\n  "));
      }
    }
  }

  if (singleWave === 10 || singleWave == null) {
    context.wave = 10;
    context.approvedProposals = (validatorResult && validatorResult.approvedProposals) || [];
    var auditorResult = runWave(10, context, dryRun);
    if (auditorResult) {
      agentResults.wave10 = auditorResult;
      console.log("Wave 10 (CEO Auditor): " + (auditorResult.summary || "OK"));
      if (auditorResult.executiveScore) {
        console.log("  Score: clarity=" + auditorResult.executiveScore.clarity + " polish=" + auditorResult.executiveScore.polish + " decisionReadiness=" + auditorResult.executiveScore.decisionReadiness);
      }
    }
  }

  if (!dryRun) {
    var logPath = path.join(AGENTS_DIR, "run-" + timestamp + ".json");
    var logPayload = {
      timestamp: context.timestamp,
      singleWave: singleWave,
      totalProposals: allProposals.length,
      agentResults: agentResults,
      approvedCount: (validatorResult && validatorResult.report && validatorResult.report.approved) || 0
    };
    fs.writeFileSync(logPath, JSON.stringify(logPayload, null, 2), "utf8");
    console.log("\nLog written: " + logPath);

    if (validatorResult && validatorResult.approvedProposals && validatorResult.approvedProposals.length > 0) {
      var approvedPath = path.join(ARCHIVE_DIR, "approved-changes-" + timestamp + ".json");
      fs.writeFileSync(approvedPath, JSON.stringify({
        timestamp: context.timestamp,
        approved: validatorResult.approvedProposals,
        report: validatorResult.report
      }, null, 2), "utf8");
      console.log("Approved changes: " + approvedPath);
    }

    var summaryPath = path.join(ARCHIVE_DIR, "executive-summary-" + timestamp + ".txt");
    var summaryLines = [
      "340B Dashboard — Executive Summary (Multi-Agent Run)",
      "Generated: " + context.timestamp,
      "",
      "Proposals collected: " + allProposals.length,
      "Approved by Cross-Validator: " + ((validatorResult && validatorResult.report && validatorResult.report.approved) || 0),
      "",
      "CEO Auditor score: " + (agentResults.wave10 && agentResults.wave10.executiveScore
        ? "clarity " + agentResults.wave10.executiveScore.clarity + ", polish " + agentResults.wave10.executiveScore.polish + ", decision-readiness " + agentResults.wave10.executiveScore.decisionReadiness
        : "N/A"),
      "",
      "Next step: Review data/archive/approved-changes-*.json and apply approved proposals, then run dashboard-audit.py and print gate."
    ];
    fs.writeFileSync(summaryPath, summaryLines.join("\n"), "utf8");
    console.log("Executive summary: " + summaryPath);
  }

  console.log("");
}

main();
