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
  // Gemma sometimes slips: Madras lines in English letters, or a copy of the plain Tamil. Try up to
  // three times and keep the take with the fewest slips.
  let best: (Awaited<ReturnType<typeof dubPage>> & { slips: number }) | null = null;
  for (let take = 0; take < 3 && (best?.slips ?? 1) > 0; take++) {
    const result = await dubPage({ mimeType: "image/jpeg", data }, { apiKey: process.env.GEMINI_API_KEY ?? "", cast }).catch(
      (error) => (console.warn(`${page}: take ${take + 1} failed, ${error.message.slice(0, 80)}`), null),
    );
    if (!result) continue;
    const slips = result.bubbles.filter((b) => /[A-Za-z]/.test(b.madras) || (b.text.length > 12 && b.madras.trim() === b.tamil.trim())).length;
    if (!best || slips < best.slips) best = { ...result, slips };
  }
  if (!best) throw new Error(`${page}: every take failed`);
  const { model, bubbles, ms, slips } = best;
  await writeFile(target, JSON.stringify({ model, page, bubbles }, null, 1));
  console.log(`${page}: ${bubbles.length} bubbles in ${(ms / 1000).toFixed(1)}s, ${slips} slips`);
}
