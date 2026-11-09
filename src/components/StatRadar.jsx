import { statDefinitions } from "../utils/catalog.js";

const size = 220;
const center = size / 2;
const radius = 78;

function point(index, ratio) {
  const angle = (Math.PI * 2 * index) / statDefinitions.length - Math.PI / 2;
  return [
    center + Math.cos(angle) * radius * ratio,
    center + Math.sin(angle) * radius * ratio,
  ];
}

const polygon = (ratios) =>
  ratios.map((ratio, index) => point(index, ratio).join(",")).join(" ");

/**
 * Gráfico de radar dos seis atributos. Aceita um ou dois conjuntos de
 * atributos, por isso é reutilizado no dossiê e na comparação.
 */
export default function StatRadar({ series, label }) {
  return (
    <svg
      className="stat-radar"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
    >
      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon
          key={ratio}
          className="radar-grid"
          points={polygon(statDefinitions.map(() => ratio))}
        />
      ))}
      {statDefinitions.map((stat, index) => {
        const [x, y] = point(index, 1);
        const [labelX, labelY] = point(index, 1.24);
        return (
          <g key={stat.key}>
            <line
              className="radar-axis"
              x1={center}
              y1={center}
              x2={x}
              y2={y}
            />
            <text
              className="radar-label"
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {stat.shortLabel}
            </text>
          </g>
        );
      })}
      {series.map(({ stats, color }, index) => (
        <polygon
          key={index}
          className="radar-shape"
          style={{ "--radar": color }}
          points={polygon(
            statDefinitions.map(({ key }) =>
              Number.isFinite(stats?.[key]) ? Math.max(stats[key], 4) / 100 : 0,
            ),
          )}
        />
      ))}
    </svg>
  );
}
