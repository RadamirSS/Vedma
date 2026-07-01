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

const env = loadEnv(process.env.ENV_FILE ?? resolve(process.cwd(), ".env"));
const baseUrl = "https://bajena.it";
const timestamp = Date.now();
const serviceSlug = `pkg33-upload-service-${timestamp}`;
const imagePath = resolve(process.cwd(), ".tmp/pkg33-test.png");

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="email"]').fill(env.MANAGER_EMAIL);
  await page.locator('input[name="password"]').fill(env.MANAGER_PASSWORD);
  await page.getByRole("button", { name: /Войти/i }).click();
  await page.waitForURL(/\/admin\/dashboard/);

  await page.goto(`${baseUrl}/admin/services/new`, { waitUntil: "domcontentloaded" });
  await page.locator('input[name="title"]').fill(`PKG33 Upload Service ${timestamp}`);
  await page.locator('input[name="slug"]').fill(serviceSlug);
  await page.locator('select[name="publicationStatus"]').selectOption("PUBLISHED");
  await page.locator('input[name="priceRub"]').fill("1500");
  await page.locator('input[name="mainImageUpload"]').setInputFiles(imagePath);
  await page.getByRole("button", { name: "Сохранить" }).click();
  await page.waitForURL(/\/admin\/services\//, { timeout: 45000 });

  const publicUrl = `${baseUrl}/services/${serviceSlug}`;
  const html = await (await fetch(publicUrl)).text();
  const match = html.match(/\/uploads\/admin\/[^"\\]+/);
  if (!match) throw new Error("Service public page missing admin upload image");

  console.log(JSON.stringify({
    success: true,
    serviceSlug,
    serviceImagePath: match[0],
    publicServiceUrl: publicUrl
  }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
