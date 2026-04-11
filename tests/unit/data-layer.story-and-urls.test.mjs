/**
 * TEST SUITE: modules/data-layer.js (browser global build)
 * PURPOSE: Exercise public URL trust rules and story normalization via submitStory in static mode.
 * SCOPE: DataLayer.isTrustedLegislatorUrl, DataLayer.submitStory (indirect _normalizeStoryPayload), DataLayer.getStates
 * DEPENDENCIES: happy-dom window; state-data.js + data-layer.js loaded via indirect eval; sessionStorage.
 * LAST UPDATED: 2026-04-10
 */
// @vitest-environment happy-dom

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../..");

/**
 * Run legacy IIFE scripts in the global object (var CONFIG hoists to global).
 * @param {string} relativePath
 */
function loadLegacyScript(relativePath) {
  const code = readFileSync(join(ROOT, relativePath), "utf8");
  const g = typeof globalThis.window !== "undefined" ? globalThis.window : globalThis;
  if (typeof g.eval !== "function") {
    throw new Error("Test environment must provide global eval to load legacy scripts");
  }
  g.eval.call(g, code);
}

beforeAll(() => {
  loadLegacyScript("state-data.js");
  loadLegacyScript("modules/data-layer.js");
  assert.ok(globalThis.DataLayer, "DataLayer should attach to globalThis after data-layer.js");
});

afterEach(() => {
  try {
    globalThis.sessionStorage?.clear?.();
  } catch {
    /* ignore */
  }
});

describe("DataLayer.isTrustedLegislatorUrl", () => {
  const { isTrustedLegislatorUrl } = globalThis.DataLayer;

  it("should_return_false_when_input_is_null_or_javascript_scheme", () => {
    assert.equal(isTrustedLegislatorUrl(null), false);
    assert.equal(isTrustedLegislatorUrl("javascript:alert(1)"), false);
  });

  it("should_return_false_for_plain_house_gov_or_senate_gov_homepages", () => {
    assert.equal(isTrustedLegislatorUrl("https://www.house.gov/"), false);
    assert.equal(isTrustedLegislatorUrl("https://house.gov/foo"), false);
    assert.equal(isTrustedLegislatorUrl("https://www.senate.gov/"), false);
  });

  it("should_return_true_for_member_subdomain_house_gov_https", () => {
    const ok = isTrustedLegislatorUrl("https://smith.house.gov/biography");
    assert.equal(ok, true, "Member *.house.gov links are trusted for outbound taps");
  });

  it("should_return_true_for_palegis_us_when_path_includes_valid_bio_slug", () => {
    const url =
      "https://www.palegis.us/house/members/bio/123/representative-smith";
    assert.equal(isTrustedLegislatorUrl(url), true, `Rejected valid palegis URL: ${url}`);
  });

  it("should_return_false_for_palegis_numeric_bio_without_slug_segment", () => {
    const url = "https://www.palegis.us/house/members/bio/123";
    assert.equal(isTrustedLegislatorUrl(url), false, "Numeric-only bio path must be rejected");
  });

  it("should_return_false_for_non_https_urls", () => {
    assert.equal(isTrustedLegislatorUrl("http://smith.house.gov/"), false);
  });
});

describe("DataLayer.submitStory (static sessionStorage path)", () => {
  it("should_resolve_ok_and_strip_invalid_category_to_empty_string_in_normalized_payload", async () => {
    const raw = {
      hospital: "County Medical",
      county: "Erie",
      category: "INVALID_CATEGORY",
      story: "A".repeat(50),
      email: "bad-email",
      timestamp: "2026-01-01T00:00:00.000Z",
    };
    const result = await globalThis.DataLayer.submitStory(raw);
    assert.equal(result.ok, true, `submitStory should succeed in static mode, got: ${JSON.stringify(result)}`);
    assert.equal(result.stored, "sessionStorage");

    const stories = JSON.parse(globalThis.sessionStorage.getItem("hap_stories") || "[]");
    assert.ok(stories.length >= 1, "Expected at least one story in sessionStorage");
    const last = stories[stories.length - 1];
    assert.equal(last.category, "", "Invalid category should normalize to empty string");
    assert.equal(last.contactEmail, "", "Invalid email should normalize to empty string");
    assert.equal(last.hospitalName, "County Medical");
    assert.equal(last.storyText.length, 50);
  });

  it("should_truncate_hospitalName_to_200_chars_in_normalized_output", async () => {
    const longName = "Z".repeat(250);
    await globalThis.DataLayer.submitStory({
      hospitalName: longName,
      county: "Dauphin",
      category: "Rural Care",
      storyText: "B".repeat(80),
      submittedAt: new Date().toISOString(),
    });
    const stories = JSON.parse(globalThis.sessionStorage.getItem("hap_stories") || "[]");
    const last = stories[stories.length - 1];
    assert.equal(last.hospitalName.length, 200, "hospitalName must be truncated to 200 characters");
  });
});

describe("DataLayer.getStates (static globals)", () => {
  it("should_return_array_including_pennsylvania_with_expected_shape", async () => {
    const states = await globalThis.DataLayer.getStates();
    assert.ok(Array.isArray(states));
    assert.ok(states.length >= 50, "Expected all states (+DC) from static data");
    const pa = states.find((s) => s.stateCode === "PA");
    assert.ok(pa, "Pennsylvania row must exist");
    assert.match(pa.stateName, /Pennsylvania/i, "PA row should include human-readable name");
    assert.equal(typeof pa.hasContractPharmacyLaw, "boolean");
  });
});
