// Auditoria reproduzível de arquivos visuais e capturas; não altera dados.
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";

const records = JSON.parse(
  await fs.readFile("src/data/pokedex-data.json", "utf8"),
);
const images = [
  ...new Set(
    records.flatMap((alien) => [
      alien.image,
      ...alien.gallery.map((item) => item.src),
    ]),
  ),
];
const errors = [];
const failedRequests = [];
const channel = process.env.PLAYWRIGHT_CHANNEL || "chrome";
const browser = await chromium.launch({
  headless: true,
  ...(channel === "chromium" ? {} : { channel }),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    if (!request.failure()?.errorText.includes("ERR_ABORTED"))
      failedRequests.push(request.url());
  });
  await page.goto(process.env.OMNIDEX_URL || "http://127.0.0.1:5173");
  await page.evaluate(() => document.fonts.ready);
  await page.locator(".selector-stage img").evaluate((image) => image.decode());
  const brokenImages = await page.evaluate(async (sources) => {
    const failures = [];
    let next = 0;
    async function worker() {
      while (next < sources.length) {
        const src = sources[next++];
        const image = new Image();
        try {
          image.src = src;
          await image.decode();
          if (!image.naturalWidth || !image.naturalHeight) failures.push(src);
        } catch {
          failures.push(src);
        }
        image.src = "";
      }
    }
    await Promise.all(Array.from({ length: 8 }, worker));
    return failures;
  }, images);

  await fs.mkdir("docs", { recursive: true });
  await page.screenshot({ path: "docs/desktop.png" });
  await scrollToCatalog();
  await page.screenshot({ path: "docs/desktop-catalog.png" });
  await page.locator(".card-details").first().click();
  await page.locator("dialog[open]").waitFor();
  await page.screenshot({ path: "docs/desktop-dossier.png" });
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await page.screenshot({ path: "docs/desktop-operators.png" });
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();

  const viewports = [];
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 768, 1024],
    ["mobile", 390, 844],
    ["small-mobile", 375, 812],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `docs/${name}.png` });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    viewports.push({ name, width, height, horizontalOverflow: overflow });
    if (width < 800) {
      await scrollToCatalog();
      await page.screenshot({ path: `docs/${name}-catalog.png` });
    }
  }
  async function scrollToCatalog() {
    await page.locator("#catalog").evaluate((element) => {
      window.scrollTo(
        0,
        element.getBoundingClientRect().top + window.scrollY - 16,
      );
    });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page
      .locator(".alien-card img")
      .first()
      .evaluate((image) => image.decode());
  }
  const report = {
    checkedAt: new Date().toISOString(),
    browser: `Chrome ${browser.version()}`,
    uniqueImagesDecoded: images.length,
    brokenImages,
    errors,
    failedRequests,
    viewports,
  };
  await fs.writeFile(
    "docs/browser-audit.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
  if (
    brokenImages.length ||
    errors.length ||
    failedRequests.length ||
    viewports.some((item) => item.horizontalOverflow)
  )
    process.exitCode = 1;
} finally {
  await browser.close();
}
