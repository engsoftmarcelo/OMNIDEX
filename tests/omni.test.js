import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  chaosEnabled,
  eraCounts,
  eras,
  evolutionDeltas,
  findEvolution,
  hasKnownPlanet,
  misfireChance,
  pickMisfire,
  planetGroups,
  statExtremes,
  statRanks,
  weatherFor,
} from "../src/utils/omni.js";

const aliens = createRequire(import.meta.url)("../src/data/catalog-index.json");
const byName = (name) => aliens.find((alien) => alien.originalName === name);

test("falhas do relógio ficam ligadas por padrão e a URL controla o modo", () => {
  assert.equal(chaosEnabled(), true);
  assert.equal(chaosEnabled({ automated: true }), true);
  assert.equal(chaosEnabled({ automated: true, search: "?chaos=1" }), true);
  assert.equal(chaosEnabled({ search: "?chaos=0" }), false);
});

test("transformação errada respeita a chance e nunca repete o alien pedido", () => {
  const pool = aliens.slice(0, 5);
  assert.equal(
    pickMisfire(pool[0], pool, () => misfireChance),
    null,
  );
  assert.equal(
    pickMisfire(pool[0], pool, () => 0.99),
    null,
  );
  assert.equal(
    pickMisfire(pool[0], [pool[0]], () => 0),
    null,
  );
  for (const roll of [0, 0.05, 0.1]) {
    const wrong = pickMisfire(pool[0], pool, () => roll);
    assert.ok(wrong && wrong.id !== pool[0].id);
  }
});

test("as quatro eras somam registros dos dados, em ordem de estreia", () => {
  const counts = eraCounts(aliens);
  assert.deepEqual(
    counts.map((era) => era.year),
    [2005, 2008, 2010, 2012],
  );
  for (const era of counts) {
    assert.equal(
      era.count,
      aliens.filter((alien) => alien.series.includes(era.id)).length,
    );
    assert.ok(era.count > 0);
  }
  assert.equal(eras.length, 4);
});

test("evolução liga a forma comum à suprema nos dois sentidos", () => {
  const base = byName("Swampfire");
  const ultimate = byName("Ultimate Swampfire");
  assert.deepEqual(findEvolution(base, aliens), { base, ultimate });
  assert.deepEqual(findEvolution(ultimate, aliens), { base, ultimate });
  assert.equal(findEvolution(byName("Heatblast"), aliens), null);
  const supremes = aliens.filter((alien) => alien.form === "Ultimate");
  for (const alien of supremes) assert.ok(findEvolution(alien, aliens));

  const deltas = evolutionDeltas(base, ultimate);
  assert.equal(deltas.length, 6);
  for (const item of deltas)
    assert.equal(item.delta, ultimate.stats[item.key] - base.stats[item.key]);
});

test("ranking e extremos saem dos atributos reais", () => {
  const alien = aliens[0];
  const ranks = statRanks(alien, aliens);
  for (const [key, rank] of Object.entries(ranks)) {
    const better = aliens.filter(
      (item) => item.stats[key] > alien.stats[key],
    ).length;
    assert.equal(rank, better + 1);
  }
  const { best, worst } = statExtremes(alien);
  const values = Object.values(alien.stats);
  assert.equal(best.value, Math.max(...values));
  assert.equal(worst.value, Math.min(...values));
  assert.equal(statExtremes({ stats: {} }), null);
});

test("mapa agrupa por planeta, ignora origem desconhecida e cabe na área", () => {
  const planets = planetGroups(aliens);
  const mapped = planets.reduce((sum, planet) => sum + planet.aliens.length, 0);
  assert.equal(mapped, aliens.filter(hasKnownPlanet).length);
  assert.ok(planets.every((planet) => hasKnownPlanet(planet.aliens[0])));
  assert.equal(
    new Set(planets.map((planet) => planet.name)).size,
    planets.length,
  );
  for (const planet of planets) {
    assert.ok(planet.x >= 0 && planet.x <= 100);
    assert.ok(planet.y >= 0 && planet.y <= 100);
  }
  // Nenhum par de planetas ocupa o mesmo ponto.
  for (let a = 0; a < planets.length; a += 1)
    for (let b = a + 1; b < planets.length; b += 1)
      assert.ok(
        Math.hypot(planets[a].x - planets[b].x, planets[a].y - planets[b].y) >
          3,
      );
  assert.equal(hasKnownPlanet({ planet: "Não informado" }), false);
  assert.equal(hasKnownPlanet({ planet: "None (hybrid)" }), false);
});

test("clima segue a categoria mais específica do alien", () => {
  assert.equal(
    weatherFor({ categories: ["Elemental", "Fogo"] }).type,
    "embers",
  );
  assert.equal(weatherFor({ categories: ["Gelo"] }).type, "snow");
  assert.equal(weatherFor({ categories: ["Força"] }).type, "motes");
  assert.equal(weatherFor(undefined).type, "motes");
});
