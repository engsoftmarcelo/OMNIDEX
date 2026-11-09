import Icon from "./Icon.jsx";
import { accentFor } from "../utils/theme.js";

export default function OmnitrixSelector({
  alien,
  previous,
  next,
  position,
  total,
  turns,
  charging,
  onNavigate,
  onActivate,
}) {
  function handleKeys(event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onNavigate(event.key === "ArrowLeft" ? -1 : 1);
    }
  }
  return (
    <section
      className={`selector ${charging ? "is-charging" : ""}`}
      aria-label="Seletor do Omnitrix"
      onKeyDown={handleKeys}
      style={{
        "--accent": alien ? accentFor(alien) : undefined,
        "--dial": `${(turns || 0) * 30}deg`,
      }}
    >
      <div className="selector-top">
        <span>
          <span className="status-dot" /> OMNITRIX CONECTADO
        </span>
        <span>MK. 01</span>
      </div>
      <div className="selector-stage">
        <div className="orbit orbit-outer" aria-hidden="true" />
        <div className="orbit orbit-inner" aria-hidden="true" />
        <div className="dial-ring" aria-hidden="true" />
        <div className="dial-core" aria-hidden="true" />
        {previous && previous.id !== alien?.id && (
          <span
            key={`p${previous.id}`}
            className="stage-ghost ghost-left"
            aria-hidden="true"
            style={{ backgroundImage: `url("${previous.image}")` }}
          />
        )}
        {next && next.id !== alien?.id && next.id !== previous?.id && (
          <span
            key={`n${next.id}`}
            className="stage-ghost ghost-right"
            aria-hidden="true"
            style={{ backgroundImage: `url("${next.image}")` }}
          />
        )}
        <span className="stage-coordinate coordinate-left" aria-hidden="true">
          DNA
          <br />
          {alien ? String(alien.id).padStart(3, "0") : "—"}
        </span>
        <span className="stage-coordinate coordinate-right" aria-hidden="true">
          100%
          <br />
          SYNC
        </span>
        {alien ? (
          <img
            key={alien.id}
            src={alien.image}
            alt={`Transformação selecionada: ${alien.name}`}
            width="260"
            height="260"
            decoding="async"
          />
        ) : (
          <Icon name="search" size={72} />
        )}
      </div>
      <div className="selector-navigation">
        <button
          className="icon-button"
          aria-label="Transformação anterior"
          disabled={!alien || charging}
          onClick={() => onNavigate(-1)}
        >
          <Icon name="chevronLeft" />
        </button>
        <div className="selector-name" aria-live="polite">
          <span>
            {alien
              ? `${String(position + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
              : "SEM SINAL"}
          </span>
          <h2 key={alien?.id ?? "none"}>
            {alien?.name || "Nenhuma transformação"}
          </h2>
        </div>
        <button
          className="icon-button"
          aria-label="Próxima transformação"
          disabled={!alien || charging}
          onClick={() => onNavigate(1)}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
      <button
        className="button button-primary activate-button"
        disabled={!alien || charging}
        onClick={() => onActivate(alien)}
      >
        <Icon name="bolt" size={18} /> Ativar transformação{" "}
        <Icon name="arrow" size={18} />
      </button>
      <p className="selector-hint">
        Use as setas ← → ou os controles para navegar
      </p>
    </section>
  );
}
