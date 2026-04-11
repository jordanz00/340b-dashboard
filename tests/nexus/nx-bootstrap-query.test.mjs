/**
 * ============================================================================
 * TEST SUITE: NEXUS URL allowlist (demo param)
 * ============================================================================
 * MODULE UNDER TEST: logic must match NEXUS/js/nexus-bootstrap-query.js
 * PRODUCT: NEXUS Engine
 * TEST TYPE: Unit
 * FRAMEWORK: Vitest
 * ============================================================================
 */
import { describe, it, expect } from "vitest";

/** Keep in sync with `DEMO_IDS` in NEXUS/js/nexus-bootstrap-query.js */
const DEMO_IDS = {
  drop: 1,
  festival: 1,
  genres: 1,
  ai: 1,
  resolume: 1,
};

function normalizeDemo(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  try {
    s = decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    /* ignore */
  }
  s = s.replace(/[^a-z0-9_-]/gi, "").slice(0, 48).toLowerCase();
  if (!s || !DEMO_IDS[s]) return null;
  return s;
}

describe("normalizeDemo (mirror of NX.BootstrapQuery)", () => {
  it("accepts known demo ids", () => {
    expect(normalizeDemo("drop")).toBe("drop");
    expect(normalizeDemo("Resolume")).toBe("resolume");
  });

  it("rejects traversal and unknown ids", () => {
    expect(normalizeDemo("../../etc/passwd")).toBeNull();
    expect(normalizeDemo("evil")).toBeNull();
    expect(normalizeDemo("")).toBeNull();
  });

  it("strips punctuation around known ids", () => {
    expect(normalizeDemo("drop!!!")).toBe("drop");
  });
});
