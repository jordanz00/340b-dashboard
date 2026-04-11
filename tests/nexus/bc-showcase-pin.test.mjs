/**
 * ============================================================================
 * TEST SUITE: Aurora showcase default preset pin
 * ============================================================================
 * MODULE UNDER TEST: NEXUS/js/nexus-engine/bc-showcase.js (string contract)
 * PRODUCT: NEXUS Engine
 * TEST TYPE: Unit
 * FRAMEWORK: Vitest
 * ============================================================================
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const showcasePath = join(__dirname, "../../NEXUS/js/nexus-engine/bc-showcase.js");

describe("bc-showcase default pin", () => {
  it("keeps defaultButterchurnKey for cold-start parity", () => {
    const src = readFileSync(showcasePath, "utf8");
    expect(src).toContain("defaultButterchurnKey");
    expect(src).toMatch(/martin\s*-\s*castle\s+in\s+the\s+air/i);
  });
});
