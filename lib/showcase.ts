import { episode } from "./episode";

// Real Gemma 4 output from the bundled episode, picked for the landing page. Nothing here is hand-written.
const line = (page: number, index: number) => ({ page, ...episode.pages[page - 1].bubbles[index] });

/** One line, three voices: the comparison cards. */
export const VOICES = [line(4, 4), line(7, 3), line(6, 6)];

/** The scrolling ribbons of Madras Bashai and Tamil lines. */
export const RIBBON_MADRAS = [line(4, 4), line(7, 3), line(3, 3), line(6, 6), line(5, 0), line(7, 1), line(6, 9), line(6, 1)].map(
  (b) => b.madras,
);
export const RIBBON_TAMIL = [line(1, 1), line(3, 0), line(6, 4), line(7, 0), line(2, 3), line(4, 8), line(6, 5), line(1, 5)].map(
  (b) => b.tamil,
);

/** The single bubble lettered onto the share card. */
export const CARD_LINE = line(5, 0).madras;
