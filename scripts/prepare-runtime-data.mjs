// O JSON completo da entrega permanece intacto. Apenas os metadados das
// galerias saem do pacote inicial e são lidos como arquivos estáticos locais.
import fs from "node:fs/promises";

const records = JSON.parse(
  await fs.readFile(
    new URL("../src/data/pokedex-data.json", import.meta.url),
    "utf8",
  ),
);
const galleryDirectory = new URL("../public/data/galleries/", import.meta.url);
await fs.mkdir(galleryDirectory, { recursive: true });
const index = [];
for (const { gallery = [], ...alien } of records) {
  index.push({ ...alien, galleryCount: gallery.length });
  await fs.writeFile(
    new URL(`${alien.id}.json`, galleryDirectory),
    JSON.stringify(gallery),
  );
}
await fs.writeFile(
  new URL("../src/data/catalog-index.json", import.meta.url),
  JSON.stringify(index),
);
console.log(
  `Índice local preparado: ${index.length} registros; galerias carregadas sob demanda.`,
);
