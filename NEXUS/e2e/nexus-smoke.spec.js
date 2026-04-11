const { test, expect } = require("@playwright/test");

test("boot: launch dismisses splash without page errors", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (err) => {
    pageErrors.push(String(err && err.message ? err.message : err));
  });
  await page.goto("/");
  await expect(page.locator("#splash")).toBeVisible();
  await page.locator("#start-btn").click();
  await expect(page.locator("#splash")).toBeHidden({ timeout: 20_000 });
  expect(pageErrors, pageErrors.join("\n")).toEqual([]);
});

test("transport: toggling cycle does not throw", async ({ page }) => {
  await page.goto("/");
  await page.locator("#start-btn").click();
  await expect(page.locator("#splash")).toBeHidden({ timeout: 20_000 });
  const cycle = page.locator("#autobtn");
  await cycle.click();
  await cycle.click();
});
