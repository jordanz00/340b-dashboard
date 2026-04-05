/**
 * SupervisorChecks — runtime validation helpers for the Multi-Agent Supervisor.
 *
 * WHO THIS IS FOR: Developers and the automated agent pipeline.
 * WHAT IT DOES:
 *   Provides functions that verify semantic layer compliance, novice readability
 *   patterns, and data integrity at build/audit time. These checks can be called
 *   from Node.js (agents/run-waves.js) or from a browser console for debugging.
 *
 * HOW IT CONNECTS:
 *   - Used by the supervisor agent during merge reviews
 *   - Reads powerbi/metric-registry.json and powerbi/semantic-layer-registry.json
 *   - Cross-references data-count attributes in HTML against registered MetricKeys
 *   - Reports gaps that need fixing before a change is approved
 *
 * POWER BI MAPPING: This module itself has no Gold table mapping. It validates
 *   that OTHER modules and HTML properly map to Gold tables.
 *
 * See docs/SUPERVISOR-SYSTEM.md for the full supervisor documentation.
 * See docs/DATA-DICTIONARY.md for field definitions.
 */
(function () {
  "use strict";

  var isNode = typeof module !== "undefined" && module.exports;
  var fs = isNode ? require("fs") : null;
  var path = isNode ? require("path") : null;

  /**
   * Registered MetricKeys from powerbi/metric-registry.json.
   *
   * HOW IT WORKS:
   * 1. In Node.js: reads the JSON file from disk
   * 2. In browser: expects window._METRIC_REGISTRY to be set, or returns empty
   *
   * WHY: Every data point in the dashboard must have a MetricKey. This function
   *       loads the list so we can check for gaps.
   *
   * @returns {Array<Object>} Array of metric definitions from the registry
   */
  function loadMetricRegistry() {
    if (isNode) {
      var registryPath = path.resolve(__dirname, "..", "powerbi", "metric-registry.json");
      try {
        var raw = fs.readFileSync(registryPath, "utf8");
        var parsed = JSON.parse(raw);
        return parsed.metrics || [];
      } catch (e) {
        return [];
      }
    }
    if (typeof window !== "undefined" && window._METRIC_REGISTRY) {
      return window._METRIC_REGISTRY;
    }
    return [];
  }

  /**
   * Load the semantic layer registry (placeholders, charts, forms).
   *
   * @returns {Object} The full semantic-layer-registry.json content
   */
  function loadSemanticRegistry() {
    if (isNode) {
      var regPath = path.resolve(__dirname, "..", "powerbi", "semantic-layer-registry.json");
      try {
        var raw = fs.readFileSync(regPath, "utf8");
        return JSON.parse(raw);
      } catch (e) {
        return {};
      }
    }
    if (typeof window !== "undefined" && window._SEMANTIC_REGISTRY) {
      return window._SEMANTIC_REGISTRY;
    }
    return {};
  }

  /**
   * Extract all MetricKeys referenced in the semantic layer registry.
   *
   * HOW IT WORKS:
   * 1. Walks every section of the registry (kpiCards, paFocusStats, etc.)
   * 2. Collects any "metricKey" field that is non-null
   * 3. Returns deduplicated set
   *
   * WHY: We need to know which MetricKeys the dashboard actually uses,
   *       so we can cross-check against the metric registry.
   *
   * @returns {Array<string>} Unique MetricKeys found in the semantic registry
   */
  function extractUsedMetricKeys() {
    var registry = loadSemanticRegistry();
    var keys = {};

    var sections = ["kpiCards", "paFocusStats", "oversightComparison", "landscapeStats", "programContextStats"];
    sections.forEach(function (section) {
      var items = registry[section] || [];
      items.forEach(function (item) {
        if (item.metricKey) {
          keys[item.metricKey] = true;
        }
      });
    });

    var charts = registry.charts || [];
    charts.forEach(function (chart) {
      (chart.fields || []).forEach(function (f) {
        if (f.metricKey) {
          keys[f.metricKey] = true;
        }
      });
    });

    var storyForm = registry.storySubmissionForm;
    if (storyForm && Array.isArray(storyForm.fields)) {
      storyForm.fields.forEach(function (f) {
        if (f.metricKey) keys[f.metricKey] = true;
      });
    }

    return Object.keys(keys);
  }

  /**
   * Browser: static-first — no fetch. Set window._METRIC_REGISTRY / _SEMANTIC_REGISTRY
   * via inline script or a local .js build step if console checks need them.
   * @returns {Promise<void>}
   */
  function preloadBrowserRegistries() {
    return Promise.resolve();
  }

  /**
   * Check that every MetricKey used in the dashboard is registered
   * in powerbi/metric-registry.json.
   *
   * RETURNS: Object with:
   *   - registered: MetricKeys that exist in the registry (good)
   *   - missing: MetricKeys used in the dashboard but NOT in the registry (needs fixing)
   *   - extra: MetricKeys in the registry but not currently used (informational)
   *
   * @returns {{ registered: string[], missing: string[], extra: string[] }}
   */
  function checkMetricKeyCoverage() {
    var usedKeys = extractUsedMetricKeys();
    var registeredMetrics = loadMetricRegistry();
    var registeredKeys = registeredMetrics.map(function (m) { return m.metricKey; });

    var registered = [];
    var missing = [];

    usedKeys.forEach(function (key) {
      if (registeredKeys.indexOf(key) !== -1) {
        registered.push(key);
      } else {
        missing.push(key);
      }
    });

    var extra = registeredKeys.filter(function (key) {
      return usedKeys.indexOf(key) === -1;
    });

    return {
      registered: registered,
      missing: missing,
      extra: extra
    };
  }

  /**
   * Validate that the story submission form payload matches the
   * expected Gold table schema (fact_story_submission).
   *
   * WHY: The form must produce JSON that can be directly inserted
   *       into the warehouse table when the API is ready.
   *
   * @param {Object} payload — the story submission object
   * @returns {{ valid: boolean, errors: string[] }}
   */
  function validateStoryPayload(payload) {
    var errors = [];
    var requiredFields = ["hospitalName", "county", "category", "storyText", "submittedAt"];
    var validCategories = ["Patient Access", "Community Benefit", "Rural Care", "Financial Impact"];

    requiredFields.forEach(function (field) {
      if (!payload || payload[field] == null || payload[field] === "") {
        errors.push("Missing required field: " + field);
      }
    });

    if (payload && payload.category && validCategories.indexOf(payload.category) === -1) {
      errors.push("Invalid category '" + payload.category + "'. Must be one of: " + validCategories.join(", "));
    }

    if (payload && payload.storyText && payload.storyText.length > 500) {
      errors.push("storyText exceeds 500 character limit (" + payload.storyText.length + " chars)");
    }

    if (payload && payload.hospitalName && payload.hospitalName.length > 200) {
      errors.push("hospitalName exceeds 200 character limit");
    }

    if (payload && payload.contactEmail && payload.contactEmail !== "") {
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(payload.contactEmail)) {
        errors.push("contactEmail is not a valid email format");
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check that DataLayer methods exist and return Promises.
   * Run this in a browser console to verify the data layer is intact.
   *
   * WHY: The architecture requires all DataLayer methods to be async-ready
   *       (return Promises) so switching from static to warehouse is seamless.
   *
   * @returns {{ intact: boolean, issues: string[] }}
   */
  function checkDataLayerIntegrity() {
    var issues = [];

    if (typeof window === "undefined" || !window.DataLayer) {
      return { intact: false, issues: ["DataLayer not found on window"] };
    }

    var requiredMethods = [
      "getStates", "getKPIs", "getPA", "getDelegation", "getLegislators",
      "getConfig", "getFipsLookup", "getStateNames", "getFreshness", "getMetricNumeric",
      "getRawState340B", "submitStory", "refresh", "connectAPI", "connectWarehouse",
      "connectPowerBI", "disconnect", "exportJSON", "getStatus", "onRefresh"
    ];

    requiredMethods.forEach(function (method) {
      if (typeof window.DataLayer[method] !== "function") {
        issues.push("Missing method: DataLayer." + method);
      }
    });

    try {
      var cfgResult = window.DataLayer.getConfig("dataFreshness");
      if (!cfgResult || typeof cfgResult.then !== "function") {
        issues.push("DataLayer.getConfig() does not return a Promise");
      }
    } catch (e) {
      issues.push("DataLayer.getConfig() threw: " + e.message);
    }

    var asyncNoArg = [
      "getStates", "getKPIs", "getPA", "getDelegation", "getLegislators",
      "getFreshness", "getFipsLookup", "getStateNames", "getRawState340B",
      "refresh", "exportJSON"
    ];
    asyncNoArg.forEach(function (method) {
      if (typeof window.DataLayer[method] !== "function") return;
      try {
        var result = window.DataLayer[method]();
        if (!result || typeof result.then !== "function") {
          issues.push("DataLayer." + method + "() does not return a Promise");
        }
      } catch (e) {
        issues.push("DataLayer." + method + "() threw: " + e.message);
      }
    });

    if (typeof window.DataLayer.getMetricNumeric === "function") {
      try {
        var gm = window.DataLayer.getMetricNumeric("PA_HOSPITALS_340B_COUNT");
        if (!gm || typeof gm.then !== "function") {
          issues.push("DataLayer.getMetricNumeric() does not return a Promise");
        }
      } catch (e) {
        issues.push("DataLayer.getMetricNumeric() threw: " + e.message);
      }
    }

    if (typeof window.DataLayer.submitStory === "function") {
      try {
        var storyP = window.DataLayer.submitStory({
          hospitalName: "Integrity check",
          county: "Allegheny",
          category: "Patient Access",
          storyText: "SupervisorChecks test payload — safe to discard.",
          submittedAt: new Date().toISOString()
        });
        if (!storyP || typeof storyP.then !== "function") {
          issues.push("DataLayer.submitStory() does not return a Promise");
        }
      } catch (e) {
        issues.push("DataLayer.submitStory() threw: " + e.message);
      }
    }

    return {
      intact: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Check that AIHelpers module is intact and works offline.
   *
   * WHY: AIHelpers must function in static mode (no network) — live API is optional.
   *
   * @returns {{ intact: boolean, issues: string[] }}
   */
  function checkAIHelpersIntegrity() {
    var issues = [];

    if (typeof window === "undefined" || !window.AIHelpers) {
      return { intact: false, issues: ["AIHelpers not found on window"] };
    }

    var requiredMethods = ["summarizeStory", "generateChartNarrative", "getPolicyAlert"];
    requiredMethods.forEach(function (method) {
      if (typeof window.AIHelpers[method] !== "function") {
        issues.push("Missing method: AIHelpers." + method);
      }
    });

    if (window.AIHelpers.isLive !== false) {
      issues.push("AIHelpers.isLive should default to false (offline mode)");
    }

    requiredMethods.forEach(function (method) {
      if (typeof window.AIHelpers[method] === "function") {
        try {
          var testInput = method === "summarizeStory"
            ? "Test story that is long enough to pass the 30 character minimum threshold."
            : method === "generateChartNarrative"
              ? "kpi"
              : undefined;
          var testData = method === "generateChartNarrative"
            ? { key: "PA_HOSPITALS_340B_COUNT", value: 72, label: "PA Hospitals" }
            : undefined;

          var result = method === "generateChartNarrative"
            ? window.AIHelpers[method](testInput, testData)
            : method === "summarizeStory"
              ? window.AIHelpers[method](testInput)
              : window.AIHelpers[method]();

          if (!result || typeof result.then !== "function") {
            issues.push("AIHelpers." + method + "() does not return a Promise");
          }
        } catch (e) {
          issues.push("AIHelpers." + method + "() threw in offline mode: " + e.message);
        }
      }
    });

    return {
      intact: issues.length === 0,
      issues: issues
    };
  }

  /**
   * Run all supervisor checks and return a consolidated report.
   * Call from Node.js (agent pipeline) or browser console.
   *
   * @returns {Object} Full check report with pass/fail per gate
   */
  function runAllChecks() {
    var report = {
      timestamp: new Date().toISOString(),
      gates: {}
    };

    var coverage = checkMetricKeyCoverage();
    report.gates.semanticLayer = {
      status: coverage.missing.length === 0 ? "PASS" : "FAIL",
      registered: coverage.registered.length,
      missing: coverage.missing,
      extra: coverage.extra
    };

    if (typeof window !== "undefined") {
      var dl = checkDataLayerIntegrity();
      report.gates.dataLayer = {
        status: dl.intact ? "PASS" : "FAIL",
        issues: dl.issues
      };

      var ai = checkAIHelpersIntegrity();
      report.gates.aiHelpers = {
        status: ai.intact ? "PASS" : "FAIL",
        issues: ai.issues
      };
    } else {
      report.gates.dataLayer = { status: "SKIP", reason: "Node.js environment — no window" };
      report.gates.aiHelpers = { status: "SKIP", reason: "Node.js environment — no window" };
    }

    var allPassed = Object.keys(report.gates).every(function (key) {
      var g = report.gates[key];
      return g.status === "PASS" || g.status === "SKIP";
    });

    report.verdict = allPassed ? "APPROVED" : "NEEDS REVISION";
    return report;
  }

  function runAllChecksAsync() {
    return preloadBrowserRegistries().then(function () {
      return runAllChecks();
    });
  }

  var SupervisorChecks = {
    loadMetricRegistry: loadMetricRegistry,
    loadSemanticRegistry: loadSemanticRegistry,
    extractUsedMetricKeys: extractUsedMetricKeys,
    checkMetricKeyCoverage: checkMetricKeyCoverage,
    validateStoryPayload: validateStoryPayload,
    checkDataLayerIntegrity: checkDataLayerIntegrity,
    checkAIHelpersIntegrity: checkAIHelpersIntegrity,
    runAllChecks: runAllChecks,
    preloadBrowserRegistries: preloadBrowserRegistries,
    runAllChecksAsync: runAllChecksAsync
  };

  if (isNode) {
    module.exports = SupervisorChecks;
  } else if (typeof window !== "undefined") {
    window.SupervisorChecks = SupervisorChecks;
  }
})();
