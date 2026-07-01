import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx);
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envPath = process.env.ENV_FILE ?? resolve(process.cwd(), ".env");
const env = loadEnv(envPath);
const baseUrl = process.env.E2E_BASE_URL ?? "https://bajena.it";
const managerEmail = env.MANAGER_EMAIL;
const managerPassword = env.MANAGER_PASSWORD;
const imagePath = resolve(process.cwd(), ".tmp/pkg33-test.png");
const timestamp = Date.now();
const productSlug = `pkg33-upload-product-${timestamp}`;

const result = {
  baseUrl,
  productSlug,
  serviceSlug: null,
  productImagePath: null,
  serviceImagePath: null,
  publicProductUrl: null,
  publicServiceUrl: null,
  success: false,
  error: null
};

if (!managerEmail || !managerPassword) {
  console.log(JSON.stringify({ ...result, error: "Missing manager credentials in env" }, null, 2));
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(managerEmail);
  await page.locator('input[name="password"]').fill(managerPassword);
  await page.getByRole("button", { name: /Войти/i }).click();
  await page.waitForURL(/\/admin\/dashboard/, { timeout: 30000 });

  await page.goto(`${baseUrl}/admin/products/new`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="title"]').fill(`PKG33 Upload Product ${timestamp}`);
  await page.locator('input[name="slug"]').fill(productSlug);
  await page.locator('select[name="publicationStatus"]').selectOption("PUBLISHED");
  await page.locator('input[name="priceRub"]').fill("999");
  await page.locator('input[name="mainImageUpload"]').setInputFiles(imagePath);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.waitForURL(/\/admin\/products\//, { timeout: 45000 });

  const productAdminUrl = page.url();
  result.publicProductUrl = `${baseUrl}/products/${productSlug}`;

  await page.goto(result.publicProductUrl, { waitUntil: "domcontentloaded" });
  const productImg = page.locator(".detail-visual img, .catalog-visual img, img").first();
  await productImg.waitFor({ timeout: 15000 });
  const productSrc = await productImg.getAttribute("src");
  if (!productSrc || !productSrc.includes("/uploads/admin/")) {
    throw new Error(`Product public image not from admin uploads: ${productSrc}`);
  }
  result.productImagePath = productSrc;

  const serviceSlug = `pkg33-upload-service-${timestamp}`;
  result.serviceSlug = serviceSlug;
  await page.goto(`${baseUrl}/admin/services/new`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="title"]').fill(`PKG33 Upload Service ${timestamp}`);
  await page.locator('input[name="slug"]').fill(serviceSlug);
  await page.locator('select[name="publicationStatus"]').selectOption("PUBLISHED");
  await page.locator('input[name="priceRub"]').fill("1500");
  await page.locator('input[name="mainImageUpload"]').setInputFiles(imagePath);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.waitForURL(/\/admin\/services\//, { timeout: 45000 });

  result.publicServiceUrl = `${baseUrl}/services/${serviceSlug}`;
  await page.goto(result.publicServiceUrl, { waitUntil: "domcontentloaded" });
  const serviceImg = page.locator(".detail-visual img, .catalog-visual img, img").first();
  await serviceImg.waitFor({ timeout: 15000 });
  const serviceSrc = await serviceImg.getAttribute("src");
  if (!serviceSrc || !serviceSrc.includes("/uploads/admin/")) {
    throw new Error(`Service public image not from admin uploads: ${serviceSrc}`);
  }
  result.serviceImagePath = serviceSrc;
  result.success = true;

  console.log(JSON.stringify({ ...result, productAdminUrl }, null, 2));
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
