import test from "node:test";
import assert from "node:assert/strict";
import { readStoredIds, writeStoredIds } from "../src/utils/storage.js";

test("favoritos e seleções sobrevivem a uma nova leitura e respeitam IDs válidos", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const memory = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => memory.set(key, value),
    },
  });
  try {
    assert.equal(writeStoredIds("favorites", [1, 2]), true);
    assert.deepEqual(readStoredIds("favorites", [1, 2, 3]), [1, 2]);
    assert.deepEqual(readStoredIds("favorites", [2, 3]), [2]);
    assert.equal(writeStoredIds("selection", [3, 2, 1]), true);
    assert.deepEqual(readStoredIds("selection", [1, 2, 3], 2), [3, 2]);
    assert.deepEqual(readStoredIds("unknown", [1, 2]), []);
    memory.set("broken", "{invalid json");
    assert.deepEqual(readStoredIds("broken", [1, 2]), []);
    memory.set("object", '{"id":1}');
    assert.deepEqual(readStoredIds("object", [1, 2]), []);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});

test("armazenamento bloqueado ou indisponível não derruba o aplicativo", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get: () => {
      throw new Error("SecurityError");
    },
  });
  try {
    assert.deepEqual(readStoredIds("favorites", [1, 2]), []);
    assert.equal(writeStoredIds("favorites", [1]), false);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: undefined,
    });
    assert.deepEqual(readStoredIds("favorites", [1, 2]), []);
    assert.equal(writeStoredIds("favorites", [1]), false);
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  }
});
