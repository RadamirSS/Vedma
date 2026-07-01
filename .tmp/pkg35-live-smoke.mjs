import { chromium } from "playwright";

const ts = Date.now();
const enEmail = `test+pkg35-en-${ts}@bajena.it`;
const ruEmail = `test+pkg35-ru-${ts}@bajena.it`;
const base = "https://bajena.it";

const results = {};

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  // Mobile header EN
  await page.goto(`${base}/en`);
  results.mobileAccountVisible = await page.locator(".account-btn").isVisible();
  results.mobileCartVisible = await page.locator(".cart-btn").isVisible();
  results.mobileMenuVisible = await page.locator(".burger").isVisible();

  // EN login wrong password
  await page.goto(`${base}/en/account/login`);
  await page.fill('input[name="email"]', "wrong@example.com");
  await page.fill('input[name="password"]', "wrongpass");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/error=/);
  results.enLoginError = decodeURIComponent(new URL(page.url()).searchParams.get("error") || "");

  // RU login wrong password
  await page.goto(`${base}/ru/account/login`);
  await page.fill('input[name="email"]', "wrong@example.com");
  await page.fill('input[name="password"]', "wrongpass");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/error=/);
  results.ruLoginError = decodeURIComponent(new URL(page.url()).searchParams.get("error") || "");

  // EN register mismatch
  await page.goto(`${base}/en/account/register`);
  await page.fill('input[name="name"]', "Test");
  await page.fill('input[name="email"]', "a@example.com");
  await page.fill('input[name="emailConfirm"]', "b@example.com");
  await page.fill('input[name="password"]', "TestPass123!");
  await page.fill('input[name="passwordConfirm"]', "TestPass123!");
  await page.check('input[name="legalAccepted"]');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/error=/);
  results.enRegisterError = decodeURIComponent(new URL(page.url()).searchParams.get("error") || "");

  // Locale switcher
  await page.goto(`${base}/en/services`);
  await page.locator(".locale-switcher button, .locale-switcher a").filter({ hasText: "RU" }).first().click();
  await page.waitForURL(/\/ru\/services/);
  results.localeSwitchToRu = page.url().includes("/ru/services");

  // EN product checkout
  await page.goto(`${base}/en/products/braslet-iz-lunnogo-kamnya-ocharovanie`);
  await page.locator('button:has-text("Add to cart")').click();
  await page.goto(`${base}/en/checkout`);
  results.enCheckoutPhone = (await page.locator('select[name="contactMethod"] option:checked').textContent())?.trim();
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1500);
  results.enCheckoutValidation = await page.locator(".checkout-error, .field-error").first().textContent();

  await page.fill('input[name="name"]', "Test EN Customer");
  await page.fill('input[name="email"]', enEmail);
  await page.fill('input[name="emailConfirm"]', enEmail);
  await page.fill('input[name="password"]', "TestPass123!");
  await page.fill('input[name="passwordConfirm"]', "TestPass123!");
  await page.fill('input[name="phone"]', "+79991234567");
  await page.fill('input[name="country"]', "Russia");
  await page.fill('input[name="city"]', "Moscow");
  await page.fill('input[name="street"]', "Tverskaya");
  await page.fill('input[name="house"]', "1");
  await page.check('input[name="ageConfirmed"]');
  await page.check('input[name="legalAccepted"]');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/en\/checkout\?/, { timeout: 30000 }).catch(() => null);
  results.enCheckoutSuccess = page.url().includes("success=1") || (await page.locator("text=Order placed").count()) > 0;
  results.enCheckoutSuccessText = await page.locator(".checkout-success-panel, .form-card").first().textContent();
  results.enOrderUrl = page.url();

  const paidBtn = page.locator('button:has-text("I have paid"), button:has-text("I have paid")');
  if (await paidBtn.count()) {
    await paidBtn.first().click();
    await page.waitForTimeout(1500);
    results.enPaidMessage = await page.locator(".checkout-success-panel, .form-card, .admin-notice").first().textContent();
  }

  // RU service checkout
  await page.goto(`${base}/ru/services/diagnostika-negativa`);
  await page.locator('button:has-text("В корзину")').click();
  await page.goto(`${base}/ru/checkout`);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(1000);
  results.ruCheckoutValidation = await page.locator(".checkout-error, .field-error").first().textContent();

  await page.fill('input[name="name"]', "Test RU Customer");
  await page.fill('input[name="email"]', ruEmail);
  await page.fill('input[name="emailConfirm"]', ruEmail);
  await page.fill('input[name="password"]', "TestPass123!");
  await page.fill('input[name="passwordConfirm"]', "TestPass123!");
  await page.fill('input[name="phone"]', "+79997654321");
  await page.check('input[name="ageConfirmed"]');
  await page.check('input[name="legalAccepted"]');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/ru\/checkout\?/, { timeout: 30000 }).catch(() => null);
  results.ruCheckoutSuccess = page.url().includes("success=1") || (await page.locator("text=Заказ оформлен").count()) > 0;
  results.ruOrderUrl = page.url();

  results.enEmail = enEmail;
  results.ruEmail = ruEmail;

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
