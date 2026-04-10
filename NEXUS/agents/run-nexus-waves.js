#!/usr/bin/env node
/**
 * NEXUS Multi-Agent Wave Runner
 * Lanes N1–N7 propose → N9 CrossValidator → N10 regression gate.
 *
 * From repo root:
 *   node NEXUS/agents/run-nexus-waves.js
 *   node NEXUS/agents/run-nexus-waves.js --wave=3
 *   node NEXUS/agents/run-nexus-waves.js --dry-run
 */
"use strict";

var path = require("path");
var fs = require("fs");

var NEXUS_ROOT = path.resolve(__dirname, "..");
var ARCHIVE_DIR = path.join(NEXUS_ROOT, "data", "archive");
var AGENTS_DIR = path.join(ARCHIVE_DIR, "agents");

var LANE_FILES = [
  "nexus_lane_01.js",
  "nexus_lane_02.js",
  "nexus_lane_03.js",
  "nexus_lane_04.js",
  "nexus_lane_05.js",
  "nexus_lane_06.js",
  "nexus_lane_07.js"
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runAgent(filename, wave, context) {
  var agentPath = path.join(__dirname, filename);
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

function main() {
  var args = process.argv.slice(2);
  var singleWave = null;
  var dryRun = false;
  args.forEach(function (arg) {
    if (arg === "--dry-run") dryRun = true;
    if (arg.indexOf("--wave=") === 0) singleWave = parseInt(arg.replace("--wave=", ""), 10);
  });

  var timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  var context = {
    wave: 1,
    nexusRoot: NEXUS_ROOT,
    timestamp: new Date().toISOString()
  };

  if (!dryRun) {
    ensureDir(ARCHIVE_DIR);
    ensureDir(AGENTS_DIR);
  }

  var allProposals = [];
  var agentResults = {};
  var runLanes = singleWave == null || (singleWave >= 1 && singleWave <= 7);
  var laneOrder = singleWave != null && singleWave >= 1 && singleWave <= 7 ? [singleWave] : [1, 2, 3, 4, 5, 6, 7];

  console.log("\nNEXUS Multi-Agent Mesh — Wave Run");
  console.log("=================================\n");

  if (runLanes) {
    laneOrder.forEach(function (w) {
      context.wave = w;
      var file = LANE_FILES[w - 1];
      var result = runAgent(file, w, context);
      agentResults["wave" + w] = result;
      if (Array.isArray(result.proposals)) {
        result.proposals.forEach(function (p) {
          p.wave = w;
          allProposals.push(p);
        });
      }
      console.log("Wave " + w + " (" + file + "): " + (result.summary || "OK"));
    });
  } else if (singleWave != null && singleWave !== 9 && singleWave !== 10) {
    console.log("Unknown wave " + singleWave + " (use 1–7, 9, or 10)\n");
  }

  var validatorResult = null;
  if (singleWave === 9 || singleWave == null) {
    context.wave = 9;
    context.allProposals = allProposals;
    validatorResult = runAgent("nexus_validator.js", 9, context);
    agentResults.wave9 = validatorResult;
    console.log("\nWave 9 (CrossValidator): " + (validatorResult && validatorResult.summary));
    if (validatorResult && validatorResult.report) {
      console.log("  Approved: " + validatorResult.report.approvedCount + " | Blocked: " + validatorResult.report.blockedCount);
      console.log("  Top 5: " + JSON.stringify(validatorResult.report.topFive, null, 2).split("\n").join("\n  "));
    }
  }

  var regressionResult = null;
  if (singleWave === 10 || singleWave == null) {
    context.wave = 10;
    context.approvedProposals = (validatorResult && validatorResult.approvedProposals) || [];
    regressionResult = runAgent("nexus_regression_gate.js", 10, context);
    agentResults.wave10 = regressionResult;
    console.log("\nWave 10 (Regression gate): " + (regressionResult && regressionResult.summary));
    if (regressionResult && regressionResult.regressionReport) {
      console.log("  Manual required: " + regressionResult.regressionReport.manualRequired);
    }
  }

  if (!dryRun) {
    var logPath = path.join(AGENTS_DIR, "nexus-run-" + timestamp + ".json");
    var logPayload = {
      timestamp: context.timestamp,
      singleWave: singleWave,
      totalProposals: allProposals.length,
      agentResults: agentResults,
      validatorApproved: (validatorResult && validatorResult.report && validatorResult.report.approvedCount) || 0
    };
    fs.writeFileSync(logPath, JSON.stringify(logPayload, null, 2), "utf8");
    console.log("\nLog written: " + logPath);

    if (validatorResult && validatorResult.approvedProposals && validatorResult.approvedProposals.length > 0) {
      var approvedPath = path.join(ARCHIVE_DIR, "nexus-approved-" + timestamp + ".json");
      fs.writeFileSync(
        approvedPath,
        JSON.stringify(
          {
            timestamp: context.timestamp,
            approved: validatorResult.approvedProposals,
            blocked: validatorResult.blockedProposals || [],
            report: validatorResult.report,
            regression: regressionResult && regressionResult.regressionReport
          },
          null,
          2
        ),
        "utf8"
      );
      console.log("Approved proposals: " + approvedPath);
    }

    var summaryPath = path.join(ARCHIVE_DIR, "nexus-summary-" + timestamp + ".txt");
    var summaryLines = [
      "NEXUS — Agent mesh run summary",
      "Generated: " + context.timestamp,
      "",
      "Proposals: " + allProposals.length,
      "Approved (N9): " + ((validatorResult && validatorResult.report && validatorResult.report.approvedCount) || 0),
      "Blocked (N9 policy): " + ((validatorResult && validatorResult.report && validatorResult.report.blockedCount) || 0),
      "",
      "N10 manual steps: " + (regressionResult && regressionResult.regressionReport && regressionResult.regressionReport.manualRequired ? "YES" : "NO"),
      "",
      "Next: Review nexus-approved-*.json; apply changes; run benchmarks per docs/BENCHMARK-HARNESS.md"
    ];
    fs.writeFileSync(summaryPath, summaryLines.join("\n"), "utf8");
    console.log("Summary: " + summaryPath);
  }

  console.log("");
}

main();
