/** Cada categoria de habilidade tem uma cor de energia própria. */
export const categoryColors = {
  Elemental: "#f5b942",
  Fogo: "#ff6b3d",
  Furtividade: "#a78bfa",
  Resistência: "#d6a05c",
  Velocidade: "#4cc9ff",
  Tecnologia: "#5eead4",
  Força: "#ff5d73",
  Suporte: "#f9a8d4",
  Voo: "#93c5fd",
  Água: "#38bdf8",
  Mental: "#e879f9",
  Vegetação: "#86efac",
  Som: "#fde047",
  Metamorfose: "#c4b5fd",
  Eletricidade: "#facc15",
  Energia: "#a7f542",
  Cósmico: "#818cf8",
  Gelo: "#a5f3fc",
  Química: "#bef264",
};

export const defaultAccent = "#a7f542";

export function accentFor(alien) {
  return categoryColors[alien?.categories?.[0]] || defaultAccent;
}

/** Soma dos seis atributos adaptados (dado derivado, não armazenado). */
export function powerTotal(alien) {
  return Object.values(alien?.stats ?? {}).reduce(
    (total, value) => total + (Number.isFinite(value) ? value : 0),
    0,
  );
}

export function prefersReducedMotion() {
  return Boolean(
    globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  );
}
