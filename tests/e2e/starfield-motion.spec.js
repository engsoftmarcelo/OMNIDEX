import { test, expect } from "@playwright/test";

async function framesPainted(page) {
  return page.evaluate(() => globalThis.__starfieldFrames ?? 0);
}

async function settleBrowserFrames(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

test("fundo reage à mudança de movimento reduzido e pausa quando a aba fica oculta", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__starfieldFrames = 0;
    const original = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains("starfield")) {
        globalThis.__starfieldFrames += 1;
      }
      return original.apply(this, args);
    };
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?chaos=0");
  await expect.poll(() => framesPainted(page)).toBeGreaterThan(3);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await settleBrowserFrames(page);
  const reducedFrame = await framesPainted(page);
  await page.mouse.move(100, 100);
  await page.mouse.move(200, 200);
  await page.waitForTimeout(180);
  expect(await framesPainted(page)).toBe(reducedFrame);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect
    .poll(() => framesPainted(page))
    .toBeGreaterThan(reducedFrame + 2);

  // A aba oculta é simulada pelo estado/evento da Page Visibility API para
  // manter a verificação determinística também no Chrome sem janela.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hiddenFrame = await framesPainted(page);
  await page.waitForTimeout(180);
  expect(await framesPainted(page)).toBe(hiddenFrame);

  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => framesPainted(page)).toBeGreaterThan(hiddenFrame + 2);
});
