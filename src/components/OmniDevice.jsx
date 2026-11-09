import { useId } from "react";

const ticks = Array.from({ length: 24 }, (_, index) => index * 15);
const lugs = [0, 120, 240];
const blades = [0, 120, 240];

/**
 * Dispositivo do OMNIDEX desenhado em SVG: um desenho próprio do projeto,
 * com cada parte em um grupo separado para animar de forma independente.
 *   .device-ring  anel externo, gira com a variável CSS --dial
 *   .device-core  núcleo luminoso, afunda e salta ao ser apertado
 *   .device-blades emblema em espiral de três lâminas, gira devagar
 */
export default function OmniDevice({ className = "", coreRef }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`omni-device ${className}`}
      viewBox="0 0 240 240"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-core`} cx="42%" cy="36%" r="75%">
          <stop offset="0" stopColor="#f1ffd0" />
          <stop offset="0.35" stopColor="var(--device-glow, #a7f542)" />
          <stop offset="1" stopColor="#2c5a0c" />
        </radialGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5d6a5c" />
          <stop offset="0.45" stopColor="#1b231c" />
          <stop offset="1" stopColor="#3d4a3d" />
        </linearGradient>
        <linearGradient id={`${id}-strap`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a211b" />
          <stop offset="0.5" stopColor="#0a0e0b" />
          <stop offset="1" stopColor="#1a211b" />
        </linearGradient>
      </defs>

      <g className="device-strap">
        <rect
          x="-6"
          y="84"
          width="62"
          height="72"
          rx="10"
          fill={`url(#${id}-strap)`}
        />
        <rect
          x="184"
          y="84"
          width="62"
          height="72"
          rx="10"
          fill={`url(#${id}-strap)`}
        />
        <path
          d="M6 100h30M6 120h30M6 140h30M204 100h30M204 120h30M204 140h30"
          stroke="#2b352a"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      <circle cx="120" cy="120" r="112" fill="#060907" />
      <circle cx="120" cy="120" r="108" fill={`url(#${id}-metal)`} />

      <g className="device-ring">
        <circle
          cx="120"
          cy="120"
          r="98"
          fill="#0d130e"
          stroke="#070b08"
          strokeWidth="4"
        />
        {ticks.map((angle) => (
          <rect
            key={angle}
            x="118.5"
            y={angle % 45 === 0 ? 25 : 28}
            width="3"
            height={angle % 45 === 0 ? 13 : 7}
            rx="1.5"
            fill={angle % 45 === 0 ? "var(--device-glow, #a7f542)" : "#55634f"}
            transform={`rotate(${angle} 120 120)`}
          />
        ))}
        {lugs.map((angle) => (
          <g key={angle} transform={`rotate(${angle} 120 120)`}>
            <rect
              x="106"
              y="6"
              width="28"
              height="20"
              rx="6"
              fill="#c9d1c4"
              stroke="#070b08"
              strokeWidth="3"
            />
            <rect x="114" y="12" width="12" height="6" rx="3" fill="#070b08" />
          </g>
        ))}
      </g>

      <circle
        cx="120"
        cy="120"
        r="80"
        fill="#050806"
        stroke="#263024"
        strokeWidth="3"
      />

      <g className="device-core" ref={coreRef}>
        <circle
          className="device-halo"
          cx="120"
          cy="120"
          r="72"
          fill="var(--device-glow, #a7f542)"
          opacity="0.22"
        />
        <circle
          cx="120"
          cy="120"
          r="64"
          fill={`url(#${id}-core)`}
          stroke="#0b1607"
          strokeWidth="4"
        />
        <g className="device-blades">
          {blades.map((angle) => (
            <path
              key={angle}
              transform={`rotate(${angle} 120 120)`}
              d="M120 106 C102 98 96 78 106 62 C128 58 148 70 152 90 C140 80 126 88 120 106 Z"
              fill="#0b1607"
            />
          ))}
          <circle cx="120" cy="120" r="13" fill="#0b1607" />
          <circle
            cx="120"
            cy="120"
            r="5.5"
            fill="var(--device-glow, #a7f542)"
          />
        </g>
        <path
          d="M78 96 A50 50 0 0 1 126 62"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
