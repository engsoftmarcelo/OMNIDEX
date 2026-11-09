import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?chaos=0");
  await expect(page.locator(".alien-card")).toHaveCount(72);
});

test("indicadores dos operadores são derivados dos IDs, com limite de dez", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  for (const card of await page.locator(".operator-card").all()) {
    const count = await card.locator(".operator-list li").count();
    await expect(card.locator(".operator-count strong")).toHaveText(
      String(count),
    );
    await expect(card.locator(".operator-badges")).toHaveAttribute(
      "aria-label",
      `${count} de 10 espaços de seleção preenchidos`,
    );
    await expect(card.locator(".operator-badges-row .is-earned")).toHaveCount(
      count,
    );
    await expect(card.locator(".operator-badges-row svg")).toHaveCount(10);
  }
});

async function addComparison(page, id) {
  await page
    .getByLabel("Buscar transformação")
    .fill(String(id).padStart(3, "0"));
  await page.locator(".card-compare").click();
}

async function openComparison(page, first = 1, second = 6) {
  await addComparison(page, first);
  await addComparison(page, second);
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await expect(page.locator(".compare-dialog")).toBeVisible();
}

async function assertReadable(page, selectors) {
  const values = await page.evaluate((queries) => {
    function rgba(value) {
      const parts = value.match(/[\d.]+/g).map(Number);
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    }
    function blend(front, back) {
      return front
        .slice(0, 3)
        .map((value, index) => value * front[3] + back[index] * (1 - front[3]));
    }
    function luminance(color) {
      const parts = color.map((value) => {
        const c = value / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return parts[0] * 0.2126 + parts[1] * 0.7152 + parts[2] * 0.0722;
    }
    return queries.map((selector) => {
      const element = document.querySelector(selector);
      const ancestors = [];
      for (let node = element; node; node = node.parentElement)
        ancestors.unshift(node);
      let background = [255, 255, 255];
      for (const ancestor of ancestors)
        background = blend(
          rgba(getComputedStyle(ancestor).backgroundColor),
          background,
        );
      const color = blend(rgba(getComputedStyle(element).color), background);
      const first = luminance(color),
        second = luminance(background);
      return {
        selector,
        ratio:
          (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
      };
    });
  }, selectors);
  for (const value of values)
    expect(
      value.ratio,
      `${value.selector}: contraste do texto`,
    ).toBeGreaterThanOrEqual(4.5);
}

test("tema claro usa superfícies reais, preserva arte e persiste", async ({
  page,
}) => {
  const image = page.locator(".alien-card img").first();
  const originalSrc = await image.getAttribute("src");
  await page
    .getByRole("button", { name: "Ativar tema claro", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).filter),
  ).toBe("none");
  expect(
    await page
      .locator("html")
      .evaluate((element) => getComputedStyle(element).colorScheme),
  ).toBe("light");
  expect(await image.getAttribute("src")).toBe(originalSrc);
  expect(
    await image.evaluate((element) => getComputedStyle(element).filter),
  ).not.toMatch(/invert|hue-rotate/);
  await expect(page.locator(".alien-card").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await assertReadable(page, [
    ".hero-description",
    ".hero h1>span",
    ".filter-panel label",
    "#search",
    ".alien-card h3",
    ".card-stats dd",
    ".card-details",
    ".card-tags .tag:first-child",
    ".academic-notice",
  ]);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page
    .getByRole("button", { name: "Ativar tema escuro", exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".alien-card").first()).toHaveCSS(
    "background-color",
    "rgb(19, 26, 20)",
  );
});

test("dossiê, operadores e comparação mantêm contraste no tema claro", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Ativar tema claro", exact: true })
    .click();
  await page.locator(".card-details").first().click();
  await expect(page.locator(".alien-dialog")).toBeVisible();
  await assertReadable(page, [
    ".dialog-identity h2",
    ".dialog-facts dt",
    ".dialog-facts dd",
    ".dialog-section p",
    ".dialog-stat strong",
    ".dialog-notice",
  ]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await assertReadable(page, [
    ".operator-identity h3",
    ".operator-identity .muted",
    ".operator-count span",
    ".operator-list button>span",
  ]);
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await openComparison(page);
  await assertReadable(page, [
    ".compare-label",
    ".compare-value",
    ".compare-verdict",
    ".compare-note",
    ".fighter-total",
    ".fighter-total strong",
  ]);
});

test("empate três a três não é desfeito pela soma acadêmica", async ({
  page,
}) => {
  await openComparison(page, 1, 6);
  await expect(page.locator(".compare-verdict")).toContainText(
    "Empate por atributos: 3 a 3",
  );
  await expect(page.locator(".fighter-total").first()).toContainText("415");
  await expect(page.locator(".fighter-total").last()).toContainText("443");
  await expect(page.locator(".fighter-total").first()).toContainText(
    "soma acadêmica",
  );
  await expect(page.locator(".fighter-crown")).toHaveCount(0);
  await expect(page.locator(".compare-note")).toContainText(
    "sem simular um combate",
  );
});

test("comparação entre dois velocistas tem cores e traços distintos e valores textuais", async ({
  page,
}) => {
  await openComparison(page, 4, 37);
  const polygons = page.locator(".compare-dialog .radar-shape");
  await expect(polygons).toHaveCount(2);
  const colors = await polygons.evaluateAll((elements) =>
    elements.map((element) => getComputedStyle(element).stroke),
  );
  expect(colors[0]).not.toBe(colors[1]);
  expect(
    await polygons
      .last()
      .evaluate((element) => getComputedStyle(element).strokeDasharray),
  ).not.toBe("none");
  await expect(page.locator(".compare-legend")).toContainText(
    "A · XLR8 · linha contínua",
  );
  await expect(page.locator(".compare-legend")).toContainText(
    "B · Fasttrack · linha tracejada",
  );
  await expect(page.locator(".compare-row-result")).toHaveCount(6);
  for (const row of await page.locator(".compare-row").all()) {
    await expect(row.locator(".compare-value")).toHaveCount(2);
    await expect(row.locator(".compare-row-result")).toHaveText(
      /A maior|B maior|Empate|Dados ausentes/,
    );
  }
});

test("comparação mantém foco, ignora clique interno vazio e fecha no backdrop", async ({
  page,
}) => {
  await openComparison(page);
  const dialog = page.locator(".compare-dialog");
  await expect(
    page.getByRole("button", { name: "Fechar comparação" }),
  ).toBeFocused();
  await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        clientX: rect.left + 2,
        clientY: rect.top + 2,
      }),
    );
  });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement.closest(".compare-dialog"),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Comparar", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Comparar", exact: true }).click();
  await page.mouse.click(1, 1);
  await expect(dialog).toHaveCount(0);
});

for (const width of [375, 768, 1440]) {
  test(`tema claro e comparação sem overflow em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("button", { name: "Ativar tema claro", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await openComparison(page);
    expect(
      await page
        .locator(".compare-dialog")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
    ).toBe(true);
    await expect(page.locator(".compare-legend")).toBeVisible();
  });
}
