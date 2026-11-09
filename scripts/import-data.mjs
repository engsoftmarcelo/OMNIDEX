/** OMNIDEX data adaptation. Reads JSON literals; never evaluates reference code. */
import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { adaptStats } from "../src/utils/catalog.js";

const sha = "8d9c4cad125a812d41c6322a1b133217a75d7f7a";
const repository = "https://github.com/PRABHMANNAT/Ben-10-Omnitrix-Database";
const referenceRoot = `${repository}/blob/${sha}`;
const text = await fs.readFile(".source-reference/src_data_aliens.js", "utf8");
const aliens = JSON.parse(
  text.slice(text.indexOf("["), text.lastIndexOf("]") + 1),
);
const artwork = JSON.parse(
  await fs.readFile(".source-reference/src_data_artwork.json", "utf8"),
);
const galleries = JSON.parse(
  await fs.readFile(".source-reference/src_data_galleries.json", "utf8"),
);
const sources = JSON.parse(
  await fs.readFile(".source-reference/public_aliens_sources.json", "utf8"),
);
if (aliens.length !== 72 || new Set(aliens.map((a) => a.id)).size !== 72)
  throw new Error(
    "The checked source roster has changed. Audit before importing.",
  );

// Only localized names directly confirmed in the consulted wiki pages are used.
// Other entries retain their original names rather than guessed Brazilian names.
const localized = {
  1: ["Chama", "https://ben10.fandom.com/pt-br/wiki/Chama_(Original)"],
  2: ["Besta", "https://ben10.fandom.com/pt-br/wiki/Besta"],
  3: ["Diamante", "https://ben10.fandom.com/wiki/Diamondhead_(Classic)"],
  5: [
    "Massa Cinzenta",
    "https://ben10.fandom.com/pt-br/wiki/Massa_Cinzenta_(Original)",
  ],
  6: ["Quatro Braços", "https://ben10.fandom.com/wiki/Four_Arms_(Classic)"],
  7: [
    "Insectóide",
    "https://ben10.fandom.com/pt-br/wiki/Insectóide_(Original)",
  ],
  8: ["Aquático", "https://ben10.fandom.com/pt-br/wiki/Aquático"],
  9: ["Ultra T", "https://ben10.fandom.com/pt-br/wiki/Ultra_T_(Original)"],
  10: ["Fantasmático", "https://ben10.fandom.com/pt-br/wiki/Fantasmático"],
  13: ["Blitzwolfer", "https://ben10.fandom.com/wiki/Blitzwolfer"],
  52: ["Rath Supremo", "https://ben10.fandom.com/wiki/Ultimate_Rath"],
  69: ["Portaler", "https://ben10.fandom.com/wiki/Portaler"],
  70: ["Areal", "https://ben10.fandom.com/wiki/Sandbox_(Thomas_Perkins)"],
  71: ["Cobra", "https://ben10.fandom.com/wiki/Snakepit_(Thomas_Perkins)"],
};
const aliases = {
  9: ["Ultra-T"],
  13: ["Benwolf", "Lobisben"],
  14: ["Snare-Oh"],
  33: ["Ampfibian"],
  38: ["Chamalien"],
  40: ["Juryrigg"],
  41: ["Waterhazard"],
  67: ["Kickin’ Hawk", "Kickin' Hawk"],
};
const classes = {
  Elemental: "Elemental",
  Tank: "Resistência",
  Speed: "Velocidade",
  Tech: "Tecnologia",
  Powerhouse: "Força",
  Support: "Suporte",
  Psychic: "Mental",
  "Cosmic Entity": "Cósmico",
  Stealth: "Furtividade",
};
const categoryTags = {
  Fogo: ["FIRE"],
  Eletricidade: ["ELECTRIC"],
  Energia: ["ENERGY", "BEAMS", "NUCLEAR", "RADIATION"],
  Gelo: ["ICE"],
  Água: ["AQUATIC", "WATER", "SWIMMER"],
  Vegetação: ["PLANT"],
  Voo: ["FLIGHT"],
  Som: ["SONIC"],
  Metamorfose: ["SHAPESHIFTER", "CLONE"],
  Tecnologia: ["TECH", "GENIUS"],
  Velocidade: ["FAST", "SPEED"],
  Cósmico: ["COSMIC", "REALITY WARP", "TIME", "GRAVITY", "PORTAL"],
  Mental: ["PSYCHIC", "FEAR", "SLEEP"],
  Química: ["ACID", "CHEMICAL"],
};
// Fresh Portuguese summaries of the factual themes, not copies of source prose.
const descriptions = [
  "Corpo de plasma protegido por placas rochosas. Produz e absorve calor e usa suas chamas para se deslocar.",
  "Transformação de aspecto canino que percebe o ambiente pelos sentidos aguçados e pela ecolocalização.",
  "Seu corpo cristalino permite formar projéteis, armas e barreiras, além de recuperar partes danificadas.",
  "Transformação especializada em velocidade, reflexos e deslocamento rápido com rodas nos pés.",
  "Pequena transformação de grande capacidade analítica, útil para compreender mecanismos e acessar espaços estreitos.",
  "Possui quatro braços e grande força física, com golpes de impacto e saltos potentes.",
  "Inseto alado que combina voo, visão ampla e projeção de substâncias pegajosas.",
  "Adaptado ao ambiente aquático, combina natação, respiração subaquática e uma mandíbula poderosa.",
  "Forma tecnológica maleável capaz de se unir a máquinas e modificar seu funcionamento.",
  "Transformação fantasmagórica associada à intangibilidade, invisibilidade e possessão.",
  "Enrola o corpo em uma esfera blindada para se mover e atingir obstáculos por impacto.",
  "Corpo vegetal com vinhas extensíveis, regeneração e sementes explosivas.",
  "Transformação lupina que combina sentidos aguçados com um uivo de efeito sônico.",
  "Corpo formado por faixas que podem se alongar, separar e envolver outros corpos.",
  "Transformação de grande porte que combina força física com geração e condução de eletricidade.",
  "Ingere matéria e a converte em disparos energéticos, usando línguas extensíveis para alcançar objetos.",
  "Pode criar várias cópias de si. As cópias compartilham sensações, o que também traz vulnerabilidades.",
  "Seu corpo possui muitos olhos, usados para observar o entorno e projetar diferentes feixes de energia.",
  "Transformação de porte colossal associada à força física e a raios cósmicos.",
  "Combina características vegetais, regeneração e produção de fogo ligado a gases do próprio corpo.",
  "Cria cópias e ataques sonoros. Várias cópias podem combinar suas emissões em torno de um alvo.",
  "Transformação de aparência dinossáurica, com grande força e capacidade de aumentar o tamanho.",
  "Especialista em voo e deslocamento aquático, também capaz de projetar feixes de neurochoque.",
  "Forma alada que combina intangibilidade com sopro congelante e manipulação de gelo.",
  "Corpo cristalino que absorve energia e pode devolvê-la na forma de feixes.",
  "Transformação de aspecto crustáceo que combina raciocínio avançado e poderes elétricos.",
  "Combina agilidade de primata com produção de teias, escalada e cauda preênsil.",
  "Corpo gelatinoso e maleável, sustentado em terra por um projetor antigravitacional.",
  "Transformação associada à alteração da realidade. As decisões entre suas personalidades são uma limitação importante.",
  "Usa campos magnéticos para manipular metais e levitar objetos.",
  "Transformação diminuta, capaz de voar e acessar locais microscópicos, com ataques bioelétricos.",
  "Forma felina especializada em luta corporal, força e garras retráteis, com temperamento explosivo.",
  "Transformação semelhante a uma água-viva, associada à eletricidade, intangibilidade e leitura mental.",
  "Braços mecânicos de perfuração permitem escavar e produzir impactos no solo.",
  "Usa o próprio corpo para gerar correntes de ar e voar, protegido por uma carapaça.",
  "Forma energética radioativa normalmente contida em uma armadura protetora pesada.",
  "Transformação felina que combina corrida veloz, agilidade e força física.",
  "Especialista em camuflagem, infiltração e movimentação discreta.",
  "Ingere matéria e a transforma em ataques de energia, combinados com um corpo resistente.",
  "Possui impulso para desmontar mecanismos e grande habilidade para reconstruí-los rapidamente.",
  "Forma aquática blindada, capaz de projetar jatos de água e absorver umidade.",
  "Transformação de aparência mecânica cujos poderes estão associados à manipulação temporal.",
  "Combina características de um primata de grande porte com geração de eletricidade.",
  "Forma Ultimate de Swampfire, com corpo ampliado e ataques de fogo azul e sementes explosivas.",
  "Forma Ultimate de Echo Echo, que utiliza discos sonoros independentes para atacar e conter alvos.",
  "Forma Ultimate de Humungousaur, protegida por placas e equipada com ataques de projéteis.",
  "Forma Ultimate de Big Chill, associada a chamas geladas e intangibilidade.",
  "Forma Ultimate de Spidermonkey, maior e mais forte, com membros adicionais e projeção de teias.",
  "Forma Ultimate de Cannonbolt, com espinhos e proteção reforçada para ataques em esfera.",
  "Forma Ultimate de Way Big, de porte colossal e capacidades cósmicas ampliadas.",
  "Forma Ultimate de Wildmutt, com sentidos ampliados, cauda e capacidade de falar.",
  "Forma Ultimate de Rath, vista em Omniverse com Albedo. Possui capacidades físicas ampliadas.",
  "Absorve e redireciona energia por seus conectores, usando-a em ataques e deslocamentos.",
  "Manipula a gravidade e pode fazer objetos orbitarem ao redor do próprio corpo.",
  "Seu corpo segmentado pode se reorganizar em estruturas, barreiras e ferramentas.",
  "Usa saltos potentes e uma cabeça resistente para produzir impactos.",
  "Pequena transformação que cria esferas de plasma capazes de incorporar materiais e explodir.",
  "Pequeno peixe com pernas e corpo escorregadio, adaptado à água e à passagem por espaços estreitos.",
  "Forma diminuta e alada que induz sono e interage com sonhos.",
  "Seu bigode funciona como um conjunto de membros preênseis e pode assumir diferentes formas.",
  "Transformação extremamente resistente, mas que continua sentindo a dor dos impactos recebidos.",
  "Produz compostos gasosos e combina substâncias para diferentes efeitos químicos.",
  "Forma vampírica associada à hipnose, absorção de energia e controle por corrupturas.",
  "Transformação associada à energia nuclear, com voo e projeções energéticas.",
  "Transformação alada de aspecto reptiliano que usa propulsão e chicotes de energia.",
  "Forma anfíbia que combina saltos, língua extensível e força, útil também para infiltração.",
  "Especialista em combate corporal com chutes, garras retráteis e lâminas nas asas.",
  "Mantém o rosto oculto em uma proteção. Sua exposição pode provocar medo intenso em quem o vê.",
  "Transformação do jogo Fuel Run. Cria portais e assume forma esférica; não integra o cânone das séries clássicas.",
  "Conceito não canônico de Thomas N. Perkins IV: corpo arenoso que muda de forma e produz tempestades de areia.",
  "Conceito não canônico de Thomas N. Perkins IV: três cabeças com raios capazes de petrificar temporariamente os alvos.",
  "Corpo inflável que projeta uma substância viscosa sob pressão.",
];
// The reference's 70 *.png cover paths actually contain WebP bytes. Normalize
// local extensions so static servers send the correct MIME type. Preserve the
// reference path in provenance; the remote file association is never guessed.
const normalizedCovers = {};
for (const [id, src] of Object.entries(artwork)) {
  const originalPath = path.join("public/images", src);
  const normalizedPath = src.replace(/\.png$/, ".webp");
  let bytes;
  try {
    bytes = await fs.readFile(originalPath);
  } catch {
    bytes = await fs.readFile(path.join("public/images", normalizedPath));
  }
  const isWebP =
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  normalizedCovers[id] = isWebP ? normalizedPath : src;
  if (src !== normalizedCovers[id]) {
    await fs.writeFile(path.join("public/images", normalizedCovers[id]), bytes);
    await fs.unlink(originalPath).catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
  }
}
const localImage = (src) => `/images${src}`;
const licenseNote =
  "Arte de terceiros; licença específica de reutilização não confirmada. Crédito não equivale a autorização.";
const imported = [];
for (const alien of aliens) {
  const source = sources[alien.id],
    gallery = galleries[alien.id];
  if (
    !source ||
    source.name !== alien.name ||
    !gallery ||
    gallery.name !== alien.name ||
    !artwork[alien.id]
  )
    throw new Error(`ID/name association mismatch: ${alien.id}`);
  let categories = [
    ...new Set([
      classes[alien.classification] || "Não informado",
      ...Object.entries(categoryTags)
        .filter(([, tags]) => tags.some((tag) => alien.tags.includes(tag)))
        .map(([name]) => name),
    ]),
  ];
  const name = localized[alien.id]?.[0] || alien.name;
  let series = alien.series,
    powers = alien.abilities,
    weaknesses = alien.weaknesses;
  const notes = [
    "Dados descritivos consultados em referência de fãs; não equivalem a uma auditoria completa dos episódios.",
  ];
  if (!localized[alien.id])
    notes.push(
      "Nome original preservado; nome brasileiro não confirmado nesta importação.",
    );
  if (alien.id === 52) {
    series = ["Omniverse"];
    notes.push(
      "Série corrigida para Omniverse pela página de Ultimate Rath. A transformação é usada por Albedo; não se atribui uma seleção canônica de operador.",
    );
  }
  if (alien.id === 69) {
    series = ["Não informado"];
    powers = ["Criação de portais", "Transformação esférica"];
    weaknesses = ["Não informado"];
    categories = ["Suporte", "Cósmico"];
    notes.push(
      "Exclusivo do jogo Fuel Run, não canônico à continuidade clássica. A série Omniverse indicada na base refere-se à marca do jogo, não a uma aparição na série.",
    );
  }
  if (alien.id === 70) {
    series = ["Não informado"];
    powers = ["Criação de tempestades de areia", "Mudança de forma"];
    weaknesses = ["Não informado"];
    notes.push(
      "Este registro representa o conceito de Thomas N. Perkins IV, não o alien apenas mencionado no episódio Ken 10. Alegações de participação em Omniverse não foram mantidas.",
    );
  }
  if (alien.id === 71) {
    series = ["Não informado"];
    powers = [
      "Petrificação temporária por raios oculares",
      "Imunidade à própria petrificação",
    ];
    weaknesses = [
      "Cabeças amarradas podem limitar a ação",
      "Raios não petrificam por reflexos",
    ];
    categories = ["Mental", "Suporte"];
    notes.push(
      "Este registro representa o conceito de Thomas N. Perkins IV, não o alien apenas mencionado no episódio Ken 10. Poderes do conceito foram corrigidos pela fonte específica; projeção de cobras não foi confirmada.",
    );
  }
  if (alien.id === 13) {
    weaknesses = weaknesses.filter((w) => !w.toLowerCase().includes("silver"));
    notes.push(
      "Prata, associada ao folclore na base, não foi mantida como fraqueza confirmada.",
    );
  }
  if (alien.id === 1) {
    powers = powers.filter((p) => p !== "Lava Projection");
    notes.push(
      "Projeção de lava não mantida: a página brasileira consultada registra que Chama não manipula magma.",
    );
  }
  const unknown = (value) =>
    !value || /^(Unknown|Unspecified|N\/A)$/i.test(value)
      ? "Não informado"
      : value;
  const record = {
    id: alien.id,
    slug: alien.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, ""),
    name,
    originalName: alien.name,
    aliases: [...new Set([alien.name, name, ...(aliases[alien.id] || [])])],
    species: unknown(alien.species),
    planet: unknown(alien.homeworld),
    series,
    categories,
    powers: powers.length ? powers : ["Não informado"],
    description: descriptions[alien.id - 1] || "Não informado",
    weaknesses: weaknesses.length ? weaknesses : ["Não informado"],
    image: localImage(normalizedCovers[alien.id]),
    gallery: gallery.images.map((image) => ({
      src: localImage(image.src),
      sourceUrl: image.sourceFile || image.sourcePage,
      label: image.caption || "Imagem da transformação",
      aiEnhanced: Boolean(image.enhanced),
      sourcePage: image.sourcePage,
      originalUrl: image.originalUrl,
      credit: image.credit,
      width: image.width,
      height: image.height,
      sha256: image.sha256,
      kind: image.kind,
      series: image.series || "Não informado",
    })),
    stats: adaptStats(alien.stats),
    sourceStats: alien.stats,
    sourceSeries: alien.series,
    sources: [
      `${referenceRoot}/src/data/aliens.js`,
      source.page,
      ...(localized[alien.id] ? [localized[alien.id][1]] : []),
    ].filter((v, i, a) => a.indexOf(v) === i),
    imageSources: [
      {
        url: source.page,
        label: source.credit || "Ben 10 Wiki · Cartoon Network / Man of Action",
        licenseNote,
        originalUrl: source.image,
        repositoryFile: `${referenceRoot}/public${artwork[alien.id]}`,
      },
    ],
    canonStatus:
      alien.id >= 70 && alien.id <= 71
        ? "Conceito não canônico"
        : alien.id === 69
          ? "Jogo · não canônico às séries"
          : "Continuidade clássica",
    aiEnhanced: Boolean(source.enhanced),
    form: alien.name.startsWith("Ultimate ") ? "Ultimate" : "Regular",
    notes,
  };
  imported.push(record);
}
await fs.mkdir("src/data", { recursive: true });
await fs.writeFile(
  "src/data/pokedex-data.json",
  JSON.stringify(imported, null, 2) + "\n",
);
// Original provenance is preserved independently from the adapted application data.
await fs.writeFile(
  "public/images/source-manifest.json",
  JSON.stringify(
    { repository, snapshot: sha, covers: sources, galleries },
    null,
    2,
  ) + "\n",
);
const entries = imported.flatMap((a) => [
  { src: a.image, alienId: a.id, kind: "cover" },
  ...a.gallery.map((g) => ({ ...g, alienId: a.id, kind: "gallery" })),
]);
const unique = [...new Map(entries.map((x) => [x.src, x])).values()];
for (const item of unique) {
  const bytes = await fs.readFile(path.join("public", item.src));
  if (
    item.sha256 &&
    crypto.createHash("sha256").update(bytes).digest("hex") !== item.sha256
  )
    throw new Error(`SHA-256 mismatch: ${item.src}`);
  if (!bytes.length) throw new Error(`Empty image: ${item.src}`);
}
const report = {
  verifiedDate: "2026-11-09",
  snapshot: sha,
  records: imported.length,
  coverAssociations: 72,
  galleryAssociations: 560,
  uniqueImageFiles: unique.length,
  aiEnhancedGalleryImages: imported
    .flatMap((a) => a.gallery)
    .filter((g) => g.aiEnhanced).length,
  coverNameIdAssociationsVerified: true,
  galleryHashesVerified: 560,
  localizedNames: localized,
  unconfirmedImageLicenses: true,
};
await fs.mkdir("docs", { recursive: true });
await fs.writeFile(
  "docs/data-audit.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
