#!/usr/bin/env node
/**
 * Self-Update Manager — 340B Dashboard
 * ====================================
 * Reads ultra_prompts.json, runs validation, and records completed waves with
 * timestamp and version. Safe to run from project root: node self_upgrade/self_update.js
 *
 * NOVICE: Run "node self_upgrade/self_update.js" to see next wave; run with
 * "node self_upgrade/self_update.js --record-wave=1" after completing a wave to log it.
 *
 * Usage:
 *   node self_upgrade/self_update.js              # Show status and next wave
 *   node self_upgrade/self_update.js --record-wave=2  # Record wave 2 completed
 *   node self_upgrade/self_update.js --validate   # Run validation only
 */

"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.resolve(__dirname, "..");
var PROMPTS_ROOT = path.join(ROOT, "ultra_prompts.json");
var PROMPTS_LEGACY = path.join(__dirname, "ultra_prompts.json");
var ARCHIVE_DIR = path.join(ROOT, "data", "archive");
var LOG_FILE = path.join(ARCHIVE_DIR, "upgrade-log.json");

function getConfig() {
  try {
    var p = path.join(ROOT, "config.json");
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {}
  return {};
}

/**
 * Load and parse ultra_prompts.json. Tries root first, then self_upgrade/. Returns null on error.
 */
function loadPrompts() {
  var config = getConfig();
  if (config.archive_path) {
    ARCHIVE_DIR = path.isAbsolute(config.archive_path) ? config.archive_path : path.join(ROOT, config.archive_path);
    LOG_FILE = path.join(ARCHIVE_DIR, "upgrade-log.json");
  }
  var toTry = [PROMPTS_ROOT, PROMPTS_LEGACY];
  for (var i = 0; i < toTry.length; i++) {
    try {
      if (fs.existsSync(toTry[i])) {
        var raw = fs.readFileSync(toTry[i], "utf8");
        return JSON.parse(raw);
      }
    } catch (e) {
      if (i === toTry.length - 1) {
        console.error("Could not load ultra_prompts.json:", e.message);
        return null;
      }
    }
  }
  console.error("Could not load ultra_prompts.json: not found at root or self_upgrade/");
  return null;
}

/**
 * Load upgrade log (array of completed wave records). Creates file if missing.
 */
function loadLog() {
  try {
    if (fs.existsSync(LOG_FILE)) {
      var raw = fs.readFileSync(LOG_FILE, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Could not load upgrade log:", e.message);
  }
  return [];
}

/**
 * Append a completed wave to the log and write back.
 */
function recordWave(waveId, waveName, description) {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  var log = loadLog();
  var entry = {
    waveId: waveId,
    waveName: waveName,
    description: description || "Wave completed",
    timestamp: new Date().toISOString()
  };
  log.push(entry);
  try {
    fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2), "utf8");
    console.log("Recorded:", entry.timestamp, "—", waveId, waveName);
    return true;
  } catch (e) {
    console.error("Could not write upgrade log:", e.message);
    return false;
  }
}

/**
 * Show status: last completed wave and next wave prompts.
 */
function showStatus(prompts) {
  var log = loadLog();
  var completedIds = log.map(function (e) { return e.waveId; });
  var waves = prompts.waves || [];
  var next = waves.filter(function (w) { return completedIds.indexOf(w.id) === -1; })[0];

  console.log("\n340B Dashboard — Self-Update Status");
  console.log("====================================\n");
  if (log.length > 0) {
    var last = log[log.length - 1];
    console.log("Last completed:", last.waveId, last.waveName, "at", last.timestamp);
  } else {
    console.log("No waves recorded yet.");
  }
  if (next) {
    console.log("\nNext wave:", next.id, "—", next.name);
    console.log("Prompts to run:");
    (next.prompts || []).forEach(function (p, i) {
      console.log("  " + (i + 1) + ". " + p);
    });
    console.log("\nTo record after completing this wave:");
    console.log("  node self_upgrade/self_update.js --record-wave=" + next.order);
  } else {
    console.log("\nAll waves completed. Run --record-wave=N to add a repeat or new wave.");
  }
  console.log("");
}

/**
 * Validate: check that key files exist and ultra_prompts.json is valid.
 */
function runValidate() {
  console.log("\nValidation");
  console.log("==========\n");
  var prompts = loadPrompts();
  if (!prompts) {
    console.log("FAIL: ultra_prompts.json missing or invalid.");
    return false;
  }
  console.log("OK: ultra_prompts.json loaded,", (prompts.waves || []).length, "waves.");
  if (fs.existsSync(path.join(ROOT, "config.json"))) console.log("OK: config.json present.");
  var required = ["config/settings.js", "data/dataset-metadata.js", "340b.html", "340b.js"];
  required.forEach(function (rel) {
    var p = path.join(ROOT, rel);
    console.log(fs.existsSync(p) ? "OK" : "MISSING", rel);
  });
  if (fs.existsSync(LOG_FILE)) {
    var log = loadLog();
    console.log("OK: upgrade-log.json exists,", log.length, "entries.");
  } else {
    console.log("INFO: data/archive/upgrade-log.json will be created on first --record-wave.");
  }
  console.log("");
  return true;
}

// --- CLI

var args = process.argv.slice(2);
var recordWaveNum = null;
var validateOnly = false;
args.forEach(function (arg) {
  if (arg === "--validate") validateOnly = true;
  if (arg.indexOf("--record-wave=") === 0) recordWaveNum = parseInt(arg.replace("--record-wave=", ""), 10);
});

if (validateOnly) {
  runValidate();
  process.exit(0);
}

var prompts = loadPrompts();
if (!prompts) process.exit(1);

if (recordWaveNum != null && !isNaN(recordWaveNum)) {
  var wave = (prompts.waves || []).filter(function (w) { return w.order === recordWaveNum; })[0];
  if (wave) {
    recordWave(wave.id, wave.name, "Wave " + recordWaveNum + " completed via self_update.js");
  } else {
    console.error("No wave with order " + recordWaveNum + " found.");
    process.exit(1);
  }
} else {
  showStatus(prompts);
}
