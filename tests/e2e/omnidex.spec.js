import fs from "node:fs";
import { test as base, expect } from "@playwright/test";

const records = JSON.parse(
  fs.readFileSync(
    new URL("../../src/data/pokedex-data.json", import.meta.url),
    "utf8",
  ),
);
const favoriteKey = "omnidex:favorites:v1";
const selectionKey = "omnidex:selection:v1";

const test = base.extend({
  runtimeErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on("pageerror", (error) =>
        errors.push(`pageerror: ${error.message}`),
      );
      page.on("console", (message) => {
        if (message.type() === "error")
          errors.push(`console: ${message.text()}`);
      });
      page.on("response", (response) => {
        if (
          response.url().startsWith("http://127.0.0.1:5173/") &&
          response.status() >= 400
        )
          errors.push(`HTTP ${response.status()}: ${response.url()}`);
      });
      page.on("requestfailed", (request) => {
        const reason = request.failure()?.errorText;
        if (
          request.url().startsWith("http://127.0.0.1:5173/") &&
          reason !== "net::ERR_ABORTED"
        )
          errors.push(`${reason}: ${request.url()}`);
      });
      await use(errors);
      expect(
        errors,
        "Sem erros de execução, console ou recursos locais",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

test.beforeEach(async ({ page }) => {
  await page.goto("/?chaos=0");
  await expect(page.locator(".alien-card")).toHaveCount(72);
});

test("catálogo completo e pesquisa por ID, nome, alias e acentos", async ({
  page,
}) => {
  for (const [query, expectedName] of [
    ["001", "Chama"],
    ["HEATBLAST", "Chama"],
    ["bÉsta", "Besta"],
    ["lobisben", "Blitzwolfer"],
  ]) {
    await page.getByLabel("Buscar transformação").fill(query);
    await expect(page.locator(".alien-card")).toHaveCount(1);
    await expect(page.locator(".alien-card h3")).toHaveText(expectedName);
  }
});

test("pesquisa e filtros combinados, vazio e recuperação", async ({ page }) => {
  await page.getByLabel("Buscar transformação").fill("Heatblast");
  await page.getByLabel("Categoria de habilidade").selectOption("Fogo");
  await page.getByLabel("Universo / série").selectOption("Original Series");
  await expect(page.locator(".alien-card")).toHaveCount(1);
  await expect(page.locator(".alien-card h3")).toHaveText("Chama");
  await page.getByLabel("Categoria de habilidade").selectOption("Som");
  await expect(
    page.getByRole("heading", { name: "Nenhum DNA por aqui." }),
  ).toBeVisible();
  await expect(page.locator(".alien-card")).toHaveCount(0);
  await page
    .locator(".empty-state")
    .getByRole("button", { name: "Limpar filtros" })
    .click();
  await expect(page.locator(".alien-card")).toHaveCount(72);
  await expect(page.getByLabel("Buscar transformação")).toHaveValue("");
  await expect(page.getByLabel("Categoria de habilidade")).toHaveValue("all");
  await expect(page.getByLabel("Universo / série")).toHaveValue("all");
});

test("ordenação por ID, nome e os seis atributos", async ({ page }) => {
  const cases = [
    "name",
    "hp",
    "attack",
    "defense",
    "specialAttack",
    "specialDefense",
    "speed",
    "id",
  ];
  for (const key of cases) {
    const expected = [...records].sort(
      key === "id"
        ? (a, b) => a.id - b.id
        : key === "name"
          ? (a, b) =>
              a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }) ||
              a.id - b.id
          : (a, b) => b.stats[key] - a.stats[key] || a.id - b.id,
    );
    await page.getByLabel("Ordenar por").selectOption(key);
    await expect(page.locator(".alien-card .card-id")).toHaveText(
      expected.map((alien) => `DNA / ${String(alien.id).padStart(3, "0")}`),
    );
  }
});

test("seletor anterior/próximo, teclado, card e dossiê compartilham seleção", async ({
  page,
}) => {
  const selector = page.getByRole("region", { name: "Seletor do Omnitrix" });
  await page
    .getByRole("button", { name: "Próxima transformação", exact: true })
    .click();
  await expect(
    selector.getByRole("heading", { name: "Besta", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(
    selector.getByRole("heading", { name: records[2].name, exact: true }),
  ).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(
    selector.getByRole("heading", { name: "Besta", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Transformação anterior", exact: true })
    .click();
  await expect(
    selector.getByRole("heading", { name: "Chama", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Selecionar Besta no Omnitrix", exact: true })
    .click();
  await expect(
    selector.getByRole("heading", { name: "Besta", exact: true }),
  ).toBeVisible();
  const activate = page.getByRole("button", {
    name: "Ativar transformação",
    exact: true,
  });
  await activate.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Besta", exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Fechar dossiê" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  expect(
    await page.evaluate(() => !!document.activeElement.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => !!document.activeElement.closest("dialog")),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(activate).toBeFocused();
});

test("galerias são carregadas ao abrir o dossiê, com fontes e atributos", async ({
  page,
}) => {
  const galleryRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("/data/galleries/"))
      galleryRequests.push(request.url());
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  expect(galleryRequests).toEqual([]);
  await page
    .locator(".alien-card")
    .first()
    .getByRole("button", { name: "Abrir dossiê" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".dialog-gallery img")).toHaveCount(
    records[0].gallery.length,
  );
  expect(galleryRequests.some((url) => url.endsWith("/1.json"))).toBe(true);
  await expect(page.locator(".dialog-stat")).toHaveCount(6);
  await expect(page.locator(".dialog-stat").first()).toContainText("HP");
  await expect(page.locator(".dialog-content")).toContainText(
    "Atributos adaptados para fins acadêmicos; baseados em avaliações de fãs",
  );
  await expect(
    page.locator(".dialog-gallery figcaption a").first(),
  ).toHaveAttribute("href", records[0].gallery[0].sourceUrl);
  await page.getByRole("button", { name: "Fechar dossiê" }).click();
});

test("conceitos não canônicos e arte aprimorada por IA são identificados", async ({
  page,
}) => {
  await page.getByLabel("Buscar transformação").fill("070");
  await expect(page.locator(".concept-label")).toContainText("IA");
  await page.locator(".card-details").click();
  await expect(page.locator(".dialog-identity")).toContainText(
    "Conceito não canônico",
  );
  await expect(page.locator(".dialog-identity")).toContainText(
    "Imagem aprimorada por IA",
  );
});

test("favoritos persistem após recarregar e filtro se recupera ao remover", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Adicionar Chama aos favoritos", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), favoriteKey))
    .toBe("[1]");
  await page.reload();
  await page.getByRole("button", { name: /^Favoritos/ }).click();
  await expect(page.locator(".alien-card")).toHaveCount(1);
  await expect(page.locator(".alien-card h3")).toHaveText("Chama");
  await page
    .getByRole("button", { name: "Remover Chama dos favoritos", exact: true })
    .click();
  await expect(page.locator(".empty-state")).toBeVisible();
  await page
    .locator(".empty-state")
    .getByRole("button", { name: "Limpar filtros" })
    .click();
  await expect(page.locator(".alien-card")).toHaveCount(72);
});

test("foco retorna à pesquisa se a remoção do favorito desmonta o card abridor", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Adicionar Chama aos favoritos", exact: true })
    .click();
  await page.getByRole("button", { name: /^Favoritos/ }).click();
  await page.locator(".card-details").click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Favoritado", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Buscar transformação")).toBeFocused();
});

test("seleção aceita dez, impede a décima primeira e persiste com remoção", async ({
  page,
}) => {
  test.setTimeout(75_000);
  for (let id = 1; id <= 10; id += 1) {
    await page
      .getByLabel("Buscar transformação")
      .fill(String(id).padStart(3, "0"));
    await page.locator(".card-details").click();
    await page
      .getByRole("button", { name: "Adicionar à seleção", exact: true })
      .click();
    await page.getByRole("button", { name: "Fechar dossiê" }).click();
  }
  await page.getByLabel("Buscar transformação").fill("011");
  await page.locator(".card-details").click();
  await expect(
    page.getByRole("button", { name: "Seleção cheia (10/10)", exact: true }),
  ).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)).length,
        selectionKey,
      ),
    )
    .toBe(10);
  await page.reload();
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await expect(page.locator(".selection-item")).toHaveCount(10);
  await page
    .getByRole("button", { name: "Remover Chama da seleção", exact: true })
    .click();
  await expect(page.locator(".selection-item")).toHaveCount(9);
  await page.reload();
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await expect(page.locator(".selection-item")).toHaveCount(9);
});

test("operadores demonstrativos têm relações válidas e exemplos editáveis", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await expect(page.locator(".operators-section")).toContainText(
    "não representam personagens ou relações oficiais",
  );
  await expect(page.locator(".operator-card")).toHaveCount(3);
  for (const card of await page.locator(".operator-card").all()) {
    const items = card.locator(".operator-list li");
    const count = await items.count();
    await expect(card.locator(".operator-count strong")).toHaveText(
      String(count),
    );
    for (const text of await items.allTextContents()) {
      const id = Number(text.match(/#(\d+)/)?.[1]);
      expect(records.some((record) => record.id === id)).toBe(true);
    }
  }
  await page
    .getByRole("button", { name: "Explorar catálogo", exact: true })
    .click();
  await expect(page.locator(".alien-card")).toHaveCount(72);
  await page.getByRole("button", { name: "Operadores", exact: true }).click();
  await page
    .getByRole("button", { name: "Usar esta seleção", exact: true })
    .first()
    .click();
  await expect(page.locator(".selection-item")).toHaveCount(5);
  await page
    .locator(".operator-card")
    .first()
    .locator(".operator-list button")
    .first()
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Chama", exact: true }),
  ).toBeVisible();
});

test("transformação aleatória respeita filtro e trata lista vazia", async ({
  page,
}) => {
  await page.getByLabel("Buscar transformação").fill("001");
  await page
    .getByRole("button", { name: "Transformação aleatória", exact: true })
    .click();
  await expect(page.locator(".selector-name h2")).toHaveText("Chama");
  await expect(page.locator(".feedback-message")).toContainText("Chama");
  await page.getByLabel("Buscar transformação").fill("sem-transformacao-xyz");
  await page
    .getByRole("button", { name: "Transformação aleatória", exact: true })
    .click();
  await expect(page.locator(".feedback-message")).toContainText(
    "Nenhuma transformação disponível",
  );
  await expect(
    page.getByRole("button", { name: "Ativar transformação", exact: true }),
  ).toBeDisabled();
});

for (const width of [375, 768, 1440]) {
  test(`layout sem rolagem horizontal e controles visíveis em ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const search = page.getByLabel("Buscar transformação");
    await search.scrollIntoViewIfNeeded();
    await expect(search).toBeVisible();
    expect((await search.boundingBox()).height).toBeGreaterThanOrEqual(44);
    const image = page.locator(".alien-card img").first();
    await image.scrollIntoViewIfNeeded();
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (element) => element.complete && element.naturalWidth > 0,
        ),
      )
      .toBe(true);
    await page.locator(".card-details").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page
        .locator(".alien-dialog")
        .evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1),
    ).toBe(true);
    await page.getByRole("button", { name: "Fechar dossiê" }).click();
    await page.getByRole("button", { name: "Operadores", exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("movimento reduzido e navegação por Tab mantêm foco visível", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  expect(
    await page.evaluate(() => {
      const focused = getComputedStyle(document.activeElement);
      return (
        focused.outlineStyle !== "none" && parseFloat(focused.outlineWidth) >= 2
      );
    }),
  ).toBe(true);
  expect(
    await page
      .locator(".selector-stage img")
      .evaluate((image) => getComputedStyle(image).animationName),
  ).toBe("none");
  expect(
    await page
      .locator(".activate-button")
      .evaluate((button) => getComputedStyle(button).transitionDuration),
  ).toBe("0s");
});

test("todas as capas e galerias referenciadas são decodificadas pelo navegador", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const urls = [
    ...new Set(
      records.flatMap((record) => [
        record.image,
        ...record.gallery.map((item) => item.src),
      ]),
    ),
  ];
  const failures = await page.evaluate(async (paths) => {
    let cursor = 0;
    const errors = [];
    async function worker() {
      while (cursor < paths.length) {
        const src = paths[cursor++];
        try {
          const image = new Image();
          image.src = src;
          await image.decode();
          if (!image.naturalWidth || !image.naturalHeight)
            throw new Error("Dimensões vazias");
        } catch {
          errors.push(src);
        }
      }
    }
    await Promise.all(Array.from({ length: 6 }, worker));
    return errors;
  }, urls);
  expect(urls.length).toBeGreaterThanOrEqual(630);
  expect(failures).toEqual([]);
});
