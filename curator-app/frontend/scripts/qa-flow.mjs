import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

await page.goto("http://localhost:5173/welcome", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('a[href="/sign-up"]', { timeout: 30000 });

const href = await page.locator('a[href="/sign-up"]').first().getAttribute("href");
await page.locator('a[href="/sign-up"]').first().click();
await page.waitForURL("**/sign-up", { waitUntil: "commit", timeout: 15000 });

const desktopSplit = (await page.locator("aside").count()) > 0;

await page.fill('input[type="email"]', "test@curator.app");
await page.fill('input[type="password"]', "password123");
await page.locator('input[type="checkbox"]').check();
await page.getByRole("button", { name: /Continue/i }).click();
await page.waitForURL("**/onboarding", { waitUntil: "commit", timeout: 15000 });

await page.getByPlaceholder(/Curator address/i).fill("Harsh");
await page.getByRole("button", { name: /^Continue$/i }).first().click();
await page.waitForTimeout(800);

const onCategories = await page.getByText("What Interests You").isVisible();

await page.goto("http://localhost:5173/brief", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
const redirectedOnboarding = page.url().includes("/onboarding");
const sidebar = await page.locator('[data-layout="desktop-sidebar"]').count();

console.log(
  JSON.stringify({
    desktopSplitOnWelcome: desktopSplit > 0,
    reachedOnboarding: page.url().includes("/onboarding"),
    categoriesStep: onCategories,
    briefGuardsIncomplete: redirectedOnboarding,
    desktopSidebarOnBrief: sidebar > 0,
  }),
);

await browser.close();
