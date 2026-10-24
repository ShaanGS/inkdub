import p01 from "@/public/comics/pepper-carrot/ep06/gemma/P01.json";
import p02 from "@/public/comics/pepper-carrot/ep06/gemma/P02.json";
import p03 from "@/public/comics/pepper-carrot/ep06/gemma/P03.json";
import p04 from "@/public/comics/pepper-carrot/ep06/gemma/P04.json";
import p05 from "@/public/comics/pepper-carrot/ep06/gemma/P05.json";
import p06 from "@/public/comics/pepper-carrot/ep06/gemma/P06.json";
import p07 from "@/public/comics/pepper-carrot/ep06/gemma/P07.json";
import p08 from "@/public/comics/pepper-carrot/ep06/gemma/P08.json";
import p09 from "@/public/comics/pepper-carrot/ep06/gemma/P09.json";
import p10 from "@/public/comics/pepper-carrot/ep06/gemma/P10.json";
import type { Bubble } from "./types";

// Pages were dubbed once with scripts/dub-episode.mjs (same prompt as the live API) and cached,
// so the reader is instant and never depends on the free tier being up.
const dubs = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10];

export type Page = { id: string; src: string; humanTamilSrc: string; bubbles: Bubble[] };

export const episode = {
  series: "Pepper&Carrot",
  number: 6,
  title: "The Potion Contest",
  author: "David Revoy",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  sourceUrl: "https://www.peppercarrot.com/en/webcomic/ep06_The-Potion-Contest.html",
  model: p01.model,
  width: 1200,
  height: 1660,
  pages: dubs.map((dub, i): Page => {
    const id = `P${String(i + 1).padStart(2, "0")}`;
    return {
      id,
      src: `/comics/pepper-carrot/ep06/en/${id}.jpg`,
      humanTamilSrc: `/comics/pepper-carrot/ep06/ta/${id}.jpg`,
      bubbles: dub.bubbles as unknown as Bubble[],
    };
  }),
};

export type Episode = typeof episode;
