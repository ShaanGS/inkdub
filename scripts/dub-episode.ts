// Dub every page of an episode once and cache the JSON beside the images, so the reader never
// waits on the API. Pages that already have JSON are skipped.
// usage: pnpm dub:episode public/comics/pepper-carrot/ep06
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { dubPage } from "../lib/gemma.ts";

const episode = process.argv[2];
if (!episode) throw new Error("usage: pnpm dub:episode <episode dir with an en/ folder of pages>");

const cast = "Pepper (young witch), Carrot (her orange cat), Saffron, Coriander, Shichimi, Komona (a city)";
const outDir = path.join(episode, "gemma");
await mkdir(outDir, { recursive: true });

const pages = (await readdir(path.join(episode, "en"))).filter((f) => f.endsWith(".jpg")).sort();
for (const file of pages) {
  const page = path.basename(file, ".jpg");
  const target = path.join(outDir, `${page}.json`);
  if (existsSync(target)) {
    console.log(`${page}: cached`);
    continue;
  }
  const data = (await readFile(path.join(episode, "en", file))).toString("base64");
  const { model, bubbles, ms } = await dubPage({ mimeType: "image/jpeg", data }, cast);
  await writeFile(target, JSON.stringify({ model, page, bubbles }, null, 1));
  console.log(`${page}: ${bubbles.length} bubbles in ${(ms / 1000).toFixed(1)}s`);
}
