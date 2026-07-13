import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("dashboard and project wizard remain accessible", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "PDF Ebook Studio" })).toBeVisible();
  await expect(page.getByRole("button", { name: /project importeren|import project/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /agent zip importeren|import agent zip/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /voorbeeldprojecten|sample projects/i })).toBeVisible();
  await page.getByRole("button", { name: /nieuw project|new project/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel(/projecttitel|project title/i)).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

test("imports and sample projects stay available when the library has projects", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /nieuw project|new project/i }).first().click();
  await page.getByLabel(/projecttitel|project title/i).fill("Dashboard regressietest");
  await page.getByRole("button", { name: /volgende|next/i }).click();
  await page.getByRole("button", { name: /volgende|next/i }).click();
  await page.getByRole("button", { name: /volgende|next/i }).click();
  await page.getByRole("button", { name: /maak project|create project/i }).click();
  await page.getByRole("button", { name: /projecten|projects/i }).first().click();

  await expect(page.getByRole("button", { name: /project importeren|import project/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /agent zip importeren|import agent zip/i })).toBeVisible();
  await expect(page.getByText(/toon de voorbeelden|show samples/i)).toBeVisible();
});

test("mobile editor keeps unfinished input while switching work modes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile work-mode regression");
  await page.goto("/");
  await page.getByRole("button", { name: /nieuw project|new project/i }).first().click();
  await page.getByLabel(/projecttitel|project title/i).fill("Mobiele regressietest");
  await page.getByRole("button", { name: /volgende/i }).click();
  await page.getByRole("button", { name: /volgende/i }).click();
  await page.getByRole("button", { name: /volgende/i }).click();
  await page.getByRole("button", { name: /maak project|create project/i }).click();
  await page.getByRole("button", { name: "Bewerken" }).click();
  const title = page.getByLabel("Title").first();
  await title.fill("Nog niet opgeslagen invoer");
  await page.getByRole("button", { name: "Preview" }).click();
  await page.getByRole("button", { name: "Bewerken" }).click();
  await expect(title).toHaveValue("Nog niet opgeslagen invoer");
});
