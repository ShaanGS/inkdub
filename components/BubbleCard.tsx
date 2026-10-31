"use client";

import { motion } from "motion/react";
import type { Bubble, Style } from "@/lib/types";

const ROWS: { key: Style; label: string }[] = [
  { key: "tamil", label: "Tamil" },
  { key: "tanglish", label: "Tanglish" },
  { key: "madras", label: "Madras Bashai" },
];

type Props = {
  bubble: Bubble;
  model: string;
  onClose: () => void;
  /** Styles this line has a voice clip in, each with its own play button. */
  voices?: Style[];
  speaking?: boolean;
  onPlay?: (style: Style) => void;
};

/** A translator's note pinned over the page: who speaks, how, the original line and all three dubs. */
export function BubbleCard({ bubble, model, onClose, voices = [], speaking, onPlay }: Props) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 30, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      exit={{ opacity: 0, y: 20, rotate: 2 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className="paper fixed inset-x-3 bottom-3 z-40 border-[3px] border-ink p-5 text-ink shadow-[7px_7px_0_var(--accent)] md:inset-x-auto md:right-6 md:bottom-6 md:w-[390px]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
          <span className="bg-ink px-2 py-0.5 text-paper-hi">{bubble.speaker || "Someone"}</span>
          <span className="border-2 border-ink px-1.5 py-px">{bubble.tone}</span>
          <span className="text-ink-soft">{bubble.kind}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 place-items-center border-2 border-ink font-mono font-bold transition hover:bg-ink hover:text-paper-hi"
        >
          ✕
        </button>
      </div>
      <p className="mb-4 border-l-[3px] border-ink pl-3 font-letter text-[15px] leading-snug text-ink-soft">{bubble.text}</p>
      <dl className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.key}>
            <dt className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
              {row.label}
              {voices.includes(row.key) && (
                <button
                  type="button"
                  onClick={() => onPlay?.(row.key)}
                  aria-label={`Hear it in ${row.label}`}
                  className="border-2 border-ink px-1.5 leading-4 text-ink transition hover:bg-ink hover:text-paper-hi"
                >
                  ▶ hear
                </button>
              )}
            </dt>
            <dd className={`mt-0.5 font-bubble text-[17px] leading-snug ${row.key === "madras" ? "font-bold text-accent" : ""}`}>
              {bubble[row.key]}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 font-mono text-[10px] tracking-[0.06em] text-ink-soft">
        Lettered by {model} · Gemini API
        {voices.length > 0 && " · voiced by Gemini TTS"}
        {speaking && <span className="ml-2 text-accent">● speaking</span>}
      </p>
    </motion.aside>
  );
}
