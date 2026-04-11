import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "NEXUS/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    launchOptions: {
      args: ["--use-gl=swiftshader", "--disable-dev-shm-usage"],
    },
  },
  webServer: {
    command: "python3 -m http.server 4173",
    cwd: "NEXUS",
    url: "http://127.0.0.1:4173/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
