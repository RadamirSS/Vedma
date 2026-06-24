#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const phase = process.argv[2] || "after";
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const widths = [320, 375, 390, 430, 768, 1024];
const routes = ["/", "/services", "/products", "/about"];
const outDir = join(ROOT, "docs", "audit", "screenshots", phase);

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ locale: "ru-RU" });

  for (const route of routes) {
    for (const width of widths) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
      const slug = route === "/" ? "home" : route.slice(1);
      const file = join(outDir, `${slug}-${width}.png`);
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: file, fullPage: true });
        console.log(`✓ ${file}`);
      } catch (error) {
        console.error(`✗ ${file}:`, error.message);
      }
      await page.close();
    }
  }

  await browser.close();
  console.log(`Screenshots saved to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
