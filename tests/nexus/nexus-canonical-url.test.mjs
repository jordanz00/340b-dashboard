/**
 * ============================================================================
 * TEST SUITE: NEXUS canonical share URL builder
 * ============================================================================
 * MODULE UNDER TEST: same algorithm as NexusRelease.toCanonAppUrl in
 *   NEXUS/js/nexus-version.js
 * ============================================================================
 */
import { describe, it, expect } from "vitest";

const PAGES_BASE = "https://jordanz00.github.io/nexus-music-visualizer/";

function toCanonAppUrl(fromUrl) {
  const base = new URL(PAGES_BASE);
  const src = new URL(fromUrl);
  const out = new URL(base.href);
  out.search = src.search;
  out.hash = src.hash || "";
  return out.toString();
}

describe("toCanonAppUrl (mirror NexusRelease)", () => {
  it("rewrites origin and path, keeps seed query", () => {
    const u = toCanonAppUrl("http://127.0.0.1:4173/?seed=42&foo=1");
    expect(u).toMatch(/^https:\/\/jordanz00\.github\.io\/nexus-music-visualizer\//);
    expect(u).toContain("seed=42");
    expect(u).toContain("foo=1");
  });

  it("preserves hash", () => {
    expect(toCanonAppUrl("https://example.com/?seed=1#x")).toContain("#x");
  });
});
