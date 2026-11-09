import { useEffect, useRef } from "react";
import { statDefinitions } from "../utils/catalog.js";
import { accentFor, powerTotal } from "../utils/theme.js";
import Icon from "./Icon.jsx";
import StatRadar from "./StatRadar.jsx";

const formatId = (id) => String(id).padStart(3, "0");
const scoreOf = (alien, key) =>
  Number.isFinite(alien.stats?.[key]) ? alien.stats[key] : null;

function Fighter({ alien, color, isWinner, side }) {
  return (
    <div
      className={`fighter fighter-${side} ${isWinner ? "is-winner" : ""}`}
      style={{ "--accent": color }}
    >
      <div className="fighter-art">
        <img src={alien.image} alt={alien.name} width="220" height="220" />
      </div>
      <p className="fighter-id">DNA / {formatId(alien.id)}</p>
      <h3>{alien.name}</h3>
      <p className="fighter-total">
        <strong>{powerTotal(alien)}</strong> na soma acadêmica
      </p>
      {isWinner && (
        <span className="fighter-crown">
          <Icon name="bolt" size={13} /> Mais atributos
        </span>
      )}
    </div>
  );
}

/** Arena de DNA: compara dois registros atributo por atributo. */
export default function CompareDialog({ first, second, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
      else
        document
          .querySelector('#search, .main-nav button[aria-current="page"]')
          ?.focus();
    };
  }, []);

  const firstColor = accentFor(first);
  // Cores iguais não distinguiriam os lados no radar.
  const secondColor =
    accentFor(second) !== firstColor
      ? accentFor(second)
      : firstColor === "#4cc9ff"
        ? "#f5b942"
        : "#4cc9ff";

  const rows = statDefinitions.map(({ key, label }) => {
    const left = scoreOf(first, key);
    const right = scoreOf(second, key);
    return {
      key,
      label,
      left,
      right,
      winner:
        left === null || right === null || left === right
          ? "draw"
          : left > right
            ? "left"
            : "right",
    };
  });
  const leftWins = rows.filter((row) => row.winner === "left").length;
  const rightWins = rows.filter((row) => row.winner === "right").length;
  const comparableCount = rows.filter(
    (row) => row.left !== null && row.right !== null,
  ).length;
  const overall =
    leftWins === rightWins ? "draw" : leftWins > rightWins ? "left" : "right";
  const verdict =
    comparableCount === 0
      ? "Não há atributos completos suficientes para comparar."
      : overall === "draw"
        ? `Empate por atributos: ${leftWins} a ${rightWins}. A soma acadêmica é apresentada separadamente.`
        : `${(overall === "left" ? first : second).name} tem valor maior em ${Math.max(leftWins, rightWins)} de ${comparableCount} atributos comparáveis (${leftWins} a ${rightWins}).`;

  function handleDialogKeys(event) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0);
    const firstControl = controls[0];
    const lastControl = controls.at(-1);
    if (event.shiftKey && document.activeElement === firstControl) {
      event.preventDefault();
      lastControl?.focus();
    } else if (!event.shiftKey && document.activeElement === lastControl) {
      event.preventDefault();
      firstControl?.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="compare-dialog"
      aria-labelledby="compare-title"
      aria-describedby="compare-disclaimer"
      onKeyDown={handleDialogKeys}
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
      <div className="compare-inner">
        <button
          ref={closeRef}
          className="icon-button dialog-close"
          type="button"
          onClick={onClose}
          aria-label="Fechar comparação"
        >
          <Icon name="close" />
        </button>
        <p className="dialog-eyebrow">ARENA DE DNA · COMPARAÇÃO</p>
        <h2 id="compare-title">
          {first.name} <span>vs</span> {second.name}
        </h2>
        <div className="compare-legend" aria-label="Legenda da comparação">
          <span style={{ "--legend": firstColor }}>
            A · {first.name} · linha contínua
          </span>
          <span style={{ "--legend": secondColor }}>
            B · {second.name} · linha tracejada
          </span>
        </div>
        <div className="compare-stage">
          <Fighter
            alien={first}
            color={firstColor}
            isWinner={overall === "left"}
            side="left"
          />
          <div className="compare-center">
            <span className="versus-mark" aria-hidden="true">
              VS
            </span>
            <StatRadar
              label={`Radar comparando os atributos de ${first.name} e ${second.name}`}
              series={[
                { stats: first.stats, color: firstColor },
                { stats: second.stats, color: secondColor },
              ]}
            />
          </div>
          <Fighter
            alien={second}
            color={secondColor}
            isWinner={overall === "right"}
            side="right"
          />
        </div>
        <ul className="compare-rows">
          {rows.map((row, index) => (
            <li
              className={`compare-row winner-${row.winner}`}
              key={row.key}
              style={{ "--i": index }}
            >
              <strong className="compare-value">{row.left ?? "—"}</strong>
              <span className="compare-bar compare-bar-left" aria-hidden="true">
                <span
                  style={{ width: `${row.left ?? 0}%`, "--accent": firstColor }}
                />
              </span>
              <span className="compare-label">
                {row.label}
                <small className="compare-row-result">
                  {row.left === null || row.right === null
                    ? "Dados ausentes"
                    : row.winner === "draw"
                      ? "Empate"
                      : row.winner === "left"
                        ? "A maior"
                        : "B maior"}
                </small>
              </span>
              <span className="compare-bar" aria-hidden="true">
                <span
                  style={{
                    width: `${row.right ?? 0}%`,
                    "--accent": secondColor,
                  }}
                />
              </span>
              <strong className="compare-value">{row.right ?? "—"}</strong>
            </li>
          ))}
        </ul>
        <p className="compare-verdict" role="status">
          <Icon name="bolt" size={16} /> {verdict}
        </p>
        <p className="compare-note" id="compare-disclaimer">
          Comparação baseada nos atributos adaptados para fins acadêmicos; não é
          um resultado oficial de Ben 10. A contagem de valores maiores e a soma
          dos seis atributos são convenções separadas, sem simular um combate.
        </p>
      </div>
    </dialog>
  );
}
