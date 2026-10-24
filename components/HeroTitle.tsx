"use client";

import { motion } from "motion/react";

const LINES = [
  { words: ["Anime", "gets", "dubs."], accent: false },
  { words: ["Manga", "never", "did."], accent: true },
];

/** The headline sets itself word by word, like lettering going into a bubble. */
export function HeroTitle() {
  return (
    <h1 className="font-display text-5xl leading-[0.98] tracking-tight sm:text-7xl">
      {LINES.map((line, row) => (
        <span key={row} className={`block ${line.accent ? "text-accent" : ""}`}>
          {line.words.map((word, i) => (
            <span key={word} className="inline-block overflow-hidden pr-[0.22em] pb-1 align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: "110%", rotate: 4 }}
                animate={{ y: 0, rotate: 0 }}
                transition={{ duration: 0.75, delay: 0.1 + (row * 3 + i) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
