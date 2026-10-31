import voice from "@/public/comics/pepper-carrot/ep06/voice/index.json";
import type { Style } from "./types";

// Clips voiced once with scripts/voice-episode.ts; a bubble only gets a play button if it has one.
const voiced = new Set(Object.entries(voice as Record<string, string[]>).flatMap(([style, clips]) => clips.map((c) => `${style}/${c}`)));

/** The shipped clip of a bubble spoken in a style, or null. */
export const voiceSrc = (pageId: string, bubble: number, style: Style) =>
  voiced.has(`${style}/${pageId}-${bubble}`) ? `/comics/pepper-carrot/ep06/voice/${style}/${pageId}-${bubble}.mp3` : null;
