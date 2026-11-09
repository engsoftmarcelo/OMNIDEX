import { test, expect } from "@playwright/test";

async function settleFrames(page) {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}

async function instrumentEffects(page) {
  await page.addInitScript(() => {
    globalThis.__effectUpdates = { cursor: 0, weather: 0 };
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.target.matches?.(".omni-cursor, .omni-cursor-dot")) {
          globalThis.__effectUpdates.cursor += 1;
        }
      }
    });
    observer.observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
    });
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.classList.contains("weather"))
        globalThis.__effectUpdates.weather += 1;
      return clear.apply(this, args);
    };
  });
}

async function countUpdates(page, effect) {
  return page.evaluate((name) => globalThis.__effectUpdates[name], effect);
}

async function weatherHasPixels(page) {
  return page.locator("canvas.weather").evaluate((canvas) => {
    const pixels = canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height).data;
    for (let alpha = 3; alpha < pixels.length; alpha += 4) {
      if (pixels[alpha] > 0) return true;
    }
    return false;
  });
}

async function setHidden(page, hidden) {
  // Simula o estado e evento oficiais da Page Visibility API. O navegador
  // headless não precisa alternar janelas reais para verificar o listener.
  await page.evaluate((value) => {
    if (value)
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
    else delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  }, hidden);
}

test("mira para em movimento reduzido e aba oculta, retomando sem loop ocioso", async ({
  page,
}) => {
  await instrumentEffects(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?intro=0&chaos=0");
  const cursor = page.locator(".omni-cursor");
  await page.mouse.move(100, 140);
  await expect(cursor).toBeVisible();
  await expect.poll(() => countUpdates(page, "cursor")).toBeGreaterThan(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await settleFrames(page);
  await expect(cursor).toBeHidden();
  const reduced = await countUpdates(page, "cursor");
  await page.mouse.move(300, 260);
  await page.waitForTimeout(180);
  expect(await countUpdates(page, "cursor")).toBe(reduced);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(cursor).toBeVisible();
  await expect
    .poll(() => countUpdates(page, "cursor"))
    .toBeGreaterThan(reduced);
  await setHidden(page, true);
  await expect(cursor).toBeHidden();
  const hidden = await countUpdates(page, "cursor");
  await page.waitForTimeout(180);
  expect(await countUpdates(page, "cursor")).toBe(hidden);

  await setHidden(page, false);
  await expect(cursor).toBeVisible();
  // Retomar sem mudar a posição não exige escrever um estilo já idêntico.
  // Um novo movimento verifica a resposta real antes de conferir a pausa.
  await page.mouse.move(600, 360);
  await expect.poll(() => countUpdates(page, "cursor")).toBeGreaterThan(hidden);
  await expect
    .poll(() =>
      cursor.evaluate((element) => {
        const position = new DOMMatrixReadOnly(element.style.transform);
        return Math.hypot(position.m41 - 600, position.m42 - 360);
      }),
    )
    .toBeLessThanOrEqual(0.1);
  await settleFrames(page);
  const settled = await countUpdates(page, "cursor");
  await page.waitForTimeout(180);
  expect(await countUpdates(page, "cursor")).toBe(settled);
});

test("clima limpa partículas ao escolher categoria sem efeito e pausa em reduce/hidden", async ({
  page,
}) => {
  await instrumentEffects(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/?intro=0&chaos=0");
  const canvas = page.locator("canvas.weather");
  await expect(canvas).toHaveAttribute("data-weather", "embers");
  await expect.poll(() => weatherHasPixels(page)).toBe(true);
  const beforeSelection = await countUpdates(page, "weather");

  await page
    .getByRole("button", {
      name: "Selecionar Quatro Braços no Omnitrix",
      exact: true,
    })
    .click();
  await expect(canvas).toHaveAttribute("data-weather", "motes");
  await expect
    .poll(() => countUpdates(page, "weather"))
    .toBeGreaterThan(beforeSelection);
  await expect.poll(() => weatherHasPixels(page)).toBe(false);
  await settleFrames(page);
  const withoutWeather = await countUpdates(page, "weather");
  await page.waitForTimeout(180);
  expect(await countUpdates(page, "weather")).toBe(withoutWeather);

  await page
    .getByRole("button", { name: "Selecionar Chama no Omnitrix", exact: true })
    .click();
  await expect(canvas).toHaveAttribute("data-weather", "embers");
  await expect.poll(() => weatherHasPixels(page)).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await settleFrames(page);
  await expect.poll(() => weatherHasPixels(page)).toBe(false);
  const reduced = await countUpdates(page, "weather");
  await page.waitForTimeout(180);
  expect(await countUpdates(page, "weather")).toBe(reduced);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect.poll(() => weatherHasPixels(page)).toBe(true);
  await setHidden(page, true);
  await expect.poll(() => weatherHasPixels(page)).toBe(false);
  const hidden = await countUpdates(page, "weather");
  await page.waitForTimeout(180);
  expect(await countUpdates(page, "weather")).toBe(hidden);
  await setHidden(page, false);
  await expect.poll(() => weatherHasPixels(page)).toBe(true);
});
