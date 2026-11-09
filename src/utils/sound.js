/**
 * Motor sonoro do OMNIDEX.
 *
 * Giro e transformação usam dois MP3 locais identificados na fonte como
 * Omnitrix clássico. A origem e os limites de autenticação estão em
 * public/audio/sources.json. Os demais sinais de interface usam Web Audio.
 * Nada toca automaticamente ao abrir a página. Falhas de áudio não impedem
 * usar o catálogo e silenciar interrompe também efeitos já em reprodução.
 */

const storageKey = "omnidex:sound:v1";

let context = null;
let master = null;
let noiseBuffer = null;
let muted = readMuted();
let lastTick = 0;
const players = new Map();
const activeNodes = new Map();
let currentEffect = null;

// Caminhos efetivamente conferidos, sem hotlink ou dependência de soundboards.
export const sampleSources = {
  dial: { src: "/audio/omnitrix-classic-select.mp3", volume: 0.42 },
  select: { src: "/audio/omnitrix-classic-select.mp3", volume: 0.42 },
  transform: { src: "/audio/omnitrix-classic-transform.mp3", volume: 0.48 },
};

/** Interrompe um efeito específico ou todos, incluindo notas agendadas. */
export function stopSound(name) {
  const src = sampleSources[name]?.src;
  for (const [url, player] of players) {
    if (name && url !== src) continue;
    try {
      player.pause();
      player.currentTime = 0;
    } catch {
      /* Mídia opcional. */
    }
  }
  for (const [node, effectName] of activeNodes) {
    if (name && effectName !== name) continue;
    try {
      node.stop();
    } catch {
      /* Nó já encerrado. */
    }
    activeNodes.delete(node);
  }
}

function playSample(name) {
  const sample = sampleSources[name];
  if (!sample || !globalThis.Audio) return false;
  try {
    let player = players.get(sample.src);
    if (!player) {
      player = new globalThis.Audio(sample.src);
      player.preload = "none";
      players.set(sample.src, player);
    }
    // A mesma amostra reinicia ao girar rápido; não cria camadas de ruído.
    player.pause();
    player.currentTime = 0;
    player.volume = sample.volume;
    player.play()?.catch(() => {});
    return true;
  } catch {
    return false;
  }
}

function readMuted() {
  try {
    return globalThis.localStorage?.getItem(storageKey) === "off";
  } catch {
    return false;
  }
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = Boolean(value);
  if (muted) stopSound();
  if (master && context) {
    const now = context.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(muted ? 0 : 0.55, now, 0.008);
  }
  try {
    globalThis.localStorage?.setItem(storageKey, muted ? "off" : "on");
  } catch {
    // Preferência vale apenas para esta sessão.
  }
}

function getContext() {
  if (muted) return null;
  const AudioContextClass =
    globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContextClass) return null;
  // Sem gesto do usuário o navegador bloquearia (e avisaria no console).
  const activation = globalThis.navigator?.userActivation;
  if (!context && activation && !activation.hasBeenActive) return null;
  try {
    if (!context) {
      context = new AudioContextClass();
      const compressor = context.createDynamicsCompressor();
      master = context.createGain();
      master.gain.value = 0.55;
      master.connect(compressor);
      compressor.connect(context.destination);
    }
    if (context.state === "suspended") context.resume().catch(() => {});
    return context;
  } catch {
    return null;
  }
}

function getNoise(ctx) {
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1)
      data[index] = Math.random() * 2 - 1;
  }
  return noiseBuffer;
}

/** Uma nota: oscilador com envelope e deslize opcional de frequência. */
function tone(
  ctx,
  { type = "sine", from, to = from, start = 0, length = 0.12, gain = 0.2 },
) {
  const time = ctx.currentTime + start;
  const oscillator = ctx.createOscillator();
  const envelope = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, time);
  if (to !== from)
    oscillator.frequency.exponentialRampToValueAtTime(to, time + length);
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(gain, time + 0.012);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);
  oscillator.connect(envelope);
  envelope.connect(master);
  oscillator.start(time);
  oscillator.stop(time + length + 0.03);
  activeNodes.set(oscillator, currentEffect);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
    activeNodes.delete(oscillator);
  };
}

/** Ruído filtrado: usado para sopros, cliques e a "descarga" de energia. */
function noise(
  ctx,
  { start = 0, length = 0.2, gain = 0.2, from = 800, to = from, q = 1 },
) {
  const time = ctx.currentTime + start;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const envelope = ctx.createGain();
  source.buffer = getNoise(ctx);
  filter.type = "bandpass";
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, time);
  if (to !== from)
    filter.frequency.exponentialRampToValueAtTime(to, time + length);
  envelope.gain.setValueAtTime(0.0001, time);
  envelope.gain.exponentialRampToValueAtTime(gain, time + length * 0.35);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + length);
  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(master);
  source.start(time);
  source.stop(time + length + 0.03);
  activeNodes.set(source, currentEffect);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    envelope.disconnect();
    activeNodes.delete(source);
  };
}

const effects = {
  /** Passar o cursor por um card: quase imperceptível. */
  hover(ctx) {
    tone(ctx, { from: 2400, to: 1900, length: 0.035, gain: 0.025 });
  },
  /** Digitar ou mudar um filtro. */
  tick(ctx) {
    tone(ctx, { type: "square", from: 1500, length: 0.025, gain: 0.03 });
  },
  /** Girar o mostrador do Omnitrix. */
  dial(ctx) {
    noise(ctx, { length: 0.05, gain: 0.25, from: 3200, q: 4 });
    tone(ctx, { type: "square", from: 740, to: 520, length: 0.07, gain: 0.07 });
    tone(ctx, { from: 1480, start: 0.05, length: 0.06, gain: 0.06 });
  },
  /** Escolher um alienígena pelo card. */
  select(ctx) {
    tone(ctx, {
      type: "triangle",
      from: 620,
      to: 930,
      length: 0.09,
      gain: 0.14,
    });
    tone(ctx, { from: 1860, start: 0.06, length: 0.1, gain: 0.05 });
  },
  /** A transformação: carga crescente, descarga e acorde brilhante. */
  transform(ctx) {
    tone(ctx, {
      type: "sawtooth",
      from: 90,
      to: 1500,
      length: 0.5,
      gain: 0.13,
    });
    tone(ctx, { type: "square", from: 180, to: 3000, length: 0.5, gain: 0.04 });
    noise(ctx, { length: 0.55, gain: 0.2, from: 300, to: 7000, q: 0.8 });
    tone(ctx, { from: 160, to: 38, start: 0.48, length: 0.5, gain: 0.5 });
    noise(ctx, { start: 0.48, length: 0.6, gain: 0.3, from: 5000, to: 400 });
    [659.25, 987.77, 1318.5, 1975.5].forEach((frequency, index) =>
      tone(ctx, {
        type: "triangle",
        from: frequency,
        start: 0.5 + index * 0.035,
        length: 0.9,
        gain: 0.1,
      }),
    );
  },
  /** Abrir e fechar um dossiê. */
  open(ctx) {
    noise(ctx, { length: 0.22, gain: 0.09, from: 500, to: 3600, q: 1.5 });
    tone(ctx, { from: 520, to: 780, length: 0.1, gain: 0.1 });
    tone(ctx, { from: 1040, start: 0.09, length: 0.14, gain: 0.08 });
  },
  close(ctx) {
    tone(ctx, { from: 880, to: 620, length: 0.09, gain: 0.09 });
    tone(ctx, { from: 520, to: 330, start: 0.07, length: 0.13, gain: 0.08 });
  },
  /** Favoritar: arpejo ascendente; desfavoritar: descendente. */
  favoriteOn(ctx) {
    [1046.5, 1318.5, 1568, 2093].forEach((frequency, index) =>
      tone(ctx, {
        type: "triangle",
        from: frequency,
        start: index * 0.055,
        length: 0.22,
        gain: 0.1,
      }),
    );
  },
  favoriteOff(ctx) {
    [1318.5, 987.77].forEach((frequency, index) =>
      tone(ctx, {
        type: "triangle",
        from: frequency,
        start: index * 0.07,
        length: 0.14,
        gain: 0.08,
      }),
    );
  },
  /** Adicionar/remover da seleção ou da comparação. */
  add(ctx) {
    tone(ctx, { type: "square", from: 440, length: 0.06, gain: 0.06 });
    tone(ctx, {
      type: "square",
      from: 880,
      start: 0.06,
      length: 0.1,
      gain: 0.06,
    });
  },
  remove(ctx) {
    tone(ctx, { type: "square", from: 660, length: 0.06, gain: 0.06 });
    tone(ctx, {
      type: "square",
      from: 330,
      start: 0.06,
      length: 0.1,
      gain: 0.06,
    });
  },
  /** O clássico aviso de "sem carga" do relógio. */
  error(ctx) {
    [0, 0.16, 0.32].forEach((start) =>
      tone(ctx, {
        type: "sawtooth",
        from: 170,
        to: 110,
        start,
        length: 0.11,
        gain: 0.16,
      }),
    );
  },
  /** Sorteio: blips embaralhados e uma confirmação. */
  random(ctx) {
    for (let index = 0; index < 7; index += 1)
      tone(ctx, {
        type: "square",
        from: 500 + Math.random() * 1500,
        start: index * 0.045,
        length: 0.04,
        gain: 0.055,
      });
    tone(ctx, {
      type: "triangle",
      from: 1318.5,
      start: 0.34,
      length: 0.25,
      gain: 0.13,
    });
    tone(ctx, {
      type: "triangle",
      from: 1975.5,
      start: 0.4,
      length: 0.3,
      gain: 0.08,
    });
  },
  /** Arena de comparação. */
  versus(ctx) {
    tone(ctx, { from: 140, to: 50, length: 0.3, gain: 0.45 });
    noise(ctx, { length: 0.25, gain: 0.22, from: 2500, to: 300 });
    tone(ctx, { from: 140, to: 50, start: 0.22, length: 0.3, gain: 0.45 });
    noise(ctx, { start: 0.22, length: 0.25, gain: 0.22, from: 2500, to: 300 });
    tone(ctx, {
      type: "sawtooth",
      from: 220,
      to: 880,
      start: 0.42,
      length: 0.35,
      gain: 0.08,
    });
    tone(ctx, {
      type: "triangle",
      from: 1318.5,
      start: 0.75,
      length: 0.5,
      gain: 0.11,
    });
  },
  /** Trocar de aba, tema ou religar o som. */
  toggle(ctx) {
    tone(ctx, { from: 700, to: 1050, length: 0.08, gain: 0.09 });
  },
  nav(ctx) {
    noise(ctx, { length: 0.16, gain: 0.07, from: 900, to: 2800, q: 2 });
    tone(ctx, { from: 587.33, length: 0.07, gain: 0.07 });
    tone(ctx, { from: 880, start: 0.06, length: 0.1, gain: 0.07 });
  },
};

export const soundNames = Object.keys(effects);

/** Toca um efeito pelo nome. Nunca lança erro. */
export function playSound(name) {
  if (muted) return;
  const effect = effects[name];
  if (!effect) return;
  if (playSample(name)) return;
  if (name === "hover" || name === "tick") {
    // Evita rajadas ao varrer a grade com o cursor ou digitar depressa.
    const now = Date.now();
    if (now - lastTick < 55) return;
    lastTick = now;
  }
  const ctx = getContext();
  if (!ctx) return;
  try {
    currentEffect = name;
    effect(ctx);
  } catch {
    // Áudio indisponível: a interface segue normalmente.
  } finally {
    currentEffect = null;
  }
}
