import { test, expect } from "@playwright/test";

test("abertura espera o toque, percorre as fases e libera a página", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?intro=1");

  const intro = page.locator("dialog.intro");
  await expect(intro).toBeVisible();
  await expect(intro).toHaveAttribute("data-phase", "gate");
  const start = page.getByRole("button", { name: "Toque para iniciar" });
  await expect(start).toBeFocused();

  // Sem toque, nada avança sozinho.
  await page.waitForTimeout(700);
  await expect(intro).toHaveAttribute("data-phase", "gate");

  await start.click();
  await expect(intro).toHaveAttribute("data-phase", "fall");
  await expect(intro).toHaveAttribute("data-phase", "impact");
  await expect(intro).toHaveAttribute("data-phase", "open");
  await expect(intro.locator(".intro-device")).toBeVisible();
  await expect(intro).toHaveCount(0, { timeout: 8_000 });

  await expect(page.locator(".alien-card")).toHaveCount(72);
  expect(
    await page.evaluate(() => sessionStorage.getItem("omnidex:intro:v1")),
  ).toBe("done");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  expect(errors).toEqual([]);
});

test("abertura pode ser pulada com Esc e não cobre a página depois", async ({
  page,
}) => {
  await page.goto("/?intro=1");
  await expect(page.locator("dialog.intro")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog.intro")).toHaveCount(0);
  await expect(page.locator(".boot-splash")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Ativar transformação/ }),
  ).toBeVisible();
});

test("movimento reduzido abre a página sem abertura", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?intro=1");
  await expect(page.locator("dialog.intro")).toHaveCount(0);
  await expect(page.locator(".alien-card")).toHaveCount(72);
});

test("mostrador gira ao arrastar e o núcleo dispara a transformação", async ({
  page,
}) => {
  await page.goto("/?chaos=0");
  const name = page.locator(".selector-name h2");
  await expect(name).toHaveText("Chama");
  await expect(page.locator(".selector-stage .omni-device")).toHaveCount(1);
  await expect(page.locator(".selector-stage img")).toHaveCount(1);

  const box = await page.locator(".selector-stage").boundingBox();
  const y = box.y + box.height / 2;
  const x = box.x + box.width / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 60, y, { steps: 4 });
  await page.mouse.up();
  await expect(name).not.toHaveText("Chama");
  const afterDrag = await name.textContent();

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 60, y, { steps: 4 });
  await page.mouse.up();
  await expect(name).toHaveText("Chama");
  expect(afterDrag).not.toBe("Chama");

  await page.getByRole("button", { name: /Ativar transformação/ }).click();
  await expect(page.locator(".transform-sequence")).toBeVisible();
});
