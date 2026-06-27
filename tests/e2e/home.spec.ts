import { test, expect } from "@playwright/test";

test("home page renders and shows login CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /xadrez online/i })).toBeVisible();
});
