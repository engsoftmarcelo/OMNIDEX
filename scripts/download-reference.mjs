// Maintenance only: downloads the source manifests and the files they explicitly name.
// No source application code is loaded or executed.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const sha = "8d9c4cad125a812d41c6322a1b133217a75d7f7a";
const base = `https://raw.githubusercontent.com/PRABHMANNAT/Ben-10-Omnitrix-Database/${sha}`;
const cache = ".source-reference";
await fs.mkdir(cache, { recursive: true });
const manifestFiles = [
  "src/data/aliens.js",
  "src/data/artwork.json",
  "src/data/galleries.json",
  "public/aliens/sources.json",
  "README.md",
];
for (const file of manifestFiles) {
  const response = await fetch(`${base}/${file}`);
  if (!response.ok) throw new Error(`${response.status}: ${file}`);
  await fs.writeFile(
    path.join(cache, file.replaceAll("/", "_")),
    await response.text(),
  );
}
const artwork = JSON.parse(await fs.readFile(`${cache}/src_data_artwork.json`));
const galleries = JSON.parse(
  await fs.readFile(`${cache}/src_data_galleries.json`),
);
const covers = Object.entries(artwork).map(([id, src]) => ({ id, src }));
const images = Object.entries(galleries).flatMap(([id, g]) =>
  g.images.map((image) => ({ alienId: Number(id), ...image })),
);
const queue = [...covers, ...images];
const failures = [];
let complete = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      const target = path.join("public/images", item.src.replace(/^\//, ""));
      try {
        await fs.mkdir(path.dirname(target), { recursive: true });
        let bytes;
        try {
          bytes = await fs.readFile(target);
        } catch {}
        if (
          !bytes ||
          (item.sha256 &&
            crypto.createHash("sha256").update(bytes).digest("hex") !==
              item.sha256)
        ) {
          let response;
          for (let attempt = 0; attempt < 3; attempt++) {
            response = await fetch(`${base}/public${item.src}`);
            if (response.ok) break;
          }
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          bytes = Buffer.from(await response.arrayBuffer());
          if (
            item.sha256 &&
            crypto.createHash("sha256").update(bytes).digest("hex") !==
              item.sha256
          )
            throw new Error("SHA-256 mismatch");
          await fs.writeFile(target, bytes);
        }
        if (++complete % 40 === 0)
          console.log(`${complete}/632 image files verified`);
      } catch (error) {
        failures.push({ src: item.src, error: String(error) });
      }
    }
  }),
);
await fs.writeFile(
  `${cache}/download-result.json`,
  JSON.stringify({ sha, verified: complete, failures }, null, 2) + "\n",
);
console.log(JSON.stringify({ verified: complete, failures }));
if (failures.length) process.exitCode = 1;
