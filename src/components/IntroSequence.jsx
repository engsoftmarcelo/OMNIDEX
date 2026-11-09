import { useEffect, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import OmniDevice from "./OmniDevice.jsx";
import { introDuration, introTimeline } from "../utils/intro.js";
import { playSound, stopSound } from "../utils/sound.js";

const captions = {
  gate: "Sinal desconhecido em rota de colisão com a Terra.",
  fall: "Objeto entrando na atmosfera…",
  impact: "Impacto confirmado.",
  open: "Cápsula aberta. Dispositivo localizado.",
  boot: "Iniciando OMNIDEX.",
};
const phaseSounds = {
  fall: "meteor",
  impact: "impact",
  open: "podOpen",
  boot: "bootUp",
};
const introSounds = Object.values(phaseSounds);
const debris = Array.from({ length: 16 }, (_, index) => index);
const embers = Array.from({ length: 10 }, (_, index) => index);

/**
 * Abertura: um meteoro verde cai, abre uma cratera e revela o dispositivo.
 * Começa parada, esperando um toque — é esse gesto que libera o áudio no
 * navegador. Pode ser pulada a qualquer momento (botão ou Esc).
 */
export default function IntroSequence({ onDone }) {
  const dialogRef = useRef(null);
  const startRef = useRef(null);
  const [phase, setPhase] = useState("gate");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    startRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!started) return undefined;
    const timers = introTimeline.map(([delay, next]) =>
      setTimeout(() => {
        setPhase(next);
        playSound(phaseSounds[next]);
      }, delay),
    );
    timers.push(setTimeout(() => onDone(), introDuration));
    return () => timers.forEach(clearTimeout);
  }, [started, onDone]);

  function skip() {
    introSounds.forEach(stopSound);
    onDone();
  }

  return (
    <dialog
      ref={dialogRef}
      className="intro"
      data-phase={phase}
      aria-labelledby="intro-title"
      aria-describedby="intro-caption"
      onCancel={(event) => {
        event.preventDefault();
        skip();
      }}
    >
      <div className="intro-scene" aria-hidden="true">
        <div className="intro-stars" />
        <div className="intro-stars intro-stars-far" />
        <span className="intro-signal" />
        <div className="intro-meteor">
          <span className="intro-meteor-tail" />
          <span className="intro-meteor-head" />
          {embers.map((index) => (
            <span
              key={index}
              className="intro-ember"
              style={{ "--i": index }}
            />
          ))}
        </div>
        <svg
          className="intro-ground"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          <path
            className="intro-hills-far"
            d="M0 150 C150 90 260 130 400 110 S640 60 800 120 1040 90 1200 130 V300 H0Z"
          />
          <path
            className="intro-hills-near"
            d="M0 210 C120 170 240 200 380 185 S560 150 600 190 820 165 960 195 1120 170 1200 200 V300 H0Z"
          />
          <g className="intro-pines">
            {[70, 150, 250, 930, 1010, 1110].map((x, index) => (
              <path
                key={x}
                d={`M${x} ${200 - (index % 2) * 8} l-16 44 h10 l-14 34 h40 l-14 -34 h10 z`}
              />
            ))}
          </g>
        </svg>
        <div className="intro-impact">
          <span className="intro-crater" />
          <span className="intro-shock" />
          <span className="intro-shock intro-shock-late" />
          {debris.map((index) => (
            <span
              key={index}
              className="intro-debris"
              style={{ "--i": index }}
            />
          ))}
          <span className="intro-smoke smoke-a" />
          <span className="intro-smoke smoke-b" />
          <span className="intro-smoke smoke-c" />
          <span className="intro-beam" />
          <span className="intro-pod pod-left" />
          <span className="intro-pod pod-right" />
          <OmniDevice className="intro-device" />
        </div>
        <span className="intro-flash" />
        <span className="intro-boot" />
      </div>

      <div className="intro-copy">
        <p className="intro-kicker">OMNIDEX · TRANSMISSÃO DE EMERGÊNCIA</p>
        <h2 id="intro-title">Algo está caindo do céu.</h2>
        <p id="intro-caption" role="status">
          {captions[phase]}
        </p>
        {!started && (
          <button
            ref={startRef}
            type="button"
            className="intro-start"
            onClick={() => setStarted(true)}
          >
            <Icon name="bolt" size={20} /> Toque para iniciar
          </button>
        )}
      </div>

      <button type="button" className="intro-skip" onClick={skip}>
        Pular abertura <span>Esc</span>
      </button>
    </dialog>
  );
}
