/**
 * TEST SUITE: modules/pa-impact-engine.js (+ pa-impact-data.js)
 * PURPOSE: Verify PA impact scenario lookup returns stable objects for known scenario IDs.
 * SCOPE: HAP340B_PA_IMPACT.getPaImpact, getAnchors
 * DEPENDENCIES: happy-dom global; pa-impact-data.js then pa-impact-engine.js via indirect eval.
 * LAST UPDATED: 2026-04-10
 */
// @vitest-environment happy-dom

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

function loadLegacyScript(relativePath) {
  const code = readFileSync(join(ROOT, relativePath), "utf8");
  const g = typeof globalThis.window !== "undefined" ? globalThis.window : globalThis;
  if (typeof g.eval !== "function") {
    throw new Error("Test environment must provide global eval to load legacy scripts");
  }
  g.eval.call(g, code);
}

beforeAll(() => {
  loadLegacyScript("modules/pa-impact-data.js");
  loadLegacyScript("modules/pa-impact-engine.js");
  assert.ok(globalThis.HAP340B_PA_IMPACT, "HAP340B_PA_IMPACT namespace must exist after data load");
});

describe("PA Impact engine", () => {
  it("should_return_null_when_scenario_id_is_unknown", () => {
    const PA = globalThis.HAP340B_PA_IMPACT;
    assert.equal(PA.getPaImpact("NOT_A_SCENARIO"), null);
  });

  it("should_return_full_impact_object_for_each_declared_scenario", () => {
    const PA = globalThis.HAP340B_PA_IMPACT;
    const ids = [PA.SCENARIO_EXPAND, PA.SCENARIO_CURRENT, PA.SCENARIO_REMOVE];
    for (const id of ids) {
      const impact = PA.getPaImpact(id);
      assert.ok(impact, `Expected impact for scenario ${id}`);
      assert.equal(impact.scenarioId, id);
      assert.ok(typeof impact.hospitalProgramStatus === "string");
      assert.ok(typeof impact.pharmaciesAffected === "number");
      assert.ok(typeof impact.narrative === "string" && impact.narrative.length > 0);
    }
  });

  it("should_expose_anchors_matching_static_pa_hospital_count", () => {
    const PA = globalThis.HAP340B_PA_IMPACT;
    const anchors = PA.getAnchors();
    assert.equal(anchors.hospitalsParticipating, 72);
    assert.ok(typeof anchors.nationalCommunityBenefitB === "number");
  });
});
