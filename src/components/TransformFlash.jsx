import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";

export const transformationDuration = 1800;
const phases = [
  [280, "charge"],
  [620, "transform"],
  [1160, "reveal"],
];
const phaseLabels = {
  lock: "DNA selecionado. Iniciando sincronização.",
  charge: "Omnitrix carregado. Ativando transformação.",
  transform: "Transformando…",
  reveal: "Transformação concluída. Abrindo dossiê.",
};

/** Sequência própria inspirada no Omnitrix clássico, sem vídeo da série. */
export default function TransformFlash({ alien, onComplete, returnFocus }) {
  const dialogRef = useRef(null);
  const skipRef = useRef(null);
  const [phase, setPhase] = useState("lock");

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = returnFocus || document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let finished = false;
    function finish(skipped = false) {
      if (finished) return;
      finished = true;
      onComplete(skipped);
    }
    const timers = phases.map(([delay, next]) =>
      setTimeout(() => setPhase(next), delay),
    );
    timers.push(setTimeout(() => finish(), transformationDuration));
    function onPreferenceChange(event) {
      if (event.matches) finish(true);
    }
    preference.addEventListener("change", onPreferenceChange);
    dialog.showModal();
    skipRef.current?.focus();
    document.body.style.overflow = "hidden";
    if (preference.matches) finish(true);
    return () => {
      timers.forEach(clearTimeout);
      preference.removeEventListener("change", onPreferenceChange);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [onComplete, returnFocus]);

  return (
    <dialog
      ref={dialogRef}
      className="transform-sequence"
      data-phase={phase}
      aria-labelledby="transformation-title"
      aria-describedby="transformation-step"
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          skipRef.current?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onComplete(true);
      }}
    >
      <button
        ref={skipRef}
        type="button"
        className="transformation-skip"
        onClick={() => onComplete(true)}
      >
        Pular animação <span>Esc</span>
        <Icon name="arrow" size={16} />
      </button>
      <div className="transformation-grid" aria-hidden="true" />
      <div className="transformation-energy" aria-hidden="true" />
      <div className="transformation-beam" aria-hidden="true" />
      <div className="transformation-center">
        <span className="transformation-ring ring-a" aria-hidden="true" />
        <span className="transformation-ring ring-b" aria-hidden="true" />
        <svg
          className="transformation-watch"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="#263126"
            stroke="#6d7869"
            strokeWidth="5"
          />
          <circle
            cx="100"
            cy="100"
            r="75"
            fill="#080e09"
            stroke="#101912"
            strokeWidth="9"
          />
          <circle cx="100" cy="100" r="62" fill="#a7f542" />
          {[0, 90, 180, 270].map((angle) => (
            <path
              key={angle}
              transform={`rotate(${angle} 100 100)`}
              d="M87 5h26l-4 33H91Z"
              fill="#c5cbc0"
              stroke="#111b12"
              strokeWidth="3"
            />
          ))}
          <path
            className="transformation-emblem"
            d="M65 52h70l-23 48 23 48H65l23-48Z"
            fill="#0b1309"
          />
        </svg>
        <div className="transformation-alien" aria-hidden="true">
          <img src={alien.image} alt="" width="420" height="420" />
        </div>
        <span
          className="transformation-coordinate coordinate-top"
          aria-hidden="true"
        >
          OMNITRIX / ORIGINAL SERIES
        </span>
        <span
          className="transformation-coordinate coordinate-bottom"
          aria-hidden="true"
        >
          DNA #{String(alien.id).padStart(3, "0")} · SEQUÊNCIA DE ATIVAÇÃO
        </span>
      </div>
      <div className="transformation-caption">
        <p className="transformation-kicker">É HORA DE VIRAR HERÓI</p>
        <h2 id="transformation-title">{alien.name}</h2>
        <p id="transformation-step" role="status">
          {phaseLabels[phase]}
        </p>
        <span className="transformation-progress" aria-hidden="true">
          <span />
        </span>
      </div>
    </dialog>
  );
}
