import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adaptStats, statDefinitions } from "../src/utils/catalog.js";

// Verificação local e repetível. Não consulta a rede nem certifica direitos de uso.
const root = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(root, "public");
const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const aliens = readJson("src/data/pokedex-data.json");
const audit = readJson("docs/data-audit.json");
const manifest = readJson("public/images/source-manifest.json");
const checkedFiles = new Map();
const statKeys = statDefinitions.map(({ key }) => key);
let galleryAssociations = 0;
let checkedHashes = 0;
let aiEnhancedGalleryImages = 0;

function nonemptyString(value, context) {
  assert.equal(typeof value, "string", `${context}: deve ser texto`);
  assert.ok(value.trim(), `${context}: texto vazio`);
}

function httpUrl(value, context) {
  nonemptyString(value, context);
  const parsed = new URL(value);
  assert.ok(
    ["http:", "https:"].includes(parsed.protocol),
    `${context}: protocolo inválido`,
  );
  assert.ok(parsed.hostname, `${context}: endereço sem domínio`);
}

function textArray(value, context) {
  assert.ok(
    Array.isArray(value) && value.length,
    `${context}: deve ser uma lista não vazia`,
  );
  value.forEach((entry) => nonemptyString(entry, context));
}

/** Dimensões são lidas diretamente dos cabeçalhos, sem bibliotecas de imagem. */
function imageMetadata(buffer, context) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(pngSignature)) {
    assert.equal(
      buffer.toString("ascii", 12, 16),
      "IHDR",
      `${context}: PNG sem IHDR`,
    );
    return {
      format: "png",
      width: buffer.readUInt32BE(16),
      height: buffer.readUInt32BE(20),
    };
  }
  if (
    buffer.length >= 30 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    assert.equal(
      buffer.readUInt32LE(4) + 8,
      buffer.length,
      `${context}: tamanho RIFF divergente`,
    );
    for (let offset = 12; offset + 8 <= buffer.length;) {
      const type = buffer.toString("ascii", offset, offset + 4);
      const length = buffer.readUInt32LE(offset + 4);
      const data = offset + 8;
      assert.ok(
        data + length <= buffer.length,
        `${context}: chunk WebP incompleto`,
      );
      if (type === "VP8X" && length >= 10) {
        return {
          format: "webp",
          width: buffer.readUIntLE(data + 4, 3) + 1,
          height: buffer.readUIntLE(data + 7, 3) + 1,
        };
      }
      if (type === "VP8 " && length >= 10) {
        assert.equal(
          buffer.toString("hex", data + 3, data + 6),
          "9d012a",
          `${context}: quadro WebP inválido`,
        );
        return {
          format: "webp",
          width: buffer.readUInt16LE(data + 6) & 0x3fff,
          height: buffer.readUInt16LE(data + 8) & 0x3fff,
        };
      }
      if (type === "VP8L" && length >= 5) {
        assert.equal(
          buffer[data],
          0x2f,
          `${context}: quadro lossless inválido`,
        );
        const bits = buffer.readUInt32LE(data + 1);
        return {
          format: "webp",
          width: (bits & 0x3fff) + 1,
          height: ((bits >>> 14) & 0x3fff) + 1,
        };
      }
      offset = data + length + (length % 2);
    }
  }
  throw new Error(
    `${context}: assinatura visual desconhecida ou arquivo inválido`,
  );
}

function checkImage(src, context) {
  nonemptyString(src, context);
  assert.ok(
    src.startsWith("/images/"),
    `${context}: imagem deve ser local em /images/`,
  );
  const resolved = path.resolve(publicRoot, `.${src}`);
  assert.ok(
    resolved.startsWith(`${publicRoot}${path.sep}`),
    `${context}: caminho fora de public/`,
  );
  if (!checkedFiles.has(src)) {
    const bytes = fs.readFileSync(resolved);
    assert.ok(bytes.length, `${context}: imagem vazia`);
    const metadata = imageMetadata(bytes, context);
    assert.ok(
      metadata.width > 0 && metadata.height > 0,
      `${context}: dimensões inválidas`,
    );
    assert.equal(
      path.extname(src).slice(1).toLowerCase(),
      metadata.format,
      `${context}: extensão não corresponde à assinatura`,
    );
    checkedFiles.set(src, {
      ...metadata,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  return checkedFiles.get(src);
}

assert.ok(Array.isArray(aliens), "Dados devem ser um array");
assert.equal(aliens.length, 72, "A entrega inclui os 72 registros conferidos");
const ids = new Set(aliens.map(({ id }) => id));
assert.equal(ids.size, 72, "IDs devem ser únicos");
assert.deepEqual(
  [...ids].sort((a, b) => a - b),
  Array.from({ length: 72 }, (_, index) => index + 1),
);
assert.equal(
  new Set(aliens.map(({ slug }) => slug)).size,
  72,
  "Slugs devem ser únicos",
);
assert.equal(
  manifest.snapshot,
  audit.snapshot,
  "Snapshot do manifesto e auditoria deve coincidir",
);
assert.equal(
  Object.keys(manifest.covers).length,
  72,
  "Manifesto deve associar 72 capas",
);
assert.equal(
  Object.keys(manifest.galleries).length,
  72,
  "Manifesto deve associar 72 galerias",
);

for (const alien of aliens) {
  const context = `#${alien.id} ${alien.originalName}`;
  for (const field of [
    "slug",
    "name",
    "originalName",
    "species",
    "planet",
    "description",
    "canonStatus",
    "form",
  ]) {
    nonemptyString(alien[field], `${context}.${field}`);
  }
  for (const field of [
    "aliases",
    "series",
    "categories",
    "powers",
    "weaknesses",
    "notes",
  ]) {
    textArray(alien[field], `${context}.${field}`);
  }
  assert.equal(
    typeof alien.aiEnhanced,
    "boolean",
    `${context}: flag IA ausente`,
  );
  assert.deepEqual(
    Object.keys(alien.stats).sort(),
    [...statKeys].sort(),
    `${context}: devem existir os seis atributos`,
  );
  assert.deepEqual(
    alien.stats,
    adaptStats(alien.sourceStats),
    `${context}: fórmula dos atributos divergente`,
  );
  for (const field of [
    "strength",
    "durability",
    "power",
    "intelligence",
    "speed",
  ]) {
    const value = alien.sourceStats[field];
    assert.ok(
      typeof value === "number" &&
        Number.isFinite(value) &&
        value >= 0 &&
        value <= 100,
      `${context}: sourceStats.${field} fora da escala 0..100`,
    );
  }
  assert.ok(
    Array.isArray(alien.sources) && alien.sources.length,
    `${context}: fontes ausentes`,
  );
  alien.sources.forEach((source) => httpUrl(source, `${context}: fonte`));
  assert.ok(
    Array.isArray(alien.imageSources) && alien.imageSources.length,
    `${context}: origem da capa ausente`,
  );
  for (const source of alien.imageSources) {
    httpUrl(source.url, `${context}: página da capa`);
    httpUrl(source.originalUrl, `${context}: URL original da capa`);
    httpUrl(source.repositoryFile, `${context}: arquivo da capa no snapshot`);
    nonemptyString(source.label, `${context}: crédito da capa`);
    nonemptyString(source.licenseNote, `${context}: condições da capa`);
  }
  const cover = manifest.covers[alien.id];
  const gallery = manifest.galleries[alien.id];
  assert.equal(
    cover.name,
    alien.originalName,
    `${context}: nome/ID da capa divergente`,
  );
  assert.equal(
    gallery.name,
    alien.originalName,
    `${context}: nome/ID da galeria divergente`,
  );
  assert.equal(
    cover.image,
    alien.imageSources[0].originalUrl,
    `${context}: origem da capa divergente`,
  );
  const coverMetadata = checkImage(alien.image, `${context}: capa`);
  const repositoryPath = decodeURIComponent(
    new URL(alien.imageSources[0].repositoryFile).pathname,
  );
  assert.ok(
    repositoryPath.includes(`/blob/${audit.snapshot}/public/`),
    `${context}: capa deve referenciar o snapshot conferido`,
  );
  const sourcePath = repositoryPath.split(`/blob/${audit.snapshot}/public/`)[1];
  const expectedLocalPath = `/images/${sourcePath}`.replace(
    /\.[^/.]+$/,
    `.${coverMetadata.format}`,
  );
  assert.equal(
    alien.image,
    expectedLocalPath,
    `${context}: arquivo local não corresponde ao caminho original da capa`,
  );
  assert.equal(
    alien.aiEnhanced,
    Boolean(cover.enhanced),
    `${context}: identificação IA da capa divergente`,
  );
  assert.ok(
    Array.isArray(alien.gallery),
    `${context}: galeria deve ser um array`,
  );
  assert.equal(
    alien.gallery.length,
    gallery.images.length,
    `${context}: contagem da galeria divergente`,
  );

  alien.gallery.forEach((image, index) => {
    const imageContext = `${context}: galeria ${index + 1}`;
    const original = gallery.images[index];
    const metadata = checkImage(image.src, imageContext);
    assert.equal(
      image.src,
      `/images${original.src}`,
      `${imageContext}: associação ao manifesto divergente`,
    );
    assert.equal(
      image.sha256,
      original.sha256,
      `${imageContext}: hash declarado divergente`,
    );
    assert.equal(
      metadata.sha256,
      original.sha256,
      `${imageContext}: SHA-256 do arquivo divergente`,
    );
    assert.equal(
      metadata.bytes,
      original.bytes,
      `${imageContext}: tamanho do arquivo divergente`,
    );
    assert.equal(
      metadata.width,
      image.width,
      `${imageContext}: largura divergente`,
    );
    assert.equal(
      metadata.height,
      image.height,
      `${imageContext}: altura divergente`,
    );
    assert.equal(
      image.aiEnhanced,
      Boolean(original.enhanced),
      `${imageContext}: identificação IA divergente`,
    );
    assert.equal(
      image.sourceUrl,
      original.sourceFile,
      `${imageContext}: página do arquivo divergente`,
    );
    for (const field of ["sourceUrl", "sourcePage", "originalUrl"])
      httpUrl(image[field], `${imageContext}.${field}`);
    nonemptyString(image.label, `${imageContext}: legenda`);
    galleryAssociations += 1;
    checkedHashes += 1;
    if (image.aiEnhanced) aiEnhancedGalleryImages += 1;
  });
}

// Os perfis são dados simples. A leitura não executa JSX nem código do aplicativo.
const operatorDataPath = [
  "src/data/operators.js",
  "src/components/Operators.jsx",
].find((relative) => fs.existsSync(path.join(root, relative)));
assert.ok(operatorDataPath, "Arquivo de perfis demonstrativos não encontrado");
const operatorSource = fs.readFileSync(
  path.join(root, operatorDataPath),
  "utf8",
);
const selections = [
  ...operatorSource.matchAll(/\btransformationIds\s*:\s*\[([^\]]*)\]/g),
];
assert.ok(selections.length > 0, "Nenhum perfil demonstrativo encontrado");
let operatorRelations = 0;
for (const [index, match] of selections.entries()) {
  const entries = match[1]
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  assert.ok(
    entries.every((value) => /^\d+$/.test(value)),
    `Operador ${index + 1}: IDs devem ser números literais`,
  );
  const selectedIds = entries.map(Number);
  assert.equal(
    new Set(selectedIds).size,
    selectedIds.length,
    `Operador ${index + 1}: IDs duplicados`,
  );
  assert.ok(
    selectedIds.length <= 10,
    `Operador ${index + 1}: excede dez transformações`,
  );
  assert.ok(
    selectedIds.every((id) => ids.has(id)),
    `Operador ${index + 1}: transformação inexistente`,
  );
  operatorRelations += selectedIds.length;
}

let runtimeFiles = 0;
if (fs.existsSync(path.join(root, "src/data/catalog-index.json"))) {
  const runtime = readJson("src/data/catalog-index.json");
  assert.equal(
    runtime.length,
    aliens.length,
    "Índice leve: contagem divergente",
  );
  const indexed = new Map(runtime.map((alien) => [alien.id, alien]));
  assert.equal(indexed.size, aliens.length, "Índice leve: IDs duplicados");
  for (const alien of aliens) {
    const entry = indexed.get(alien.id);
    assert.ok(entry, `Índice leve: registro #${alien.id} ausente`);
    assert.equal(
      entry.gallery,
      undefined,
      `Índice leve #${alien.id}: galeria não deve estar no bundle inicial`,
    );
    assert.equal(
      entry.galleryCount,
      alien.gallery.length,
      `Índice leve #${alien.id}: contagem da galeria divergente`,
    );
    for (const key of Object.keys(alien).filter((key) => key !== "gallery")) {
      assert.deepEqual(
        entry[key],
        alien[key],
        `Índice leve #${alien.id}.${key}: conteúdo divergente`,
      );
    }
    const localGallery = readJson(`public/data/galleries/${alien.id}.json`);
    assert.deepEqual(
      localGallery,
      alien.gallery,
      `Galeria sob demanda #${alien.id}: conteúdo divergente`,
    );
    runtimeFiles += 1;
  }
}

assert.equal(
  aliens.length,
  audit.records,
  "Contagem de registros divergente da auditoria",
);
assert.equal(
  aliens.length,
  audit.coverAssociations,
  "Contagem de capas divergente da auditoria",
);
assert.equal(
  galleryAssociations,
  audit.galleryAssociations,
  "Contagem de galerias divergente da auditoria",
);
assert.equal(
  checkedFiles.size,
  audit.uniqueImageFiles,
  "Arquivos visuais únicos divergem da auditoria",
);
assert.equal(
  checkedHashes,
  audit.galleryHashesVerified,
  "Hashes conferidos divergem da auditoria",
);
assert.equal(
  aiEnhancedGalleryImages,
  audit.aiEnhancedGalleryImages,
  "Imagens IA divergem da auditoria",
);

const formats = {};
let totalBytes = 0;
for (const metadata of checkedFiles.values()) {
  formats[metadata.format] = (formats[metadata.format] ?? 0) + 1;
  totalBytes += metadata.bytes;
}
console.log(
  JSON.stringify(
    {
      status: "Dados locais validados",
      records: aliens.length,
      uniqueIds: ids.size,
      coverAssociations: aliens.length,
      galleryAssociations,
      uniqueImageFiles: checkedFiles.size,
      imageFormats: formats,
      imageBytes: totalBytes,
      gallerySha256Verified: checkedHashes,
      adaptedAttributeRecordsVerified: aliens.length,
      operatorProfiles: selections.length,
      validOperatorRelations: operatorRelations,
      runtimeGalleryFilesVerified: runtimeFiles,
      aiEnhancedCovers: aliens.filter((alien) => alien.aiEnhanced).length,
      aiEnhancedGalleryImages,
      snapshot: audit.snapshot,
      note: "Integridade local e associação declarada pelos manifestos. URLs tiveram formato conferido; disponibilidade remota, direitos de uso e cânone não são certificados por este script.",
    },
    null,
    2,
  ),
);
