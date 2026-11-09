import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

let moduleVersion = 0;
const soundModule = () =>
  import(`../src/utils/sound.js?audio-test=${moduleVersion++}`);

async function withAudioEnvironment(options, run) {
  const players = [];
  const contexts = [];
  const gains = [];
  const sources = [];
  const storage = new Map(Object.entries(options.stored ?? {}));

  class AudioParamMock {
    value = 0;
    events = [];
    setValueAtTime(value, time) {
      this.value = value;
      this.events.push(["set", value, time]);
    }
    exponentialRampToValueAtTime(value, time) {
      this.value = value;
      this.events.push(["ramp", value, time]);
    }
    setTargetAtTime(value, time, constant) {
      this.value = value;
      this.events.push(["target", value, time, constant]);
    }
    cancelScheduledValues(time) {
      this.events.push(["cancel", time]);
    }
  }

  function node() {
    return {
      connections: [],
      disconnected: 0,
      connect(target) {
        this.connections.push(target);
      },
      disconnect() {
        this.disconnected += 1;
      },
    };
  }
  function sourceNode() {
    const source = {
      ...node(),
      frequency: new AudioParamMock(),
      starts: [],
      stops: [],
      start(time) {
        this.starts.push(time);
      },
      stop(time) {
        this.stops.push(time);
        if (time === undefined) this.onended?.();
      },
    };
    sources.push(source);
    return source;
  }

  class AudioMock {
    constructor(src) {
      this.src = src;
      this.paused = true;
      this.currentTime = 17;
      this.plays = 0;
      this.pauses = 0;
      players.push(this);
    }
    play() {
      this.plays += 1;
      this.paused = false;
      return options.rejectPlay
        ? Promise.reject(new Error("Playback blocked"))
        : Promise.resolve();
    }
    pause() {
      this.pauses += 1;
      this.paused = true;
    }
  }

  class AudioContextMock {
    constructor() {
      this.currentTime = 10;
      this.sampleRate = 8000;
      this.state = "running";
      this.destination = node();
      contexts.push(this);
    }
    createDynamicsCompressor() {
      return node();
    }
    createGain() {
      const gainNode = { ...node(), gain: new AudioParamMock() };
      gains.push(gainNode);
      return gainNode;
    }
    createOscillator() {
      return sourceNode();
    }
    createBufferSource() {
      return sourceNode();
    }
    createBiquadFilter() {
      return {
        ...node(),
        Q: new AudioParamMock(),
        frequency: new AudioParamMock(),
      };
    }
    createBuffer(channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    }
    resume() {
      this.state = "running";
      return Promise.resolve();
    }
  }

  const globals = {
    Audio: options.audio === false ? undefined : AudioMock,
    AudioContext: options.webAudio === false ? undefined : AudioContextMock,
    webkitAudioContext: undefined,
    navigator: {
      userActivation: { hasBeenActive: options.activated !== false },
    },
    localStorage: options.blockStorage
      ? {
          getItem() {
            throw new Error("Storage denied");
          },
          setItem() {
            throw new Error("Storage denied");
          },
        }
      : {
          getItem: (key) => storage.get(key) ?? null,
          setItem: (key, value) => storage.set(key, value),
        },
  };
  const originals = new Map(
    Object.keys(globals).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  }
  try {
    await run({ players, contexts, gains, sources, storage });
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test("áudio é inicializado sob demanda e as amostras apontam para arquivos locais existentes", async () => {
  await withAudioEnvironment({}, async ({ players, contexts }) => {
    const sound = await soundModule();
    assert.equal(players.length, 0);
    assert.equal(contexts.length, 0);
    assert.equal(sound.isMuted(), false);
    assert.equal(
      sound.sampleSources.dial.src,
      "/audio/omnitrix-classic-select.mp3",
    );
    assert.equal(sound.sampleSources.select.src, sound.sampleSources.dial.src);
    assert.equal(
      sound.sampleSources.transform.src,
      "/audio/omnitrix-classic-transform.mp3",
    );
    for (const { src, volume } of Object.values(sound.sampleSources)) {
      assert.ok(
        fs.statSync(new URL(`../public${src}`, import.meta.url)).size > 0,
      );
      assert.ok(volume > 0 && volume <= 1);
    }
    sound.playSound("inexistente");
    assert.equal(players.length, 0);
    assert.equal(contexts.length, 0);
  });
});

test("giro e seleção reutilizam a mesma amostra, sem sobrepor players", async () => {
  await withAudioEnvironment({}, async ({ players, contexts }) => {
    const sound = await soundModule();
    sound.playSound("dial");
    sound.playSound("select");
    sound.playSound("dial");
    assert.equal(players.length, 1);
    assert.equal(players[0].src, sound.sampleSources.dial.src);
    assert.equal(players[0].preload, "none");
    assert.equal(players[0].plays, 3);
    assert.equal(players[0].pauses, 3);
    assert.equal(players[0].currentTime, 0);
    assert.equal(contexts.length, 0);
  });
});

test("silenciar interrompe imediatamente MP3, notas agendadas e ganho; preferência persiste", async () => {
  await withAudioEnvironment(
    {},
    async ({ players, gains, sources, storage }) => {
      const sound = await soundModule();
      sound.playSound("transform");
      sound.playSound("versus");
      assert.ok(sources.length > 1);
      assert.equal(players[0].paused, false);
      const master = gains[0];
      assert.equal(master.gain.value, 0.55);
      sound.setMuted(true);
      assert.equal(sound.isMuted(), true);
      assert.equal(players[0].paused, true);
      assert.equal(players[0].currentTime, 0);
      assert.ok(sources.every((source) => source.stops.at(-1) === undefined));
      assert.ok(sources.every((source) => source.disconnected === 1));
      assert.equal(master.gain.value, 0);
      assert.equal(storage.get("omnidex:sound:v1"), "off");
      const playCount = players[0].plays;
      const sourceCount = sources.length;
      sound.playSound("transform");
      sound.playSound("versus");
      assert.equal(players[0].plays, playCount);
      assert.equal(sources.length, sourceCount);
      assert.equal((await soundModule()).isMuted(), true);
      sound.setMuted(false);
      assert.equal(master.gain.value, 0.55);
      assert.equal(storage.get("omnidex:sound:v1"), "on");
    },
  );
});

test("stopSound de transformação interrompe apenas a amostra pedida", async () => {
  await withAudioEnvironment({}, async ({ players }) => {
    const sound = await soundModule();
    sound.playSound("dial");
    sound.playSound("transform");
    const select = players.find(
      (player) => player.src === sound.sampleSources.select.src,
    );
    const transform = players.find(
      (player) => player.src === sound.sampleSources.transform.src,
    );
    sound.stopSound("transform");
    assert.equal(transform.paused, true);
    assert.equal(select.paused, false);
    sound.stopSound();
    assert.ok(players.every((player) => player.paused));
  });
});

test("Web Audio serve de alternativa sem HTMLAudio e cancelamento distingue efeitos", async () => {
  await withAudioEnvironment(
    { audio: false },
    async ({ contexts, sources }) => {
      const sound = await soundModule();
      sound.playSound("transform");
      const transformSources = [...sources];
      sound.playSound("open");
      const openSources = sources.slice(transformSources.length);
      assert.equal(contexts.length, 1);
      assert.ok(transformSources.length > 0 && openSources.length > 0);
      sound.stopSound("transform");
      assert.ok(
        transformSources.every((source) => source.stops.at(-1) === undefined),
      );
      assert.ok(
        openSources.every((source) => source.stops.at(-1) !== undefined),
      );
      sound.stopSound();
      assert.ok(
        openSources.every((source) => source.stops.at(-1) === undefined),
      );
    },
  );
});

test("sem gesto inicial nenhum contexto Web Audio é aberto", async () => {
  await withAudioEnvironment(
    { audio: false, activated: false },
    async ({ contexts, sources }) => {
      const sound = await soundModule();
      sound.playSound("open");
      assert.equal(contexts.length, 0);
      assert.equal(sources.length, 0);
    },
  );
});

test("ausência de suporte e armazenamento bloqueado não interrompem o catálogo", async () => {
  await withAudioEnvironment(
    { audio: false, webAudio: false, blockStorage: true },
    async () => {
      const sound = await soundModule();
      for (const name of sound.soundNames)
        assert.doesNotThrow(() => sound.playSound(name));
      assert.doesNotThrow(() => sound.stopSound());
      assert.doesNotThrow(() => sound.setMuted(true));
      assert.equal(sound.isMuted(), true);
      assert.doesNotThrow(() => sound.setMuted(false));
    },
  );
});

test("rejeição assíncrona de reprodução é tratada sem exceção", async () => {
  await withAudioEnvironment({ rejectPlay: true }, async ({ players }) => {
    const sound = await soundModule();
    assert.doesNotThrow(() => sound.playSound("transform"));
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(players.length, 1);
    assert.doesNotThrow(() => sound.stopSound("transform"));
  });
});
