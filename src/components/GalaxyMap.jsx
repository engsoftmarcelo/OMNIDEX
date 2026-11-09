import { useState } from "react";
import Icon from "./Icon.jsx";
import { hasKnownPlanet, planetGroups } from "../utils/omni.js";

const formatId = (id) => String(id).padStart(3, "0");

/**
 * Mapa da galáxia: cada local de origem registrado nos dados vira um ponto
 * do mapa. Selecionar uma origem mostra as transformações de lá e permite
 * filtrar o catálogo por ele.
 */
export default function GalaxyMap({
  aliens,
  activePlanet,
  onFilterPlanet,
  onOpenDetails,
}) {
  const planets = planetGroups(aliens);
  const unknown = aliens.filter((alien) => !hasKnownPlanet(alien)).length;
  const [picked, setPicked] = useState(
    () =>
      planets.find((planet) => planet.name === activePlanet)?.name ||
      planets[0]?.name,
  );
  const current = planets.find((planet) => planet.name === picked);

  return (
    <section className="galaxy-section" aria-labelledby="galaxy-title">
      <div className="operators-heading">
        <div>
          <p className="eyebrow">CARTOGRAFIA DE DNA</p>
          <h2 id="galaxy-title">Mapa da galáxia.</h2>
        </div>
        <span className="tag">
          <Icon name="globe" /> {planets.length} locais de origem
        </span>
      </div>
      <p className="muted">
        Cada ponto é um local de origem presente nos dados. O tamanho indica
        quantas transformações vêm de lá. As posições são ilustrativas: o mapa
        não representa distâncias reais do universo da série.
        {unknown > 0 &&
          ` ${unknown} transformações não têm origem informada e ficam fora do mapa.`}
      </p>

      <div className="galaxy-layout">
        <div className="galaxy-map">
          <span className="galaxy-arm arm-a" aria-hidden="true" />
          <span className="galaxy-arm arm-b" aria-hidden="true" />
          <span className="galaxy-core" aria-hidden="true" />
          <ul>
            {planets.map((planet, index) => (
              <li
                key={planet.name}
                style={{
                  left: `${planet.x}%`,
                  top: `${planet.y}%`,
                  "--planet": planet.color,
                  "--size": `${10 + planet.aliens.length * 5}px`,
                  "--i": index,
                }}
              >
                <button
                  type="button"
                  className={`planet ${planet.name === picked ? "is-picked" : ""} ${planet.name === activePlanet ? "is-filtered" : ""}`}
                  aria-pressed={planet.name === picked}
                  aria-label={`${planet.name}: ${planet.aliens.length} ${planet.aliens.length === 1 ? "transformação" : "transformações"}`}
                  onClick={() => setPicked(planet.name)}
                >
                  <span className="planet-body" aria-hidden="true" />
                  <span className="planet-name" aria-hidden="true">
                    {planet.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {current && (
          <aside
            className="planet-panel"
            style={{ "--planet": current.color }}
            aria-live="polite"
          >
            <p className="dialog-eyebrow">ORIGEM SELECIONADA</p>
            <h3>{current.name}</h3>
            <p className="muted">
              {current.aliens.length}{" "}
              {current.aliens.length === 1
                ? "transformação registrada"
                : "transformações registradas"}{" "}
              · espécies:{" "}
              {[
                ...new Set(
                  current.aliens.map(
                    (alien) => alien.species || "Não informado",
                  ),
                ),
              ].join(" / ")}
            </p>
            <ul className="planet-aliens">
              {current.aliens.map((alien) => (
                <li key={alien.id}>
                  <button type="button" onClick={() => onOpenDetails(alien)}>
                    <img
                      src={alien.image}
                      alt=""
                      width="56"
                      height="56"
                      loading="lazy"
                    />
                    <span>
                      <small>DNA / {formatId(alien.id)}</small>
                      <strong>{alien.name}</strong>
                    </span>
                    <Icon name="arrow" size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="button button-primary"
              onClick={() => onFilterPlanet(current.name)}
            >
              <Icon name="filter" size={17} /> Ver no catálogo
            </button>
          </aside>
        )}
      </div>
    </section>
  );
}
