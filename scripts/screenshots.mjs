// Captures the Devpost gallery screenshots (1920x1080) from the live demo with the installed Chrome.
//   node scripts/screenshots.mjs [https://argus-eight-xi.vercel.app]
import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";

const BASE = process.argv[2] ?? "https://argus-eight-xi.vercel.app";
const OUT = "docs/media/screenshots";
const CHROME = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";

await mkdir(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, protocolTimeout: 300_000, args: ["--hide-scrollbars", "--force-color-profile=srgb"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("captured", name);
};
const clickText = async (text) => {
  const handle = await page.evaluateHandle((t) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(t)), text);
  await handle.asElement().click();
};
const waitText = (text, timeout = 240_000) =>
  page.waitForFunction((t) => document.body.innerText.toLowerCase().includes(t.toLowerCase()), { timeout }, text);
const waitPhotos = () => page.waitForFunction(() => document.querySelectorAll("figure img").length >= 3, { timeout: 60_000 });

// 1. Landing hero
await page.goto(BASE, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 1500));
await shot("01-landing");

// 2. Capture form filled with the problem kitchen
await clickText("Kitchen with problems");
await waitPhotos();
await new Promise((r) => setTimeout(r, 1500));
await page.evaluate(() => document.querySelector("#inspect")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 800));
await shot("02-capture");

// 3. Timeline while the agent works (right after perception lands)
await clickText("Run the inspection");
await waitText("anomal");
await new Promise((r) => setTimeout(r, 2500));
await shot("03-timeline");

// 4. Report: verdict banner
try {
  await waitText("Simulated inspection report", 200_000);
} catch (e) {
  await shot("debug-timeout");
  console.log(await page.evaluate(() => document.body.innerText.slice(0, 1200)));
  throw e;
}
await new Promise((r) => setTimeout(r, 1200));
await page.evaluate(() => window.scrollTo(0, 0));
await shot("04-report-verdict");

// 5. Kitchen map + evidence gallery
await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => /Kitchen map/.test(h.textContent))?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 600));
await shot("05-report-map-evidence");

// 6. Critical findings
await page.evaluate(() => [...document.querySelectorAll("h2")].find((h) => /critical findings/i.test(h.textContent))?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 600));
await shot("06-report-findings");

// 7. Food safety plan
await clickText("Generate the food safety plan");
await waitText("Priority action plan");
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => document.querySelector("#pms-title")?.scrollIntoView({ block: "start" }));
await new Promise((r) => setTimeout(r, 600));
await shot("07-food-safety-plan");

// 8. Well-run kitchen verdict
await clickText("New inspection");
await new Promise((r) => setTimeout(r, 800));
await clickText("Well-run kitchen");
await waitPhotos();
await new Promise((r) => setTimeout(r, 1500));
await clickText("Run the inspection");
await waitText("Simulated inspection report");
await new Promise((r) => setTimeout(r, 1200));
await page.evaluate(() => window.scrollTo(0, 0));
await shot("08-well-run-verdict");

await browser.close();
