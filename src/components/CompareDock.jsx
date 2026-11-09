import Icon from "./Icon.jsx";

/** Barra flutuante com os (até) dois registros escolhidos para comparar. */
export default function CompareDock({ aliens, onRemove, onClear, onCompare }) {
  if (!aliens.length) return null;
  const slots = [aliens[0], aliens[1]];

  return (
    <aside className="compare-dock" aria-label="Comparação de transformações">
      <span className="compare-dock-title">
        <Icon name="compare" size={16} /> ARENA
      </span>
      {slots.map((alien, index) =>
        alien ? (
          <button
            className="compare-slot is-filled"
            type="button"
            key={alien.id}
            onClick={() => onRemove(alien.id)}
            aria-label={`Remover ${alien.name} da comparação`}
          >
            <img src={alien.image} alt="" width="34" height="34" />
            <span>{alien.name}</span>
            <Icon name="close" size={13} />
          </button>
        ) : (
          <span className="compare-slot" key={`empty-${index}`}>
            Escolha outro DNA
          </span>
        ),
      )}
      <button
        className="button button-primary compare-go"
        type="button"
        disabled={aliens.length < 2}
        onClick={onCompare}
      >
        Comparar <Icon name="bolt" size={16} />
      </button>
      <button
        className="icon-button compare-clear"
        type="button"
        onClick={onClear}
        aria-label="Limpar comparação"
      >
        <Icon name="trash" size={17} />
      </button>
    </aside>
  );
}
