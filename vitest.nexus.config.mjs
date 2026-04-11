import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/nexus/**/*.test.mjs"],
    environment: "node",
    pool: "forks",
    clearMocks: true,
  },
});
