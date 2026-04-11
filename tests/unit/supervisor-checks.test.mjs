/**
 * TEST SUITE: supervisor-checks.js
 * PURPOSE: Validate semantic-registry helpers, story payload validation, and Node-side runAllChecks behavior.
 * SCOPE: validateStoryPayload, extractUsedMetricKeys, checkMetricKeyCoverage, loadMetricRegistry, loadSemanticRegistry, runAllChecks
 * DEPENDENCIES: powerbi/metric-registry.json, powerbi/semantic-layer-registry.json on disk (real repo files).
 * LAST UPDATED: 2026-04-10
 */
// @vitest-environment node

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "vitest";

const require = createRequire(import.meta.url);
const SupervisorChecks = require("../../modules/supervisor-checks.js");

function validStoryBase() {
  return {
    hospitalName: "Test Hospital",
    county: "Allegheny",
    category: "Patient Access",
    storyText: "This is a valid story text that meets minimum content requirements for validation.",
    submittedAt: new Date().toISOString(),
  };
}

describe("SupervisorChecks.validateStoryPayload", () => {
  it("should_return_valid_true_when_payload_meets_all_requirements", () => {
    const payload = validStoryBase();
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, true, `Expected valid story to pass, got errors: ${result.errors.join("; ")}`);
    assert.equal(result.errors.length, 0);
  });

  it("should_return_invalid_when_required_field_is_missing", () => {
    const payload = { ...validStoryBase(), hospitalName: "" };
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, false, "Empty hospitalName must fail validation");
    assert.ok(
      result.errors.some((e) => e.includes("hospitalName") || e.includes("Missing required field")),
      `Expected missing-field error, got: ${result.errors.join("; ")}`
    );
  });

  it("should_return_invalid_when_category_is_not_allowlisted", () => {
    const payload = { ...validStoryBase(), category: "Not A Real Category" };
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes("Invalid category")),
      `Expected category error, got: ${result.errors.join("; ")}`
    );
  });

  it("should_return_invalid_when_storyText_exceeds_500_characters", () => {
    const payload = { ...validStoryBase(), storyText: "x".repeat(501) };
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes("500")),
      `Expected length error, got: ${result.errors.join("; ")}`
    );
  });

  it("should_return_invalid_when_contactEmail_is_malformed", () => {
    const payload = { ...validStoryBase(), contactEmail: "not-an-email" };
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.includes("email")),
      `Expected email format error, got: ${result.errors.join("; ")}`
    );
  });

  it("should_return_valid_when_contactEmail_is_empty_optional_field", () => {
    const payload = { ...validStoryBase(), contactEmail: "" };
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, true, `Unexpected errors: ${result.errors.join("; ")}`);
  });

  it("should_return_invalid_when_hospitalName_exceeds_200_characters", () => {
    const payload = { ...validStoryBase(), hospitalName: "H".repeat(201) };
    const result = SupervisorChecks.validateStoryPayload(payload);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes("200")), `Got: ${result.errors.join("; ")}`);
  });

  it("should_return_invalid_when_payload_is_null_or_undefined", () => {
    const r1 = SupervisorChecks.validateStoryPayload(null);
    const r2 = SupervisorChecks.validateStoryPayload(undefined);
    assert.equal(r1.valid, false);
    assert.equal(r2.valid, false);
  });
});

describe("SupervisorChecks registry integration (disk)", () => {
  it("should_load_metric_registry_as_non_empty_array_when_file_exists", () => {
    const metrics = SupervisorChecks.loadMetricRegistry();
    assert.ok(Array.isArray(metrics), "loadMetricRegistry must return an array");
    assert.ok(metrics.length > 0, "Expected metric-registry.json to contain metrics in this repo");
    assert.ok(
      metrics.every((m) => m && typeof m.metricKey === "string"),
      "Each metric entry should declare metricKey string"
    );
  });

  it("should_extract_used_metric_keys_as_unique_strings", () => {
    const keys = SupervisorChecks.extractUsedMetricKeys();
    assert.ok(Array.isArray(keys));
    const set = new Set(keys);
    assert.equal(set.size, keys.length, `Duplicate MetricKeys in semantic registry walk: ${keys.length - set.size} dupes`);
    keys.forEach((k) => assert.equal(typeof k, "string", `Non-string key: ${k}`));
  });

  it("should_report_no_missing_metric_keys_when_repo_semantic_layer_is_aligned", () => {
    const coverage = SupervisorChecks.checkMetricKeyCoverage();
    assert.ok(Array.isArray(coverage.registered));
    assert.ok(Array.isArray(coverage.missing));
    assert.ok(Array.isArray(coverage.extra));
    assert.equal(
      coverage.missing.length,
      0,
      `MetricKeys used in semantic registry but missing from metric-registry: ${coverage.missing.join(", ")}`
    );
  });
});

describe("SupervisorChecks.runAllChecks (Node)", () => {
  it("should_skip_browser_only_gates_and_produce_verdict", () => {
    const report = SupervisorChecks.runAllChecks();
    assert.ok(report.timestamp);
    assert.ok(report.gates.semanticLayer);
    assert.equal(report.gates.dataLayer.status, "SKIP");
    assert.equal(report.gates.aiHelpers.status, "SKIP");
    assert.ok(["APPROVED", "NEEDS REVISION"].includes(report.verdict));
  });
});
