// Optional inspection helper; needs npm install and an installed Chrome browser.
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const records = JSON.parse(
  await fs.readFile("src/data/pokedex-data.json", "utf8"),
);
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1500 },
    deviceScaleFactor: 1,
  });
  for (let sheet = 0; sheet < 2; sheet++) {
    const tiles = await Promise.all(
      records.slice(sheet * 36, sheet * 36 + 36).map(async (alien) => {
        const bytes = await fs.readFile(`public${alien.image}`);
        return `<figure><figcaption>${String(alien.id).padStart(3, "0")} ${alien.name}<small>${alien.originalName}</small></figcaption><img alt="${alien.originalName}" src="data:image/webp;base64,${bytes.toString("base64")}"></figure>`;
      }),
    );
    await page.setContent(
      `<html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;padding:8px;display:grid;grid-template-columns:repeat(6,1fr);gap:8px;background:#171c18;color:#fff;font:15px Arial}figure{margin:0;height:235px;overflow:hidden}figcaption{height:42px}small{display:block;color:#b8c2ba;font-size:12px}img{display:block;width:100%;height:190px;object-fit:contain}</style>${tiles.join("")}</html>`,
    );
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
    await page.screenshot({
      path: `docs/cover-audit-${String(sheet + 1).padStart(2, "0")}.png`,
      fullPage: true,
    });
  }
} finally {
  await browser.close();
}
