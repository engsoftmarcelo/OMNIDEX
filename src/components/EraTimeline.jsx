import { eraCounts } from "../utils/omni.js";

/**
 * Linha do tempo das séries: cada era é um ponto da linha. Escolher uma era
 * filtra o catálogo pela série (o mesmo estado do seletor "Universo / série")
 * e muda a cor de destaque da interface.
 */
export default function EraTimeline({ aliens, series, onChange }) {
  const items = eraCounts(aliens);
  return (
    <nav className="era-timeline" aria-label="Linha do tempo das séries">
      <button
        type="button"
        className={`era-node era-all ${series === "all" ? "is-active" : ""}`}
        aria-pressed={series === "all"}
        onClick={() => onChange("all")}
      >
        <span className="era-dot" aria-hidden="true" />
        <span className="era-year">TODAS</span>
        <span className="era-label">Linha completa</span>
        <span className="era-count">{aliens.length} registros</span>
      </button>
      {items.map((era) => (
        <button
          key={era.id}
          type="button"
          className={`era-node ${series === era.id ? "is-active" : ""}`}
          style={{ "--era": era.color }}
          aria-pressed={series === era.id}
          onClick={() => onChange(series === era.id ? "all" : era.id)}
        >
          <span className="era-dot" aria-hidden="true" />
          <span className="era-year">{era.year}</span>
          <span className="era-label">{era.label}</span>
          <span className="era-count">{era.count} registros</span>
        </button>
      ))}
    </nav>
  );
}
