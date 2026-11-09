/**
 * Regras das mecânicas do relógio: captura de DNA, evolução, planetas,
 * eras, clima e falhas. Tudo aqui é função pura sobre os dados do catálogo,
 * para poder ser testado sem navegador.
 */
import { statDefinitions } from "./catalog.js";
import { categoryColors, defaultAccent } from "./theme.js";

export const scannedKey = "omnidex:scanned:v1";
export const captureKey = "omnidex:capture:v1";

/** Segundos de energia de uma transformação e de recarga depois dela. */
export const energySeconds = 45;
export const lowEnergySeconds = 10;
export const rechargeSeconds = 8;
/** Uma em cada oito ativações entrega o alien errado. */
export const misfireChance = 1 / 8;

/**
 * As falhas do relógio ficam ligadas por padrão, conforme a preferência do
 * projeto. A URL explicita o modo, inclusive nos testes: ?chaos=0 desliga;
 * ?chaos=1 liga. O comportamento não depende de detecção de automação.
 */
export function chaosEnabled({ search = "" } = {}) {
  const param = new URLSearchParams(search).get("chaos");
  if (param === "1") return true;
  if (param === "0") return false;
  return true;
}

/** Sorteia a transformação errada, ou devolve null quando o relógio acerta. */
export function pickMisfire(alien, pool, random = Math.random) {
  const others = (pool || []).filter((item) => item.id !== alien?.id);
  if (!alien || !others.length || random() >= misfireChance) return null;
  return others[Math.floor(random() * others.length)];
}

// ── Eras ────────────────────────────────────────────────────────────────

/** As quatro séries do arquivo, em ordem de estreia. */
export const eras = [
  { id: "Original Series", label: "Clássico", year: 2005, color: "#a7f542" },
  {
    id: "Alien Force",
    label: "Força Alienígena",
    year: 2008,
    color: "#4ade80",
  },
  {
    id: "Ultimate Alien",
    label: "Supremacia Alienígena",
    year: 2010,
    color: "#2dd4bf",
  },
  { id: "Omniverse", label: "Omniverse", year: 2012, color: "#d4f542" },
];

export function eraCounts(aliens) {
  return eras.map((era) => ({
    ...era,
    count: aliens.filter((alien) => alien.series?.includes(era.id)).length,
  }));
}

// ── Evolução ────────────────────────────────────────────────────────────

const ultimatePrefix = /^ultimate\s+/i;

/** Liga a forma comum à forma suprema pelo nome original. */
export function findEvolution(alien, aliens) {
  if (!alien?.originalName) return null;
  const name = alien.originalName.trim();
  const byName = (wanted) =>
    aliens.find(
      (item) =>
        item.originalName?.trim().toLowerCase() === wanted.toLowerCase(),
    );
  if (ultimatePrefix.test(name)) {
    const base = byName(name.replace(ultimatePrefix, ""));
    return base ? { base, ultimate: alien } : null;
  }
  const ultimate = byName(`Ultimate ${name}`);
  return ultimate ? { base: alien, ultimate } : null;
}

/** Diferença de cada atributo entre a forma comum e a suprema. */
export function evolutionDeltas(base, ultimate) {
  return statDefinitions.map(({ key, label, shortLabel }) => {
    const from = base.stats?.[key];
    const to = ultimate.stats?.[key];
    const known = Number.isFinite(from) && Number.isFinite(to);
    return {
      key,
      label,
      shortLabel,
      from,
      to,
      delta: known ? to - from : null,
    };
  });
}

// ── Ranking ─────────────────────────────────────────────────────────────

/** Posição do alien em cada atributo (1 = maior valor; empates dividem). */
export function statRanks(alien, aliens) {
  const ranks = {};
  for (const { key } of statDefinitions) {
    const value = alien.stats?.[key];
    ranks[key] = Number.isFinite(value)
      ? 1 + aliens.filter((item) => (item.stats?.[key] ?? -1) > value).length
      : null;
  }
  return ranks;
}

/** Atributos mais alto e mais baixo, para o resumo do dossiê. */
export function statExtremes(alien) {
  const known = statDefinitions
    .map((stat) => ({ ...stat, value: alien.stats?.[stat.key] }))
    .filter((stat) => Number.isFinite(stat.value));
  if (!known.length) return null;
  const sorted = [...known].sort((a, b) => b.value - a.value);
  return { best: sorted[0], worst: sorted.at(-1) };
}

// ── Planetas ────────────────────────────────────────────────────────────

const unknownPlanets = new Set(["", "não informado", "none (hybrid)"]);

export function hasKnownPlanet(alien) {
  return !unknownPlanets.has(
    String(alien?.planet ?? "")
      .trim()
      .toLowerCase(),
  );
}

const goldenAngle = Math.PI * (3 - Math.sqrt(5));

/**
 * Agrupa os aliens por planeta e distribui os planetas em espiral (a mesma
 * disposição das sementes de um girassol), o que evita sobreposição e dá ao
 * mapa a forma de uma galáxia. As posições são porcentagens de 0 a 100.
 */
export function planetGroups(aliens) {
  const groups = new Map();
  for (const alien of aliens) {
    if (!hasKnownPlanet(alien)) continue;
    const name = alien.planet.trim();
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(alien);
  }
  const names = [...groups.keys()].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return names.map((name, index) => {
    const members = groups.get(name);
    const radius = 46 * Math.sqrt((index + 0.6) / names.length);
    const angle = index * goldenAngle;
    return {
      name,
      aliens: members,
      x: 50 + radius * Math.cos(angle),
      y: 50 + radius * Math.sin(angle),
      color: categoryColors[members[0].categories?.[0]] || defaultAccent,
    };
  });
}

// ── Clima ───────────────────────────────────────────────────────────────

/** Da categoria mais específica para a mais genérica. */
const weatherByCategory = [
  ["Fogo", "embers"],
  ["Gelo", "snow"],
  ["Eletricidade", "sparks"],
  ["Água", "bubbles"],
  ["Química", "bubbles"],
  ["Vegetação", "leaves"],
  ["Velocidade", "streaks"],
  ["Voo", "streaks"],
  ["Cósmico", "stardust"],
  ["Energia", "stardust"],
  ["Mental", "orbs"],
  ["Som", "orbs"],
];

export function weatherFor(alien) {
  const categories = alien?.categories || [];
  const match = weatherByCategory.find(([category]) =>
    categories.includes(category),
  );
  if (!match) return { type: "motes", color: defaultAccent };
  return { type: match[1], color: categoryColors[match[0]] || defaultAccent };
}
