import { useRef } from "react";
import Icon from "./Icon.jsx";
import { statDefinitions } from "../utils/catalog.js";
import { accentFor, powerTotal, prefersReducedMotion } from "../utils/theme.js";
import { playSound } from "../utils/sound.js";

export default function AlienCard({
  alien,
  index,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onSelect,
  isActive,
  isComparing,
  onToggleCompare,
  locked = false,
}) {
  const cardRef = useRef(null);

  // Inclinação 3D e brilho que seguem o cursor. Usa variáveis CSS direto no
  // elemento para não re-renderizar o React a cada movimento do mouse.
  function handlePointerMove(event) {
    const card = cardRef.current;
    if (!card || event.pointerType === "touch" || prefersReducedMotion())
      return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    card.style.setProperty("--ry", `${((x - 0.5) * 9).toFixed(2)}deg`);
    card.style.setProperty("--rx", `${((0.5 - y) * 9).toFixed(2)}deg`);
  }
  function handlePointerLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
  }

  return (
    <article
      ref={cardRef}
      className={`alien-card ${isActive ? "is-active" : ""} ${isComparing ? "is-comparing" : ""} ${locked ? "is-locked" : ""}`}
      style={{ "--accent": accentFor(alien), "--i": index % 6 }}
      onPointerEnter={() => playSound("hover")}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className="card-artwork">
        <span className="card-id">
          DNA / {String(alien.id).padStart(3, "0")}
        </span>
        <button
          className={`icon-button favorite-button ${isFavorite ? "is-favorite" : ""}`}
          aria-label={`${isFavorite ? "Remover" : "Adicionar"} ${alien.name} ${isFavorite ? "dos" : "aos"} favoritos`}
          aria-pressed={isFavorite}
          onClick={() => onToggleFavorite(alien.id)}
        >
          <Icon name="star" />
        </button>
        <button
          className="artwork-select"
          onClick={() => onSelect(alien.id)}
          aria-label={`Selecionar ${alien.name} no Omnitrix`}
          aria-pressed={isActive}
        >
          <img
            src={alien.image}
            alt={locked ? "Silhueta de DNA não coletado" : alien.name}
            width="300"
            height="240"
            loading={index < 4 ? "eager" : "lazy"}
            decoding="async"
          />
        </button>
        <span className="card-power" title="Soma dos seis atributos">
          <Icon name="bolt" size={12} />
          {locked ? "???" : powerTotal(alien)}
          <small>PWR</small>
        </span>
        {(alien.aiEnhanced ||
          /non.canon|não canôn|concept|conceito/i.test(
            alien.canonStatus || "",
          )) && (
          <span className="concept-label">
            {alien.aiEnhanced ? "Conceito · arte com IA" : alien.canonStatus}
          </span>
        )}
      </div>
      <div className="card-body">
        <p className="card-series">{alien.series.join(" · ")}</p>
        <h3>{locked ? "DNA não coletado" : alien.name}</h3>
        <p className="original-name">
          {locked
            ? "Abra o dossiê para escanear"
            : alien.originalName !== alien.name
              ? alien.originalName
              : alien.species}
        </p>
        <div className="card-tags">
          {alien.categories.map((category) => (
            <span className="tag" key={category}>
              {category}
            </span>
          ))}
        </div>
        <dl className="card-stats">
          {statDefinitions.map((stat) => (
            <div
              key={stat.key}
              style={{
                "--v": `${locked ? 0 : (alien.stats?.[stat.key] ?? 0)}%`,
              }}
            >
              <dt title={stat.label}>{stat.shortLabel}</dt>
              <dd>{locked ? "??" : (alien.stats?.[stat.key] ?? "—")}</dd>
            </div>
          ))}
        </dl>
        <div className="card-footer">
          <button className="card-details" onClick={() => onOpenDetails(alien)}>
            {locked ? "Escanear DNA" : "Abrir dossiê"}{" "}
            <Icon name="arrow" size={17} />
          </button>
          <button
            className={`card-compare ${isComparing ? "is-on" : ""}`}
            type="button"
            aria-pressed={isComparing}
            aria-label={`${isComparing ? "Remover" : "Adicionar"} ${alien.name} ${isComparing ? "da" : "à"} comparação`}
            title="Comparar"
            onClick={() => onToggleCompare(alien.id)}
          >
            <Icon name="compare" size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}
