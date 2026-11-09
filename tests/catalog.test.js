import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptStats,
  filterAliens,
  getFilterOptions,
  normalizeText,
  sanitizeIds,
  sortAliens,
  statDefinitions,
  toggleSelection,
} from "../src/utils/catalog.js";

const aliens = [
  {
    id: 1,
    name: "Chama",
    originalName: "Heatblast",
    aliases: ["Pirocinético"],
    categories: ["Energia", "Fogo"],
    series: ["Classic"],
    stats: { attack: 65, speed: 60 },
  },
  {
    id: 2,
    name: "Diamante",
    originalName: "Diamondhead",
    aliases: ["Petrosapien"],
    categories: ["Resistência"],
    series: ["Classic", "Alien Force"],
    stats: { attack: 85, speed: 40 },
  },
  {
    id: 11,
    name: "Água",
    originalName: "Water Hazard",
    aliases: ["Aquático"],
    categories: ["Água"],
    series: ["Ultimate Alien"],
    stats: { attack: 65, speed: 60 },
  },
];
const ids = (records) => records.map(({ id }) => id);

test("pesquisa ignora caixa, espaços externos e acentos", () => {
  assert.equal(normalizeText("  PIROCINÉTICO "), "pirocinetico");
  assert.deepEqual(ids(filterAliens(aliens, { query: " AGUA " })), [11]);
  assert.deepEqual(ids(filterAliens(aliens, { query: "HEATBLAST" })), [1]);
});

test("pesquisa encontra aliases e IDs com zeros à esquerda", () => {
  assert.deepEqual(ids(filterAliens(aliens, { query: "pirocinetico" })), [1]);
  assert.deepEqual(ids(filterAliens(aliens, { query: "001" })), [1]);
  assert.deepEqual(ids(filterAliens(aliens, { query: "#002" })), [2]);
  assert.deepEqual(ids(filterAliens(aliens, { query: "1" })), [1]);
  assert.deepEqual(ids(filterAliens(aliens, { query: "000" })), []);
});

test("pesquisa, categoria, série e favoritos são combinados por interseção", () => {
  assert.deepEqual(
    ids(
      filterAliens(aliens, {
        query: "a",
        category: "Resistência",
        series: "Classic",
        favoritesOnly: true,
        favorites: [2, 11],
      }),
    ),
    [2],
  );
  assert.deepEqual(
    ids(filterAliens(aliens, { query: "Chama", category: "Água" })),
    [],
  );
  assert.deepEqual(
    ids(filterAliens(aliens, { favoritesOnly: true, favorites: [] })),
    [],
  );
});

test("filtros limpos recuperam toda listagem e opções vêm dos dados", () => {
  assert.deepEqual(filterAliens(aliens), aliens);
  assert.deepEqual(getFilterOptions(aliens), {
    categories: ["Água", "Energia", "Fogo", "Resistência"],
    series: ["Alien Force", "Classic", "Ultimate Alien"],
  });
  assert.deepEqual(getFilterOptions([]), { categories: [], series: [] });
});

test("ordenação não altera entrada, usa nomes em português e atributos decrescentes", () => {
  const reordered = [aliens[2], aliens[1], aliens[0]];
  assert.deepEqual(ids(sortAliens(reordered, "id")), [1, 2, 11]);
  assert.deepEqual(ids(sortAliens(reordered, "name")), [11, 1, 2]);
  assert.deepEqual(ids(sortAliens(reordered, "attack")), [2, 1, 11]);
  assert.deepEqual(ids(reordered), [11, 2, 1]);
  assert.deepEqual(
    ids(
      sortAliens(
        [
          { id: 5, stats: { speed: null } },
          { id: 2, stats: { speed: 0 } },
        ],
        "speed",
      ),
    ),
    [2, 5],
  );
});

test("as seis fórmulas produzem médias arredondadas na escala 0..100", () => {
  const sourceStats = {
    strength: 65,
    durability: 76,
    power: 85,
    intelligence: 45,
    speed: 60,
  };
  assert.deepEqual(adaptStats(sourceStats), {
    hp: 71,
    attack: 65,
    defense: 76,
    specialAttack: 85,
    specialDefense: 61,
    speed: 60,
  });
  assert.equal(sourceStats.durability, 76);
  assert.equal(statDefinitions.length, 6);
  assert.deepEqual(
    statDefinitions.map(({ key }) => key),
    Object.keys(adaptStats(sourceStats)),
  );
});

test("atributos ausentes não são inventados; campos independentes continuam disponíveis", () => {
  assert.deepEqual(adaptStats({ strength: 70, durability: 80 }), {
    hp: 75,
    attack: 70,
    defense: 80,
    specialAttack: null,
    specialDefense: null,
    speed: null,
  });
  assert.ok(Object.values(adaptStats(null)).every((value) => value === null));
  assert.equal(adaptStats({ power: NaN, speed: "90" }).specialAttack, null);
  assert.equal(adaptStats({ power: Infinity }).specialAttack, null);
  assert.equal(adaptStats({ power: 110, speed: -5 }).specialAttack, 100);
  assert.equal(adaptStats({ power: 110, speed: -5 }).speed, 0);
});

test("seleção permite remover, adicionar e respeita limite de dez sem mutar estado", () => {
  const full = Array.from({ length: 10 }, (_, index) => index + 1);
  assert.deepEqual(toggleSelection(full, 11), full);
  assert.deepEqual(toggleSelection(full, 3), [1, 2, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(toggleSelection([1, 2], 3), [1, 2, 3]);
  assert.deepEqual(toggleSelection([1, 2], 2), [1]);
  assert.equal(full.length, 10);
  assert.deepEqual(toggleSelection([1], -1), [1]);
});

test("dados persistidos descartam relações desconhecidas, strings e duplicatas", () => {
  assert.deepEqual(
    sanitizeIds([1, 1, 72, "2", 999, null, 2], new Set([1, 2, 72]), 2),
    [1, 72],
  );
  assert.deepEqual(sanitizeIds("inválido", [1, 2]), []);
  assert.deepEqual(sanitizeIds([1, 2], [1, 2], 0), []);
});
