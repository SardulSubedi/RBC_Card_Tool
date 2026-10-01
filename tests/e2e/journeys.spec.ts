import { expect, test } from "@playwright/test";
import { sampleGroceryCsv } from "../../packages/engine/src/demos";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const shots = join(process.cwd(), "../../tests/e2e/artifacts");
mkdirSync(shots, { recursive: true });

test("a demo profile shows a priced recommendation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: join(shots, "start-desktop.png"), fullPage: true });
  await page.getByTestId("demo-grocery").click();
  await expect(page.getByTestId("winner-name")).not.toBeEmpty();
  await expect(page.getByTestId("winner-value")).toContainText("$");
  await expect(page.getByTestId("footer")).toContainText("Not affiliated with RBC");
  await page.screenshot({ path: join(shots, "grocery-desktop.png"), fullPage: true });
});

test("the sample CSV reconciles and reaches a recommendation", async ({ page }) => {
  const file = join(tmpdir(), "cardfit-grocery.csv");
  writeFileSync(file, sampleGroceryCsv());
  await page.goto("/");
  await page.getByTestId("open-import").click();
  await page.getByTestId("csv-input").setInputFiles(file);
  await page.getByTestId("sign-positive").click();
  await expect(page.getByTestId("reconciliation")).toContainText("Eligible net purchases");
  await page.getByTestId("use-import").click();
  await expect(page.getByTestId("winner-name")).not.toBeEmpty();
});

test("no travel card qualifies when the fee limit is zero", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByTestId("demo-student").click();
  await page.getByTestId("focus-travel").click();
  await expect(page.getByTestId("empty-state")).toContainText("No travel card");
  await page.screenshot({ path: join(shots, "empty-mobile.png"), fullPage: true });
});
