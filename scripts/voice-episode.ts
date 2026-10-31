// Voice every dubbed bubble of an episode once and ship the clips beside the pages, so the reader can
// play a page out loud without a key. Clips that already exist are skipped. Needs ffmpeg.
// The free tier voices about forty lines a day across the speech models; rerun to pick up where it stopped.
// usage: pnpm voice:episode public/comics/pepper-carrot/ep06 [madras,tamil] [P07,P01]
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Bubble, Style } from "../lib/types.ts";
import { speak, voiceFor } from "../lib/voice.ts";

const episode = process.argv[2];
if (!episode) throw new Error("usage: pnpm voice:episode <episode dir with a gemma/ folder> [styles]");
const styles = (process.argv[3] ?? "madras,tamil").split(",") as Style[];
const only = process.argv[4]?.split(",");
const apiKey = process.env.GEMINI_API_KEY ?? "";

// The same character keeps the same voice on every page.
const CAST: Record<string, string> = {
  pepper: "Leda",
  saffron: "Zephyr",
  coriander: "Kore",
  shichimi: "Aoede",
  announcer: "Fenrir",
  "mc/announcer": "Fenrir",
  "crowd/announcer": "Fenrir",
  mayor: "Orus",
  narrator: "Charon",
};
const castVoice = (bubble: Bubble) => CAST[bubble.speaker.toLowerCase()] ?? voiceFor(bubble.speaker || bubble.kind);

const wait = (s: number) => new Promise((resolve) => setTimeout(resolve, s * 1000));
const seconds = (file: string) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString(),
  );

/** Speak, trim the silence, encode a small MP3. Per-minute 429s and 500s wait and go again. */
async function clip(bubble: Bubble, style: Style, target: string) {
  const raw = path.join(os.tmpdir(), `inkdub-${process.pid}.wav`);
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      await writeFile(raw, await speak(bubble, style, { apiKey, voice: castVoice(bubble) }));
      break;
    } catch (error) {
      const status = (error as { status?: number }).status ?? 0;
      if (/per day/i.test((error as Error).message))
        throw new Error("Daily free-tier voice quota is used up; run again tomorrow.");
      if (attempt === 5 || (status && status < 500 && status !== 429)) throw error;
      console.warn(`  ${status || "error"}, waiting`);
      await wait(status === 429 ? 30 : 5);
    }
  }
  const trim = "silenceremove=start_periods=1:start_threshold=-45dB";
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-af", `${trim},areverse,${trim},areverse`, "-ac", "1", "-b:a", "48k", target]);
  await rm(raw);
  return seconds(target);
}

try {
  for (const style of styles) {
    const outDir = path.join(episode, "voice", style);
    await mkdir(outDir, { recursive: true });
    for (const file of (await readdir(path.join(episode, "gemma"))).filter((f) => f.endsWith(".json")).sort()) {
      const page = path.basename(file, ".json");
      if (only && !only.includes(page)) continue;
      const { bubbles } = JSON.parse(await readFile(path.join(episode, "gemma", file), "utf8")) as {
        bubbles: Bubble[];
      };
      for (const [i, bubble] of bubbles.entries()) {
        const target = path.join(outDir, `${page}-${i}.mp3`);
        if (existsSync(target)) continue;
        // A clip far longer than its line usually means the model read the director's note aloud too.
        const limit = 2.5 + bubble[style].length / 7;
        let length = await clip(bubble, style, target);
        if (length > limit) length = await clip(bubble, style, target);
        console.log(`${style} ${page}-${i}: ${length.toFixed(1)}s${length > limit ? " (long, check it)" : ""}`);
      }
    }
  }
} catch (error) {
  console.error((error as Error).message.slice(0, 200));
}

// The reader only offers playback for clips that exist.
const index: Record<string, string[]> = {};
for (const style of ["tamil", "tanglish", "madras"]) {
  const dir = path.join(episode, "voice", style);
  if (existsSync(dir))
    index[style] = (await readdir(dir))
      .filter((f) => f.endsWith(".mp3"))
      .map((f) => f.slice(0, -4))
      .sort();
}
await writeFile(path.join(episode, "voice", "index.json"), JSON.stringify(index));
console.log("wrote voice/index.json");
