/** Regras de quando a abertura (queda do meteoro) deve aparecer. */

export const introKey = "omnidex:intro:v1";

/** Tempos da sequência, em milissegundos a partir do clique em iniciar. */
export const introTimeline = [
  [0, "fall"],
  [1700, "impact"],
  [2900, "open"],
  [4500, "boot"],
];
export const introDuration = 5500;

/**
 * A abertura aparece uma vez por sessão do navegador.
 *  - ?intro=1 força a exibição e ?intro=0 a suprime (útil para apresentar).
 *  - "Reduzir movimento" suprime: a página abre direto.
 *  - Navegadores controlados por automação (testes) também abrem direto,
 *    a menos que peçam a abertura com ?intro=1.
 */
export function shouldShowIntro({
  search = "",
  reducedMotion = false,
  automated = false,
  seen = false,
} = {}) {
  const param = new URLSearchParams(search).get("intro");
  if (param === "0") return false;
  if (reducedMotion) return false;
  if (param === "1") return true;
  if (automated || seen) return false;
  return true;
}

export function readIntroSeen() {
  try {
    return globalThis.sessionStorage?.getItem(introKey) === "done";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    globalThis.sessionStorage?.setItem(introKey, "done");
  } catch {
    // Sem armazenamento, a abertura apenas volta a aparecer.
  }
}
