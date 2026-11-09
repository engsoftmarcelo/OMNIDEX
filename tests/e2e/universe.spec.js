import { test, expect } from "@playwright/test";

test("mecânicas permanecem ligadas por padrão também no navegador de teste", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?intro=0");
  await page.evaluate(() => {
    Math.random = () => 0.9;
  });
  await page.locator(".activate-button").click();
  await expect(page.locator(".alien-dialog h2")).toHaveText("Chama");
  await expect(page.locator(".dialog-energy strong")).toHaveText("45s");
});

test("linha do tempo filtra pela série e muda a cor de destaque", async ({
  page,
}) => {
  await page.goto("/?chaos=0");
  const timeline = page.getByRole("navigation", {
    name: "Linha do tempo das séries",
  });
  await expect(timeline.getByRole("button")).toHaveCount(5);
  const before = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--green"),
  );

  await timeline.getByRole("button", { name: /2008/ }).click();
  await expect(page.locator("#series")).toHaveValue("Alien Force");
  await expect(page.locator(".alien-card")).toHaveCount(16);
  const tinted = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--green"),
  );
  expect(tinted.trim()).not.toBe(before.trim());

  await timeline.getByRole("button", { name: /TODAS/ }).click();
  await expect(page.locator(".alien-card")).toHaveCount(72);
});

test("modo captura esconde o que não foi escaneado e o dossiê coleta o DNA", async ({
  page,
}) => {
  await page.goto("/?chaos=0");
  await expect(page.locator(".capture-progress strong")).toHaveText("0 de 72");
  await expect(page.locator(".alien-card.is-locked")).toHaveCount(0);

  await page.getByRole("button", { name: "Modo captura de DNA" }).click();
  await expect(page.locator(".alien-card.is-locked")).toHaveCount(72);
  const first = page.locator(".alien-card").first();
  await expect(first.locator("h3")).toHaveText("DNA não coletado");

  await first.getByRole("button", { name: /Escanear DNA/ }).click();
  const dialog = page.locator(".alien-dialog");
  await expect(dialog.locator("h2")).toHaveText("Chama");
  await expect(dialog.locator(".dialog-stamp")).toContainText("DNA COLETADO");
  await page.keyboard.press("Escape");

  await expect(page.locator(".capture-progress strong")).toHaveText("1 de 72");
  await expect(page.locator(".alien-card.is-locked")).toHaveCount(71);
  await expect(first.locator("h3")).toHaveText("Chama");

  await page.reload();
  await expect(page.locator(".capture-progress strong")).toHaveText("1 de 72");
  await expect(page.locator(".alien-card.is-locked")).toHaveCount(71);
});

test("mapa da galáxia mostra os planetas e filtra o catálogo", async ({
  page,
}) => {
  await page.goto("/?chaos=0");
  await page.getByRole("button", { name: "Galáxia" }).click();
  await expect(page.locator(".planet")).toHaveCount(43);

  await page.getByRole("button", { name: /^Terradino:/ }).click();
  const panel = page.locator(".planet-panel");
  await expect(panel.locator("h3")).toHaveText("Terradino");
  await expect(panel.locator(".planet-aliens li")).toHaveCount(3);

  await panel.getByRole("button", { name: "Ver no catálogo" }).click();
  await expect(page.locator(".alien-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Remover filtro do planeta Terradino" })
    .click();
  await expect(page.locator(".alien-card")).toHaveCount(72);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
});

test("dossiê traz resumo, ranking, navegação e árvore de evolução", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?chaos=0");
  await page.locator("#search").fill("Swampfire");
  await expect(page.locator(".alien-card")).toHaveCount(2);
  await page
    .locator(".alien-card")
    .first()
    .getByRole("button", { name: /Abrir dossiê/ })
    .click();

  const dialog = page.locator(".alien-dialog");
  await expect(dialog.locator("h2")).toHaveText("Swampfire");
  await expect(dialog.locator(".dialog-summary p")).toHaveCount(3);
  await expect(dialog.locator(".dialog-rank")).toHaveCount(6);
  await expect(dialog.locator(".dialog-energy")).toHaveCount(0);
  await expect(dialog.locator(".evolution-form")).toHaveCount(2);
  await expect(dialog.locator(".evolution-deltas li")).toHaveCount(6);

  await dialog.getByRole("button", { name: /FORMA SUPREMA/ }).click();
  await expect(dialog.locator("h2")).toHaveText("Ultimate Swampfire");
  await dialog.getByRole("button", { name: "Dossiê anterior" }).click();
  await expect(dialog.locator("h2")).toHaveText("Swampfire");
});

test("energia acaba, o dossiê fecha e o relógio recarrega", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?chaos=1");
  // Sorteio fixo: o relógio acerta o alien pedido.
  await page.evaluate(() => {
    Math.random = () => 0.9;
  });
  const activate = page.locator(".activate-button");
  await activate.click();

  const dialog = page.locator(".alien-dialog");
  await expect(dialog.locator("h2")).toHaveText("Chama");
  const energy = dialog.locator(".dialog-energy strong");
  await expect(energy).toHaveText("45s");

  // Pausar segura a contagem.
  await dialog.getByRole("button", { name: "Pausar contagem" }).click();
  await page.clock.runFor(5_000);
  await expect(energy).toHaveText("∞");
  await dialog.getByRole("button", { name: "Retomar contagem" }).click();

  await page.clock.runFor(36_000);
  await expect(dialog).toHaveClass(/is-low-energy/);
  await page.clock.runFor(10_000);
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".feedback-message")).toContainText(
    "Tempo esgotado",
  );
  await expect(activate).toBeDisabled();
  await expect(activate).toContainText("Recarregando");

  await page.clock.runFor(9_000);
  await expect(activate).toBeEnabled();
  await expect(activate).toContainText("Ativar transformação");
});

test("transformação errada entrega outro alien e avisa", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?chaos=1");
  // Sorteio fixo: a falha sempre acontece.
  await page.evaluate(() => {
    Math.random = () => 0.01;
  });
  await page.locator(".activate-button").click();
  const dialog = page.locator(".alien-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator("h2")).not.toHaveText("Chama");
  await expect(page.locator(".feedback-message")).toContainText(
    "você pediu Chama",
  );
});
