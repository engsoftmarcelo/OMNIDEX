import test from "node:test";
import assert from "node:assert/strict";
import {
  introDuration,
  introTimeline,
  shouldShowIntro,
} from "../src/utils/intro.js";

test("abertura aparece na primeira visita da sessão", () => {
  assert.equal(shouldShowIntro(), true);
  assert.equal(shouldShowIntro({ seen: true }), false);
});

test("movimento reduzido e automação abrem a página direto", () => {
  assert.equal(shouldShowIntro({ reducedMotion: true }), false);
  assert.equal(shouldShowIntro({ automated: true }), false);
  assert.equal(
    shouldShowIntro({ reducedMotion: true, search: "?intro=1" }),
    false,
  );
});

test("parâmetro intro força ou suprime a abertura", () => {
  assert.equal(shouldShowIntro({ search: "?intro=1", seen: true }), true);
  assert.equal(shouldShowIntro({ search: "?intro=1", automated: true }), true);
  assert.equal(shouldShowIntro({ search: "?intro=0" }), false);
});

test("as fases da abertura estão em ordem e cabem na duração", () => {
  const delays = introTimeline.map(([delay]) => delay);
  assert.deepEqual(
    delays,
    [...delays].sort((a, b) => a - b),
  );
  assert.deepEqual(
    introTimeline.map(([, phase]) => phase),
    ["fall", "impact", "open", "boot"],
  );
  assert.ok(delays.at(-1) < introDuration);
});
