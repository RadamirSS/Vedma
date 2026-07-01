import { expect, test } from "@playwright/test";

const CYRILLIC = /[\u0400-\u04FF]/;

async function assertNoCyrillicInCards(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" });
  const cards = page.locator(".product-card");
  await expect(cards.first()).toBeVisible();
  const texts = await cards.allTextContents();
  for (const text of texts) {
    expect(text, `Cyrillic in ${path}`).not.toMatch(CYRILLIC);
  }
}

test.describe("Package 3.5.7 smoke", () => {
  test("EN catalog cards have no Cyrillic", async ({ page }) => {
    await assertNoCyrillicInCards(page, "/en/services");
    await assertNoCyrillicInCards(page, "/en/products");
  });

  test("account login page loads", async ({ page }) => {
    await page.goto("/en/account", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /sign in|account/i }).first()).toBeVisible();
  });

  test("broken localStorage does not crash EN home", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("bazhena-cart", "{bad");
    });
    await page.goto("/en", { waitUntil: "networkidle" });
    await expect(page.locator(".floating-cart__btn")).toBeVisible();
  });

  test("EN cart flow via floating button", async ({ page }) => {
    await page.goto("/en/services", { waitUntil: "networkidle" });
    const addButton = page.locator(".product-card .btn-primary").first();
    await addButton.click();
    await expect(page.locator(".floating-cart__count")).toBeVisible();
    await page.locator(".floating-cart__btn").click();
    await expect(page.locator(".drawer.open")).toBeVisible();
    await page.getByRole("link", { name: /view cart/i }).click();
    await expect(page).toHaveURL(/\/en\/cart/);
  });

  test("RU cart flow", async ({ page }) => {
    await page.goto("/ru/services", { waitUntil: "networkidle" });
    const addButton = page.locator(".product-card .btn-primary").first();
    await addButton.click();
    await page.locator(".floating-cart__btn").click();
    await expect(page.locator(".drawer.open")).toBeVisible();
  });

  test("header account label is not abbreviated", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en", { waitUntil: "networkidle" });
    await expect(page.locator(".account-btn__label")).toHaveText("Account");
    await expect(page.getByText("Acct.")).toHaveCount(0);
    await page.goto("/ru", { waitUntil: "networkidle" });
    await expect(page.locator(".account-btn__label")).toHaveText("Кабинет");
    await expect(page.getByText("Каб.")).toHaveCount(0);
  });
});
