import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import OmniDevice from "./OmniDevice.jsx";
import { accentFor, prefersReducedMotion } from "../utils/theme.js";
import { playSound } from "../utils/sound.js";

const dragStep = 46;
const slamDelay = 260;

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
  const coreRef = useRef(null);
  const drag = useRef(null);
  const slamTimer = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [slamming, setSlamming] = useState(false);

  useEffect(() => () => clearTimeout(slamTimer.current), []);

  /** Afunda e solta o núcleo, como um botão de mola. */
  function pressCore(depth = 0.93, duration = 220) {
    if (prefersReducedMotion()) return;
    coreRef.current?.animate?.(
      [
        { transform: "scale(1)" },
        {
          transform: `scale(${depth})`,
          filter: "brightness(0.75)",
          offset: 0.35,
        },
        { transform: "scale(1.06)", filter: "brightness(1.5)", offset: 0.7 },
        { transform: "scale(1)" },
      ],
      { duration, easing: "cubic-bezier(0.3, 0, 0.2, 1)" },
    );
  }
  function turn(direction) {
    pressCore();
    onNavigate(direction);
  }
  /** Bate no núcleo e só então dispara a transformação. */
  function slam() {
    if (!alien || charging || slamTimer.current) return;
    if (prefersReducedMotion()) {
      onActivate(alien);
      return;
    }
    playSound("slam");
    pressCore(0.8, 320);
    setSlamming(true);
    slamTimer.current = setTimeout(() => {
      slamTimer.current = null;
      setSlamming(false);
      onActivate(alien);
    }, slamDelay);
  }
  // Arrastar o mostrador para os lados gira o anel, um alien por "dente".
  function handlePointerDown(event) {
    if (!alien || charging || event.button > 0) return;
    drag.current = { x: event.clientX, id: event.pointerId };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(true);
  }
  function handlePointerMove(event) {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    const distance = event.clientX - drag.current.x;
    if (Math.abs(distance) < dragStep) return;
    drag.current.x = event.clientX;
    turn(distance > 0 ? 1 : -1);
  }
  function handlePointerEnd() {
    drag.current = null;
    setDragging(false);
  }
  function handleKeys(event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      turn(event.key === "ArrowLeft" ? -1 : 1);
    }
  }
  return (
    <section
      className={`selector ${charging ? "is-charging" : ""} ${slamming ? "is-slamming" : ""}`}
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
      <div
        className={`selector-stage ${dragging ? "is-dragging" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div className="orbit orbit-outer" aria-hidden="true" />
        <div className="orbit orbit-inner" aria-hidden="true" />
        <OmniDevice className="stage-device" coreRef={coreRef} />
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
          onClick={() => turn(-1)}
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
          onClick={() => turn(1)}
        >
          <Icon name="chevronRight" />
        </button>
      </div>
      <button
        className="button button-primary activate-button"
        disabled={!alien || charging}
        onClick={slam}
      >
        <Icon name="bolt" size={18} /> Ativar transformação{" "}
        <Icon name="arrow" size={18} />
      </button>
      <p className="selector-hint">
        Arraste o mostrador, use as setas ← → ou os controles
      </p>
    </section>
  );
}
