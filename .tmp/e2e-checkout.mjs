import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const timestamp = Date.now();
const email = `test+pkg33-${timestamp}@bajena.it`;
const password = "Pkg33Smoke1!";
const productSlug = "braslet-iz-lunnogo-kamnya-ocharovanie";

const result = {
  baseUrl,
  email,
  productSlug,
  success: false,
  orderNumber: null,
  orderId: null,
  accountUrl: null,
  adminOrderUrl: null,
  error: null
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  const adminLinks = await page.locator('a[href^="/admin"]').count();
  if (adminLinks > 0) {
    throw new Error(`Found ${adminLinks} public /admin links on homepage`);
  }

  await page.goto(`${baseUrl}/products/${productSlug}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate((slug) => {
    localStorage.setItem(
      "bazhena-cart",
      JSON.stringify([{ type: "product", slug, qty: 1 }])
    );
  }, productSlug);

  await page.goto(`${baseUrl}/checkout`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);

  const submit = page.getByRole("button", { name: "Отправить заказ" });
  await submit.waitFor({ state: "visible", timeout: 60000 });
  for (let i = 0; i < 30; i++) {
    if (!(await submit.isDisabled())) break;
    await page.waitForTimeout(1000);
  }

  await page.locator("#name").fill("Package 3.3 Smoke");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.locator("#phone").fill("+70000000001");
  await page.locator("#telegram").fill("@pkg33smoke");
  await page.locator("#city").fill("Tbilisi");
  await page.locator("#country").fill("Georgia");
  if (await page.locator("#addressLine1").isVisible()) {
    await page.locator("#addressLine1").fill("Smoke street 1");
    await page.locator("#postalCode").fill("0101");
  }
  await page.locator('input[name="ageConfirmed"]').check();
  await page.locator('input[name="legalAccepted"]').check();

  const submitBtn = page.getByRole("button", { name: "Отправить заказ" });
  if (await submitBtn.isDisabled()) {
    const reason = await page.locator(".checkout-error").allTextContents();
    throw new Error(`Submit disabled: ${reason.join(" | ") || "unknown"}`);
  }

  await submitBtn.click();
  await page.getByText("Заказ", { exact: false }).first().waitFor({ timeout: 30000 });

  const successText = await page.locator(".checkout-success").textContent();
  const orderLink = page.getByRole("link", { name: "Перейти к заказу" });
  await orderLink.waitFor({ timeout: 10000 });
  const href = await orderLink.getAttribute("href");
  result.accountUrl = href;
  result.orderId = href?.split("/").pop() ?? null;
  const match = successText?.match(/ORD-\d{8}-[A-Z0-9]+/);
  result.orderNumber = match?.[0] ?? null;

  await orderLink.click();
  await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
  result.success = true;

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
