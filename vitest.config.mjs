import { defineConfig } from "vitest/config";

/**
 * Vitest — unit/integration tests for dashboard modules.
 * Per-file @vitest-environment overrides default (node).
 */
export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.mjs"],
    environment: "node",
    pool: "forks",
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["modules/supervisor-checks.js", "modules/data-layer.js", "modules/pa-impact-engine.js"],
    },
  },
});
