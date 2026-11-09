import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__audioPlays = [];
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      const record = { src: this.src, started: false, player: this };
      window.__audioPlays.push(record);
      this.addEventListener(
        "playing",
        () => {
          record.started = true;
        },
        { once: true },
      );
      return originalPlay.apply(this, args);
    };
  });
  await page.goto("/?chaos=0");
});

test("MP3 clássico é local, só toca por ação e reutiliza a seleção", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.__audioPlays.length)).toBe(0);
  await page
    .getByRole("button", { name: "Próxima transformação", exact: true })
    .click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioPlays.some(
          (item) =>
            item.started &&
            item.src.endsWith("/audio/omnitrix-classic-select.mp3"),
        ),
      ),
    )
    .toBe(true);
  await page
    .getByRole("button", { name: "Selecionar Chama no Omnitrix", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => new Set(window.__audioPlays.map((item) => item.player)).size,
    ),
  ).toBe(1);
});

test("ativação clássica tem fases, áudio real, foco contido e abre o mesmo DNA", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page
    .getByRole("button", { name: "Ativar transformação", exact: true })
    .click();
  const sequence = page.locator(".transform-sequence");
  await expect(sequence).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Pular animação" }),
  ).toBeFocused();
  await expect(sequence).toHaveAttribute("data-phase", "charge");
  await expect(sequence).toHaveAttribute("data-phase", "transform");
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement.closest(".transform-sequence"),
    ),
  ).toBe(true);
  await expect(sequence).toHaveAttribute("data-phase", "reveal");
  expect(
    await page.locator(".transformation-caption").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }),
  ).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.__audioPlays.some(
          (item) =>
            item.started &&
            item.src.endsWith("/audio/omnitrix-classic-transform.mp3"),
        ),
      ),
    )
    .toBe(true);
  await expect(page.locator(".alien-dialog")).toBeVisible();
  await expect(page.locator("#dossier-title")).toHaveText("Chama");
  await expect(sequence).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Ativar transformação", exact: true }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test("Escape pula a animação sem deixar timer que reabre dossiê", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ativar transformação", exact: true })
    .click();
  await expect(page.locator(".transform-sequence")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".alien-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await expect(page.locator(".alien-dialog")).toHaveCount(0);
  await expect(page.locator("#operators-title")).toBeVisible();
  // A janela do antigo timer já passou; nenhuma abertura atrasada deve ocorrer.
  await page.waitForTimeout(1900);
  await expect(page.locator("dialog[open]")).toHaveCount(0);
});

test("movimento reduzido pula direto ao dossiê, inclusive ao mudar durante ativação", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Ativar transformação", exact: true })
    .click();
  await expect(page.locator(".transform-sequence")).toHaveCount(0);
  await expect(page.locator(".alien-dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page
    .getByRole("button", { name: "Ativar transformação", exact: true })
    .click();
  await expect(page.locator(".transform-sequence")).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".transform-sequence")).toHaveCount(0);
  await expect(page.locator(".alien-dialog")).toBeVisible();
});

test("silenciar pausa o MP3 em curso e a preferência permanece após recarregar", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Próxima transformação", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Desativar efeitos sonoros", exact: true })
    .click();
  expect(
    await page.evaluate(() =>
      window.__audioPlays.every((item) => item.player.paused),
    ),
  ).toBe(true);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Ativar efeitos sonoros", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page
    .getByRole("button", { name: "Próxima transformação", exact: true })
    .click();
  expect(await page.evaluate(() => window.__audioPlays.length)).toBe(0);
});

test("sequência cabe no celular e oferece pular por toque", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page
    .getByRole("button", { name: "Ativar transformação", exact: true })
    .click();
  await expect(page.locator(".transform-sequence")).toBeVisible();
  expect(
    await page
      .locator(".transform-sequence")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  expect(
    await page
      .locator(".transformation-caption")
      .evaluate(
        (element) => element.getBoundingClientRect().bottom <= innerHeight,
      ),
  ).toBe(true);
  expect(
    await page.locator(".transformation-center").evaluate((element) => {
      const center = element.getBoundingClientRect();
      const caption = document
        .querySelector(".transformation-caption")
        .getBoundingClientRect();
      return center.top > 70 && center.bottom + 40 < caption.top;
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Pular animação" }).click();
  await expect(page.locator(".alien-dialog")).toBeVisible();
});
