/** A nomenclatura da atividade é preservada; as pontuações são uma adaptação. */
export const statDefinitions = [
  { key: "hp", label: "HP", shortLabel: "HP" },
  { key: "attack", label: "Ataque", shortLabel: "ATQ" },
  { key: "defense", label: "Defesa", shortLabel: "DEF" },
  { key: "specialAttack", label: "Ataque especial", shortLabel: "ATQ ESP" },
  { key: "specialDefense", label: "Defesa especial", shortLabel: "DEF ESP" },
  { key: "speed", label: "Velocidade", shortLabel: "VEL" },
];

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/**
 * A fonte conferida usa 0..100. Um campo ausente permanece null, para que a
 * interface informe a pendência em vez de produzir uma avaliação fictícia.
 * sourceStats não é modificado: os valores originais continuam rastreáveis.
 */
export function adaptStats(sourceStats = {}) {
  const source = sourceStats ?? {};
  const valid = (value) => typeof value === "number" && Number.isFinite(value);
  const score = (value) =>
    valid(value) ? Math.round(Math.min(100, Math.max(0, value))) : null;
  const mean = (first, second) =>
    valid(first) && valid(second) ? score((first + second) / 2) : null;

  return {
    hp: mean(source.durability, source.strength),
    attack: score(source.strength),
    defense: score(source.durability),
    specialAttack: score(source.power),
    specialDefense: mean(source.durability, source.intelligence),
    speed: score(source.speed),
  };
}

export function filterAliens(
  aliens,
  {
    query = "",
    category = "all",
    series = "all",
    favoritesOnly = false,
    favorites = [],
  } = {},
) {
  const search = normalizeText(query);
  const numericId = /^#?\d+$/.test(search)
    ? Number(search.replace(/^#/, ""))
    : null;
  const favoriteIds = new Set(favorites);

  return aliens.filter((alien) => {
    const names = [alien.name, alien.originalName, ...(alien.aliases ?? [])];
    const matchesSearch =
      !search ||
      alien.id === numericId ||
      names.some((name) => normalizeText(name).includes(search));
    const matchesCategory =
      !category || category === "all" || alien.categories?.includes(category);
    const matchesSeries =
      !series || series === "all" || alien.series?.includes(series);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSeries &&
      (!favoritesOnly || favoriteIds.has(alien.id))
    );
  });
}

export function sortAliens(aliens, sort = "id") {
  const result = [...aliens];
  if (sort === "name") {
    return result.sort(
      (first, second) =>
        first.name.localeCompare(second.name, "pt-BR", {
          sensitivity: "base",
        }) || first.id - second.id,
    );
  }
  if (statDefinitions.some(({ key }) => key === sort)) {
    return result.sort((first, second) => {
      // Valores ausentes ficam depois dos valores verificados, inclusive zero.
      const firstScore = first.stats?.[sort];
      const secondScore = second.stats?.[sort];
      const firstValue =
        typeof firstScore === "number" && Number.isFinite(firstScore)
          ? firstScore
          : -Infinity;
      const secondValue =
        typeof secondScore === "number" && Number.isFinite(secondScore)
          ? secondScore
          : -Infinity;
      return secondValue - firstValue || first.id - second.id;
    });
  }
  return result.sort((first, second) => first.id - second.id);
}

export function getFilterOptions(aliens) {
  const optionsFor = (key) =>
    [...new Set(aliens.flatMap((alien) => alien[key] ?? []))]
      .filter((value) => typeof value === "string" && value.trim())
      .sort((first, second) => first.localeCompare(second, "pt-BR"));
  return { categories: optionsFor("categories"), series: optionsFor("series") };
}

/** Limpa dados persistidos sem aceitar IDs desconhecidos, duplicados ou strings. */
export function sanitizeIds(value, validIds, max = Infinity) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(validIds);
  const limit =
    max === Infinity ? Infinity : Math.max(0, Math.floor(Number(max) || 0));
  return [
    ...new Set(value.filter((id) => Number.isInteger(id) && allowed.has(id))),
  ].slice(0, limit);
}

/** Retorna uma nova seleção; o limite é calculado a partir da própria lista. */
export function toggleSelection(ids, id, max = 10) {
  const limit =
    max === Infinity ? Infinity : Math.max(0, Math.floor(Number(max) || 0));
  const current = [
    ...new Set(
      (Array.isArray(ids) ? ids : []).filter(
        (value) => Number.isInteger(value) && value > 0,
      ),
    ),
  ].slice(0, limit);
  if (!Number.isInteger(id) || id < 1) return current;
  if (current.includes(id)) return current.filter((value) => value !== id);
  return current.length < limit ? [...current, id] : current;
}
