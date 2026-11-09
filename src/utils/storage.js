import { sanitizeIds } from "./catalog.js";

/** Armazenamento é opcional: o catálogo continua funcionando sem ele. */
export function readStoredIds(key, validIds, max = Infinity) {
  try {
    const stored = globalThis.localStorage?.getItem(key);
    return sanitizeIds(stored ? JSON.parse(stored) : [], validIds, max);
  } catch {
    // JSON corrompido, modo privado ou acesso negado não impedem a navegação.
    return [];
  }
}

/** O retorno permite avisar o usuário quando a persistência estiver bloqueada. */
export function writeStoredIds(key, ids) {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(key, JSON.stringify(ids));
    return true;
  } catch {
    return false;
  }
}
