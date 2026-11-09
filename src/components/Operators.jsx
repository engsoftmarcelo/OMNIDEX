import Icon from "./Icon.jsx";

export const operatorProfiles = [
  {
    id: "atlas",
    name: "Operador Atlas",
    initials: "AT",
    role: "Exploração e resistência",
    transformationIds: [1, 2, 3, 4, 5],
  },
  {
    id: "vega",
    name: "Operadora Vega",
    initials: "VE",
    role: "Mobilidade e estratégia",
    transformationIds: [2, 5, 6, 8],
  },
  {
    id: "ion",
    name: "Operador Íon",
    initials: "ÍO",
    role: "Energia e versatilidade",
    transformationIds: [1, 3, 6, 7, 9, 10],
  },
];

const maxBadges = 10;
const formatId = (id) => String(id).padStart(3, "0");

export default function Operators({
  aliens,
  selectedIds,
  onToggleSelection,
  onOpenDetails,
  onLoadPreset,
  onExploreCatalog,
}) {
  const byId = new Map(aliens.map((alien) => [alien.id, alien]));
  const selected = selectedIds.map((id) => byId.get(id)).filter(Boolean);

  return (
    <section
      className="operators-section"
      id="operators"
      aria-labelledby="operators-title"
    >
      <div className="operators-heading">
        <div>
          <p className="eyebrow">PROTOCOLO DE OPERAÇÃO</p>
          <h2 id="operators-title">Cada operador. Uma seleção.</h2>
        </div>
        <span className="tag">
          <Icon name="users" /> Perfis demonstrativos
        </span>
      </div>
      <p className="muted">
        Perfis e seleções criados para esta atividade. São exemplos acadêmicos e
        não representam personagens ou relações oficiais de Ben 10.
      </p>
      <div className="operators-grid">
        {operatorProfiles.map((operator) => {
          const related = operator.transformationIds
            .map((id) => byId.get(id))
            .filter(Boolean);
          return (
            <article className="operator-card" key={operator.id}>
              <div className="operator-identity">
                <div className="operator-avatar" aria-hidden="true">
                  {operator.initials}
                </div>
                <div>
                  <h3>{operator.name}</h3>
                  <p className="muted">{operator.role}</p>
                </div>
              </div>
              <div
                className="operator-badges"
                role="img"
                aria-label={`${related.length} de ${maxBadges} espaços de seleção preenchidos`}
              >
                <span className="operator-badges-label">
                  SELEÇÃO <b>{related.length}</b>/{maxBadges}
                </span>
                <span className="operator-badges-row">
                  {Array.from({ length: maxBadges }, (_, index) => (
                    <Icon
                      key={index}
                      name="badge"
                      size={19}
                      className={index < related.length ? "is-earned" : ""}
                      style={{ "--i": index }}
                    />
                  ))}
                </span>
              </div>
              <div className="operator-count">
                <strong>{related.length}</strong>
                <span>transformações na seleção</span>
              </div>
              <ul className="operator-list">
                {related.map((alien) => (
                  <li key={alien.id}>
                    <button type="button" onClick={() => onOpenDetails(alien)}>
                      <img
                        className="operator-thumb"
                        src={alien.image}
                        alt=""
                        width="30"
                        height="30"
                        loading="lazy"
                      />
                      <span>#{formatId(alien.id)}</span>
                      {alien.name}
                      <Icon name="arrow" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                className="button button-secondary operator-load"
                type="button"
                onClick={() => onLoadPreset(related.map((alien) => alien.id))}
              >
                <Icon name="plus" /> Usar esta seleção
              </button>
            </article>
          );
        })}
      </div>
      <section className="selection-panel" aria-labelledby="selection-title">
        <div className="operators-heading">
          <div>
            <p className="eyebrow">SEU OMNITRIX</p>
            <h3 id="selection-title">Minha seleção</h3>
          </div>
          <span className="selection-count" aria-live="polite">
            {selected.length}
            <span> / 10</span>
          </span>
        </div>
        <p className="muted">
          Adicione transformações pelo dossiê. Use um perfil acima para
          substituir sua seleção por um exemplo. Suas escolhas são salvas neste
          navegador.
        </p>
        {selected.length ? (
          <div className="selection-grid">
            {selected.map((alien) => (
              <article className="selection-item" key={alien.id}>
                <button
                  className="selection-detail"
                  type="button"
                  onClick={() => onOpenDetails(alien)}
                  aria-label={`Abrir dossiê de ${alien.name}`}
                >
                  <img
                    className="selection-image"
                    src={alien.image}
                    alt=""
                    width="96"
                    height="100"
                    loading="lazy"
                  />
                  <span>
                    <span className="muted">#{formatId(alien.id)}</span>
                    <strong>{alien.name}</strong>
                  </span>
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => onToggleSelection(alien.id)}
                  aria-label={`Remover ${alien.name} da seleção`}
                >
                  <Icon name="trash" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="selection-empty">
            <Icon name="plus" />
            <p>Sua primeira transformação está à espera.</p>
            <button
              className="button button-secondary"
              type="button"
              onClick={onExploreCatalog}
            >
              Explorar catálogo <Icon name="arrow" />
            </button>
          </div>
        )}
      </section>
    </section>
  );
}
