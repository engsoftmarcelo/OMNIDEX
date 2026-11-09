import { useEffect, useRef, useState } from "react";
import { statDefinitions } from "../utils/catalog.js";
import { accentFor, powerTotal } from "../utils/theme.js";
import {
  energySeconds,
  evolutionDeltas,
  findEvolution,
  lowEnergySeconds,
  statExtremes,
  statRanks,
} from "../utils/omni.js";
import { playSound } from "../utils/sound.js";
import Icon from "./Icon.jsx";
import StatRadar from "./StatRadar.jsx";

const formatId = (id) => String(id).padStart(3, "0");

export default function AlienDetails({
  alien,
  onClose,
  isFavorite,
  onToggleFavorite,
  isSelected,
  onToggleSelection,
  selectionFull,
  aliens = [],
  timed = false,
  onTimeout,
  onNavigate,
  onOpenAlien,
  justScanned = false,
}) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const [galleryState, setGalleryState] = useState({
    items: alien.gallery ?? [],
    loading: !Array.isArray(alien.gallery),
    error: "",
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      // This also restores the opener during React StrictMode's setup/cleanup check.
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      } else {
        // Remover um favorito pode desmontar o card que abriu este diálogo.
        document.getElementById("search")?.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(alien.gallery)) {
      setGalleryState({ items: alien.gallery, loading: false, error: "" });
      return undefined;
    }

    const controller = new AbortController();
    setGalleryState({ items: [], loading: true, error: "" });
    async function loadGallery() {
      try {
        const response = await fetch(`/data/galleries/${alien.id}.json`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gallery HTTP ${response.status}`);
        const items = await response.json();
        if (!Array.isArray(items)) throw new Error("Invalid gallery data");
        if (!controller.signal.aborted)
          setGalleryState({ items, loading: false, error: "" });
      } catch {
        if (!controller.signal.aborted)
          setGalleryState({
            items: [],
            loading: false,
            error:
              "Galeria indisponível. Reabra o dossiê para tentar novamente.",
          });
      }
    }
    loadGallery();
    return () => controller.abort();
  }, [alien.id, alien.gallery]);

  // Energia da transformação: só corre quando o dossiê veio de uma ativação.
  const [energy, setEnergy] = useState(energySeconds);
  const [held, setHeld] = useState(false);
  const running = timed && !held;
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(
      () => setEnergy((current) => Math.max(current - 1, 0)),
      1000,
    );
    return () => clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (!running) return;
    if (energy === 0) onTimeout?.();
    else if (energy <= lowEnergySeconds) playSound("warn");
  }, [energy, running, onTimeout]);

  const evolution = findEvolution(alien, aliens);
  const ranks = statRanks(alien, aliens);
  const extremes = statExtremes(alien);
  const lowEnergy = running && energy <= lowEnergySeconds;

  const powers = alien.powers?.length ? alien.powers : ["Não informado"];
  const weaknesses = alien.weaknesses?.length
    ? alien.weaknesses
    : ["Não informado"];
  const gallery = galleryState.items;

  return (
    <dialog
      ref={dialogRef}
      className={`alien-dialog ${lowEnergy ? "is-low-energy" : ""}`}
      aria-labelledby="dossier-title"
      aria-describedby="dossier-description"
      style={{ "--accent": accentFor(alien) }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <button
        ref={closeRef}
        className="icon-button dialog-close"
        type="button"
        onClick={onClose}
        aria-label="Fechar dossiê"
      >
        <Icon name="close" />
      </button>
      {timed && (
        <div
          className={`dialog-energy ${held ? "is-held" : ""}`}
          style={{ "--energy": `${(energy / energySeconds) * 100}%` }}
        >
          <span className="dialog-energy-label">
            <Icon name="bolt" size={14} />
            {held
              ? "ENERGIA TRAVADA"
              : lowEnergy
                ? "ENERGIA NO FIM"
                : "ENERGIA DA TRANSFORMAÇÃO"}
          </span>
          <span
            className="dialog-energy-track"
            role="timer"
            aria-label={
              held
                ? "Contagem pausada"
                : `${energy} segundos de transformação restantes`
            }
          >
            <span />
          </span>
          <strong aria-hidden="true">{held ? "∞" : `${energy}s`}</strong>
          <button
            type="button"
            className="dialog-energy-hold"
            aria-pressed={held}
            onClick={() => setHeld((current) => !current)}
          >
            {held ? "Retomar contagem" : "Pausar contagem"}
          </button>
        </div>
      )}
      {onNavigate && (
        <div className="dialog-pager">
          <button
            type="button"
            className="icon-button"
            aria-label="Dossiê anterior"
            onClick={() => onNavigate(-1)}
          >
            <Icon name="chevronLeft" />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Próximo dossiê"
            onClick={() => onNavigate(1)}
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      )}
      <div className="dialog-layout">
        <div
          className={`dialog-artwork ${justScanned ? "is-scanning" : ""}`}
          key={alien.id}
        >
          <span className="dialog-eyebrow">
            AMOSTRA DE DNA / {formatId(alien.id)}
          </span>
          <span className="dialog-rings" aria-hidden="true" />
          <img
            src={alien.image}
            alt={`Ilustração de ${alien.name}`}
            width="480"
            height="520"
          />
          <span className="dialog-scan" aria-hidden="true" />
          <span className="dialog-artwork-label">
            {alien.species || "Não informado"}
          </span>
          <span className="dialog-stamp">
            <Icon name="check" size={14} />
            {justScanned ? "DNA COLETADO AGORA" : "DNA COLETADO"}
          </span>
        </div>
        <div className="dialog-content">
          <div className="dialog-identity">
            <p className="dialog-eyebrow">
              DOSSIÊ DE TRANSFORMAÇÃO · #{formatId(alien.id)}
            </p>
            <h2 id="dossier-title">{alien.name}</h2>
            <p className="muted">
              {alien.originalName}
              {alien.aliases?.filter(
                (alias) => alias !== alien.name && alias !== alien.originalName,
              ).length
                ? ` · Aliases: ${alien.aliases.filter((alias) => alias !== alien.name && alias !== alien.originalName).join(" / ")}`
                : ""}
            </p>
            <div className="dialog-tags">
              {alien.categories.map((category) => (
                <span className="tag" key={category}>
                  {category}
                </span>
              ))}
            </div>
            {(alien.canonStatus?.includes("não canônico") ||
              alien.aiEnhanced) && (
              <div className="dialog-tags">
                {alien.canonStatus?.includes("não canônico") && (
                  <span className="tag">{alien.canonStatus}</span>
                )}
                {alien.aiEnhanced && (
                  <span className="tag">Imagem aprimorada por IA</span>
                )}
              </div>
            )}
          </div>
          <div className="dialog-actions">
            <button
              className={`button ${isFavorite ? "button-primary" : "button-secondary"}`}
              type="button"
              aria-pressed={isFavorite}
              onClick={() => onToggleFavorite(alien.id)}
            >
              <Icon name="star" />
              {isFavorite ? "Favoritado" : "Favoritar"}
            </button>
            <button
              className="button button-secondary"
              type="button"
              disabled={!isSelected && selectionFull}
              onClick={() => onToggleSelection(alien.id)}
              aria-pressed={isSelected}
            >
              <Icon name={isSelected ? "check" : "plus"} />
              {isSelected
                ? "Remover da seleção"
                : selectionFull
                  ? "Seleção cheia (10/10)"
                  : "Adicionar à seleção"}
            </button>
          </div>
          <div className="dialog-summary">
            <p>
              <span>PODER TOTAL</span>
              <strong>{powerTotal(alien)}</strong>
              <small>de 600</small>
            </p>
            {extremes && (
              <>
                <p>
                  <span>PONTO FORTE</span>
                  <strong>{extremes.best.value}</strong>
                  <small>{extremes.best.label}</small>
                </p>
                <p className="is-weak">
                  <span>PONTO FRACO</span>
                  <strong>{extremes.worst.value}</strong>
                  <small>{extremes.worst.label}</small>
                </p>
              </>
            )}
          </div>
          <dl className="dialog-facts">
            <div>
              <dt>Espécie</dt>
              <dd>{alien.species || "Não informado"}</dd>
            </div>
            <div>
              <dt>Planeta de origem</dt>
              <dd>{alien.planet || "Não informado"}</dd>
            </div>
            <div>
              <dt>Séries associadas</dt>
              <dd>
                {alien.series.length
                  ? alien.series.join(" · ")
                  : "Não informado"}
              </dd>
            </div>
            <div>
              <dt>Classificação na referência</dt>
              <dd>{alien.canonStatus || "Não informado"}</dd>
            </div>
          </dl>
          <section className="dialog-section">
            <h3>Sobre a transformação</h3>
            <p id="dossier-description">
              {alien.description || "Não informado"}
            </p>
            {(alien.aiEnhanced || alien.notes?.length > 0) && (
              <div className="dialog-notice">
                {alien.aiEnhanced && (
                  <p>
                    Imagem aprimorada por IA na referência. Preserve esta
                    identificação ao reutilizá-la.
                  </p>
                )}
                {alien.notes?.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            )}
          </section>
          {evolution && (
            <section className="dialog-section dialog-evolution">
              <h3>Árvore de evolução</h3>
              <div className="evolution-tree">
                {[evolution.base, evolution.ultimate].map((form, index) => (
                  <button
                    key={form.id}
                    type="button"
                    className={`evolution-form ${form.id === alien.id ? "is-current" : ""}`}
                    style={{ "--accent": accentFor(form) }}
                    aria-current={form.id === alien.id ? "true" : undefined}
                    disabled={form.id === alien.id || !onOpenAlien}
                    onClick={() => onOpenAlien?.(form)}
                  >
                    <img
                      src={form.image}
                      alt=""
                      width="120"
                      height="120"
                      loading="lazy"
                    />
                    <small>
                      {index === 0 ? "FORMA COMUM" : "FORMA SUPREMA"}
                    </small>
                    <strong>{form.name}</strong>
                    <span>{powerTotal(form)} de poder</span>
                  </button>
                ))}
                <span className="evolution-arrow" aria-hidden="true">
                  <Icon name="bolt" size={20} />
                </span>
              </div>
              <ul className="evolution-deltas">
                {evolutionDeltas(evolution.base, evolution.ultimate).map(
                  (item) => (
                    <li
                      key={item.key}
                      className={
                        item.delta > 0
                          ? "is-up"
                          : item.delta < 0
                            ? "is-down"
                            : ""
                      }
                    >
                      <span>{item.label}</span>
                      <strong>
                        {item.from ?? "—"} → {item.to ?? "—"}
                      </strong>
                      <em>
                        {item.delta === null
                          ? "—"
                          : item.delta > 0
                            ? `+${item.delta}`
                            : item.delta}
                      </em>
                    </li>
                  ),
                )}
              </ul>
            </section>
          )}
          <section className="dialog-section">
            <h3>Poderes registrados</h3>
            <ul>
              {powers.map((power) => (
                <li key={power}>{power}</li>
              ))}
            </ul>
          </section>
          <section className="dialog-section">
            <h3>Fraquezas registradas</h3>
            <ul>
              {weaknesses.map((weakness) => (
                <li key={weakness}>{weakness}</li>
              ))}
            </ul>
          </section>
          <section className="dialog-section">
            <h3>
              Atributos da adaptação <span className="muted">/ 100</span>
            </h3>
            <p className="dialog-notice">
              Atributos adaptados para fins acadêmicos; baseados em avaliações
              de fãs
            </p>
            <div className="dialog-power">
              <StatRadar
                label={`Radar dos atributos de ${alien.name}`}
                series={[{ stats: alien.stats, color: accentFor(alien) }]}
              />
              <p>
                <span>PODER TOTAL</span>
                <strong>{powerTotal(alien)}</strong>
                <small>de 600 pontos possíveis</small>
              </p>
            </div>
            <div className="dialog-stats">
              {statDefinitions.map(({ key, label }, index) => {
                const value = alien.stats?.[key];
                return (
                  <div
                    className="dialog-stat"
                    key={key}
                    style={{ "--i": index }}
                  >
                    <span>{label}</span>
                    <strong>
                      {Number.isFinite(value) ? value : "Não informado"}
                    </strong>
                    {ranks[key] && (
                      <em
                        className={`dialog-rank ${ranks[key] <= 3 ? "is-top" : ""}`}
                      >
                        {ranks[key]}º de {aliens.length}
                      </em>
                    )}
                    <div className="dialog-stat-track" aria-hidden="true">
                      <span
                        style={{
                          width: `${Number.isFinite(value) ? value : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <details className="dialog-source-stats">
              <summary>Consultar avaliações originais e fórmulas</summary>
              <p>
                Valores originais de fãs, sem equivalência oficial com Pokémon
                ou Ben 10.
              </p>
              <dl>
                {Object.entries(alien.sourceStats ?? {}).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value ?? "Não informado"}</dd>
                  </div>
                ))}
              </dl>
              <p>
                HP = média de durability e strength; Ataque = strength; Defesa =
                durability; Ataque especial = power; Defesa especial = média de
                durability e intelligence; Velocidade = speed. A fonte usa
                escala 0–100; as médias são arredondadas.
              </p>
            </details>
          </section>
          <section className="dialog-section">
            <h3>
              Galeria{" "}
              <span className="muted">
                (
                {galleryState.loading
                  ? (alien.galleryCount ?? "…")
                  : gallery.length}
                )
              </span>
            </h3>
            {galleryState.loading ? (
              <p className="muted" role="status">
                Carregando galeria…
              </p>
            ) : galleryState.error ? (
              <p className="dialog-notice" role="alert">
                {galleryState.error}
              </p>
            ) : gallery.length ? (
              <div className="dialog-gallery">
                {gallery.map((item, index) => (
                  <figure key={item.src}>
                    <a
                      href={item.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir imagem ${index + 1} de ${alien.name}`}
                    >
                      <img
                        src={item.src}
                        alt={
                          item.label ||
                          `${alien.name} — imagem ${index + 1} da galeria`
                        }
                        width="240"
                        height="220"
                        loading="lazy"
                      />
                    </a>
                    {(item.aiEnhanced || item.sourceUrl) && (
                      <figcaption>
                        {item.aiEnhanced && <span>Aprimorada por IA · </span>}
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Fonte da imagem {index + 1}
                          </a>
                        )}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <p className="muted">Galeria não informada na referência.</p>
            )}
          </section>
          <section className="dialog-section">
            <h3>Fontes e créditos</h3>
            <p className="muted">
              Arte e personagens pertencem aos respectivos titulares. Crédito e
              acesso público não equivalem a autorização de uso.
            </p>
            <ul className="dialog-source-list">
              {(alien.sources ?? []).map((url, index) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    Referência dos dados {index + 1}
                  </a>
                </li>
              ))}
              {(alien.imageSources ?? []).map((source, index) => (
                <li key={`${source.url}-${index}`}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.label || `Fonte da imagem ${index + 1}`}
                  </a>
                  {source.licenseNote && <span>{source.licenseNote}</span>}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </dialog>
  );
}
