import { useCallback, useEffect, useRef, useState } from "react";
import aliens from "./data/catalog-index.json";
import {
  filterAliens,
  sortAliens,
  getFilterOptions,
  statDefinitions,
  toggleSelection,
} from "./utils/catalog.js";
import { readStoredIds, writeStoredIds } from "./utils/storage.js";
import { isMuted, playSound, setMuted, stopSound } from "./utils/sound.js";
import { prefersReducedMotion } from "./utils/theme.js";
import AlienCard from "./components/AlienCard.jsx";
import AlienDetails from "./components/AlienDetails.jsx";
import CompareDialog from "./components/CompareDialog.jsx";
import CompareDock from "./components/CompareDock.jsx";
import Operators from "./components/Operators.jsx";
import OmnitrixSelector from "./components/OmnitrixSelector.jsx";
import Starfield from "./components/Starfield.jsx";
import TransformFlash from "./components/TransformFlash.jsx";
import IntroSequence from "./components/IntroSequence.jsx";
import {
  markIntroSeen,
  readIntroSeen,
  shouldShowIntro,
} from "./utils/intro.js";
import Icon from "./components/Icon.jsx";

const validIds = aliens.map((alien) => alien.id);
const aliensById = new Map(aliens.map((alien) => [alien.id, alien]));
const options = getFilterOptions(aliens);
const favoriteKey = "omnidex:favorites:v1";
const selectionKey = "omnidex:selection:v1";
const themeKey = "omnidex:theme:v1";

function readTheme() {
  try {
    return localStorage.getItem(themeKey) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

/** Conta de 0 até o alvo ao montar; respeita "reduzir movimento". */
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(() =>
    prefersReducedMotion() ? target : 0,
  );
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    let frame = 0;
    const startedAt = performance.now();
    function step(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

// Isola os frames do contador: a grade não precisa renderizar a cada quadro.
function AnimatedTotal({ target }) {
  return String(useCountUp(target)).padStart(2, "0");
}

export default function App() {
  const [view, setView] = useState("catalog");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [series, setSeries] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState("id");
  const [favorites, setFavorites] = useState(() =>
    readStoredIds(favoriteKey, validIds),
  );
  const [selectedIds, setSelectedIds] = useState(() =>
    readStoredIds(selectionKey, validIds, 10),
  );
  const [activeId, setActiveId] = useState(1);
  const [detailAlien, setDetailAlien] = useState(null);
  const [storageWarning, setStorageWarning] = useState(false);
  const [message, setMessage] = useState("");
  const [soundOn, setSoundOn] = useState(() => !isMuted());
  const [theme, setTheme] = useState(readTheme);
  const [compareIds, setCompareIds] = useState([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [flash, setFlash] = useState(null);
  const [turns, setTurns] = useState(0);
  const [intro, setIntro] = useState(() =>
    shouldShowIntro({
      search: window.location.search,
      reducedMotion: prefersReducedMotion(),
      automated: Boolean(navigator.webdriver),
      seen: readIntroSeen(),
    }),
  );
  // A tela de sincronização só aparece quando a abertura não foi exibida.
  const [bootSplash] = useState(!intro);
  const finishIntro = useCallback(() => {
    markIntroSeen();
    setIntro(false);
  }, []);
  const activationOpener = useRef(null);

  useEffect(() => {
    if (!writeStoredIds(favoriteKey, favorites)) setStorageWarning(true);
  }, [favorites]);
  useEffect(() => {
    if (!writeStoredIds(selectionKey, selectedIds)) setStorageWarning(true);
  }, [selectedIds]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(themeKey, theme);
    } catch {
      // Tema vale apenas para esta sessão.
    }
  }, [theme]);
  // O aviso some sozinho para não cobrir o conteúdo.
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const filtered = sortAliens(
    filterAliens(aliens, { query, category, series, favoritesOnly, favorites }),
    sort,
  );
  const activeAlien =
    filtered.find((alien) => alien.id === activeId) || filtered[0];
  const activePosition = filtered.findIndex(
    (alien) => alien.id === activeAlien?.id,
  );
  const neighbor = (offset) =>
    filtered.length > 1
      ? filtered[(activePosition + offset + filtered.length) % filtered.length]
      : null;
  const hasFilters =
    query || category !== "all" || series !== "all" || favoritesOnly;
  const compareAliens = compareIds
    .map((id) => aliensById.get(id))
    .filter(Boolean);

  function clearFilters() {
    playSound("remove");
    setQuery("");
    setCategory("all");
    setSeries("all");
    setFavoritesOnly(false);
  }
  function toggleFavorite(id) {
    playSound(favorites.includes(id) ? "favoriteOff" : "favoriteOn");
    setFavorites((current) => toggleSelection(current, id, aliens.length));
  }
  function toggleAlienSelection(id) {
    if (!selectedIds.includes(id) && selectedIds.length >= 10) {
      playSound("error");
      setMessage(
        "Seleção completa. Remova uma transformação antes de adicionar outra.",
      );
      return;
    }
    playSound(selectedIds.includes(id) ? "remove" : "add");
    setSelectedIds((current) => toggleSelection(current, id, 10));
    setMessage(
      selectedIds.includes(id)
        ? "Transformação removida da sua seleção."
        : "Transformação adicionada à sua seleção.",
    );
  }
  function toggleCompare(id) {
    const alien = aliensById.get(id);
    if (compareIds.includes(id)) {
      playSound("remove");
      setCompareIds((current) => current.filter((item) => item !== id));
      setMessage(`${alien.name} saiu da arena de comparação.`);
      return;
    }
    playSound("add");
    // Com a arena cheia, o registro mais antigo dá lugar ao novo.
    setCompareIds((current) => [...current, id].slice(-2));
    setMessage(
      compareIds.length
        ? `${alien.name} entrou na arena. Pronto para comparar!`
        : `${alien.name} entrou na arena. Escolha outro DNA para comparar.`,
    );
  }
  function openDetails(alien) {
    playSound("open");
    setActiveId(alien.id);
    setDetailAlien(alien);
  }
  /** Uma ativação é uma única operação, sem outros cliques concorrentes. */
  function activate(alien) {
    if (!alien || flash) return;
    activationOpener.current = document.activeElement;
    playSound("transform");
    setActiveId(alien.id);
    if (prefersReducedMotion()) {
      setDetailAlien(alien);
      return;
    }
    setFlash({ alien });
  }
  const finishTransformation = useCallback(
    (skipped = false) => {
      if (!flash) return;
      if (skipped) stopSound("transform");
      setDetailAlien(flash.alien);
      setFlash(null);
    },
    [flash],
  );
  function selectAlien(id) {
    playSound("select");
    setTurns((current) => current + 1);
    setActiveId(id);
  }
  function navigate(direction) {
    if (!filtered.length) return;
    playSound("dial");
    setTurns((current) => current + direction);
    setActiveId(
      filtered[(activePosition + direction + filtered.length) % filtered.length]
        .id,
    );
  }
  function randomize() {
    if (!filtered.length) {
      playSound("error");
      setMessage(
        "Nenhuma transformação disponível. Limpe os filtros para tentar novamente.",
      );
      return;
    }
    const alien = filtered[Math.floor(Math.random() * filtered.length)];
    playSound("random");
    setTurns((current) => current + 12);
    setActiveId(alien.id);
    setMessage(`Omnitrix selecionou ${alien.name}.`);
  }
  function chooseView(next) {
    playSound("nav");
    setView(next);
    setFavoritesOnly(false);
  }
  function toggleSound() {
    const next = !soundOn;
    setMuted(!next);
    setSoundOn(next);
    if (next) playSound("toggle");
  }
  function toggleTheme() {
    playSound("toggle");
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <Starfield />
      {intro ? (
        <IntroSequence onDone={finishIntro} />
      ) : bootSplash ? (
        <div className="boot-splash" aria-hidden="true">
          <span className="boot-mark" />
          <span className="boot-text">OMNIDEX · SINCRONIZANDO DNA</span>
          <span className="boot-bar" />
        </div>
      ) : null}
      <div className="scroll-progress" aria-hidden="true" />
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#"
            aria-label="OMNIDEX, início"
            onClick={() => chooseView("catalog")}
          >
            <img src="/omnitrix.svg" width="40" height="40" alt="" />
            <span>
              OMNI<span>DEX</span>
              <small>CENTRAL DE TRANSFORMAÇÕES</small>
            </span>
          </a>
          <nav className="main-nav" aria-label="Navegação principal">
            <button
              className={
                view === "catalog" && !favoritesOnly ? "nav-active" : ""
              }
              aria-current={
                view === "catalog" && !favoritesOnly ? "page" : undefined
              }
              onClick={() => chooseView("catalog")}
            >
              <Icon name="grid" size={17} /> Catálogo
            </button>
            <button
              className={
                view === "catalog" && favoritesOnly ? "nav-active" : ""
              }
              aria-current={
                view === "catalog" && favoritesOnly ? "page" : undefined
              }
              onClick={() => {
                playSound("nav");
                setView("catalog");
                setFavoritesOnly(true);
              }}
            >
              <Icon name="star" size={17} /> Favoritos{" "}
              <span className="nav-count" key={favorites.length}>
                {favorites.length}
              </span>
            </button>
            <button
              className={view === "operators" ? "nav-active" : ""}
              aria-current={view === "operators" ? "page" : undefined}
              onClick={() => chooseView("operators")}
            >
              <Icon name="users" size={17} /> Operadores
            </button>
          </nav>
          <div className="header-tools">
            <button
              className={`icon-button tool-button ${soundOn ? "is-on" : ""}`}
              type="button"
              aria-pressed={soundOn}
              aria-label={
                soundOn ? "Desativar efeitos sonoros" : "Ativar efeitos sonoros"
              }
              title={soundOn ? "Som ligado" : "Som desligado"}
              onClick={toggleSound}
            >
              <Icon name={soundOn ? "volume" : "volumeOff"} size={18} />
              {soundOn && (
                <span className="sound-waves" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </button>
            <button
              className="icon-button tool-button"
              type="button"
              aria-label={
                theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
              }
              title={theme === "light" ? "Tema claro" : "Tema escuro"}
              onClick={toggleTheme}
            >
              <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
            </button>
          </div>
          <span className="system-status">
            <span className="status-dot" /> SISTEMA ONLINE
          </span>
        </div>
      </header>
      <main id="main-content" className="main-container">
        {view === "catalog" ? (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="tiny-omnitrix" /> ARQUIVO INTERGALÁCTICO{" "}
                  <span className="edition">VOL. 01 / BEN 10</span>
                </div>
                <h1>
                  Um universo.
                  <br />
                  <span>Infinitas possibilidades.</span>
                </h1>
                <p className="hero-description">
                  Conheça o DNA por trás de cada herói. Explore poderes,
                  descubra origens e encontre a transformação certa para a
                  próxima aventura.
                </p>
                <a className="hero-link" href="#catalog">
                  <span>Explorar transformações</span>
                  <Icon name="arrow" size={19} />
                </a>
                <div className="hero-metrics">
                  <div>
                    <strong>
                      <AnimatedTotal target={aliens.length} />
                    </strong>
                    <span>TRANSFORMAÇÕES</span>
                  </div>
                  <div>
                    <strong>04</strong>
                    <span>SÉRIES NO ARQUIVO</span>
                  </div>
                  <div>
                    <strong>
                      {String(selectedIds.length).padStart(2, "0")}
                      <small>/10</small>
                    </strong>
                    <span>NA SUA SELEÇÃO</span>
                  </div>
                </div>
                <p className="fan-project">
                  <Icon name="shield" size={15} /> Projeto acadêmico de fãs ·
                  Explore com curiosidade.
                </p>
              </div>
              <OmnitrixSelector
                alien={activeAlien}
                previous={neighbor(-1)}
                next={neighbor(1)}
                position={activePosition}
                total={filtered.length}
                turns={turns}
                charging={Boolean(flash)}
                onNavigate={navigate}
                onActivate={activate}
              />
            </section>
            <section
              className="catalog-section"
              id="catalog"
              aria-labelledby="catalog-title"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">BANCO DE DNA</p>
                  <h2 id="catalog-title">
                    {favoritesOnly
                      ? "Suas favoritas"
                      : "Arquivo de transformações"}
                    <span className="heading-dot">.</span>
                  </h2>
                </div>
                <button
                  className="button button-secondary random-button"
                  onClick={randomize}
                >
                  <Icon name="shuffle" size={17} /> Transformação aleatória
                </button>
              </div>
              <div className="filter-panel">
                <div className="search-field">
                  <label htmlFor="search">Buscar transformação</label>
                  <div className="input-wrap">
                    <Icon name="search" />
                    <input
                      id="search"
                      type="search"
                      autoComplete="off"
                      placeholder="Nome, alias ou ID. Ex.: 001"
                      value={query}
                      onChange={(event) => {
                        playSound("tick");
                        setQuery(event.target.value);
                      }}
                    />
                    <span className="search-hint" aria-hidden="true">
                      DNA
                    </span>
                  </div>
                </div>
                <div className="select-field">
                  <label htmlFor="category">Categoria de habilidade</label>
                  <select
                    id="category"
                    value={category}
                    onChange={(event) => {
                      playSound("toggle");
                      setCategory(event.target.value);
                    }}
                  >
                    <option value="all">Todas as habilidades</option>
                    {options.categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="select-field">
                  <label htmlFor="series">Universo / série</label>
                  <select
                    id="series"
                    value={series}
                    onChange={(event) => {
                      playSound("toggle");
                      setSeries(event.target.value);
                    }}
                  >
                    <option value="all">Todas as séries</option>
                    {options.series.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <button
                  className={`icon-button filter-favorite ${favoritesOnly ? "is-favorite" : ""}`}
                  aria-pressed={favoritesOnly}
                  aria-label="Filtrar favoritos"
                  onClick={() => {
                    playSound("toggle");
                    setFavoritesOnly((current) => !current);
                  }}
                >
                  <Icon name="star" />
                </button>
              </div>
              <div className="results-toolbar">
                <div className="results-count" role="status">
                  <span className="status-dot" />
                  <strong>{filtered.length}</strong> de {aliens.length}{" "}
                  transformações{" "}
                  {hasFilters && (
                    <button className="clear-filters" onClick={clearFilters}>
                      Limpar filtros <Icon name="close" size={13} />
                    </button>
                  )}
                </div>
                <div className="sort-field">
                  <label htmlFor="sort">Ordenar por</label>
                  <select
                    id="sort"
                    value={sort}
                    onChange={(event) => {
                      playSound("toggle");
                      setSort(event.target.value);
                    }}
                  >
                    <option value="id">Número de DNA</option>
                    <option value="name">Nome: A–Z</option>
                    {statDefinitions.map((stat) => (
                      <option key={stat.key} value={stat.key}>
                        {stat.label}: maior primeiro
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="academic-notice">
                <Icon name="info" size={15} /> Atributos adaptados para fins
                acadêmicos; baseados em avaliações de fãs
              </p>
              {filtered.length ? (
                <div className="alien-grid">
                  {filtered.map((alien, index) => (
                    <AlienCard
                      key={alien.id}
                      alien={alien}
                      index={index}
                      isFavorite={favorites.includes(alien.id)}
                      onToggleFavorite={toggleFavorite}
                      onOpenDetails={openDetails}
                      onSelect={selectAlien}
                      isActive={activeAlien?.id === alien.id}
                      isComparing={compareIds.includes(alien.id)}
                      onToggleCompare={toggleCompare}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon name="search" size={34} />
                  </div>
                  <p className="eyebrow">SINAL NÃO ENCONTRADO</p>
                  <h3>Nenhum DNA por aqui.</h3>
                  <p>
                    Tente outro nome, ID ou combinação de filtros. Suas próximas
                    descobertas estão no arquivo.
                  </p>
                  <button
                    className="button button-primary"
                    onClick={clearFilters}
                  >
                    Limpar filtros <Icon name="arrow" size={18} />
                  </button>
                </div>
              )}
              <div className="archive-end">
                <span />
                <span>
                  FIM DA TRANSMISSÃO ·{" "}
                  {String(filtered.length).padStart(2, "0")} REGISTROS
                </span>
                <span />
              </div>
            </section>
          </>
        ) : (
          <Operators
            aliens={aliens}
            selectedIds={selectedIds}
            onToggleSelection={toggleAlienSelection}
            onOpenDetails={openDetails}
            onExploreCatalog={() => chooseView("catalog")}
            onLoadPreset={(ids) => {
              playSound("add");
              setSelectedIds(ids);
              setMessage(
                "Seleção demonstrativa carregada. Você pode editá-la.",
              );
            }}
          />
        )}
        {storageWarning && (
          <p className="storage-warning" role="alert">
            O navegador não permitiu salvar. Favoritos e seleção funcionam nesta
            sessão, mas podem não permanecer após recarregar.
          </p>
        )}
        <div
          className={`feedback-message ${compareAliens.length ? "above-dock" : ""}`}
          role="status"
        >
          {message}
        </div>
      </main>
      <footer className="site-footer">
        <div className="footer-brand">
          <span className="tiny-omnitrix" /> OMNIDEX{" "}
          <span>CONHECER. ESCOLHER. TRANSFORMAR.</span>
        </div>
        <p>
          Projeto acadêmico independente. Ben 10 pertence aos seus respectivos
          titulares.
          <br />
          Dados e imagens referenciados na Omnipedia.{" "}
          <a
            href="https://github.com/PRABHMANNAT/Ben-10-Omnitrix-Database"
            target="_blank"
            rel="noreferrer"
          >
            Consultar fonte <Icon name="arrow" size={13} />
          </a>
        </p>
        <span className="footer-version">ARQUIVO LOCAL / V.1.0</span>
      </footer>
      <CompareDock
        aliens={compareAliens}
        onRemove={toggleCompare}
        onClear={() => {
          playSound("remove");
          setCompareIds([]);
        }}
        onCompare={() => {
          playSound("versus");
          setCompareOpen(true);
        }}
      />
      {flash && (
        <TransformFlash
          alien={flash.alien}
          onComplete={finishTransformation}
          returnFocus={activationOpener.current}
        />
      )}
      {detailAlien && (
        <AlienDetails
          alien={detailAlien}
          onClose={() => {
            playSound("close");
            setDetailAlien(null);
          }}
          isFavorite={favorites.includes(detailAlien.id)}
          onToggleFavorite={toggleFavorite}
          isSelected={selectedIds.includes(detailAlien.id)}
          onToggleSelection={toggleAlienSelection}
          selectionFull={selectedIds.length >= 10}
        />
      )}
      {compareOpen && compareAliens.length === 2 && (
        <CompareDialog
          first={compareAliens[0]}
          second={compareAliens[1]}
          onClose={() => {
            playSound("close");
            setCompareOpen(false);
          }}
        />
      )}
    </>
  );
}
