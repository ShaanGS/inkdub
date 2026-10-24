"use client";

import { motion } from "motion/react";
import type { Bubble } from "@/lib/types";

const ROWS: { key: "tamil" | "tanglish" | "madras"; label: string }[] = [
  { key: "tamil", label: "Tamil" },
  { key: "tanglish", label: "Tanglish" },
  { key: "madras", label: "Madras Bashai" },
];

/** Everything Gemma said about one bubble: who speaks, how, the original and all three dubs. */
export function BubbleCard({ bubble, model, onClose }: { bubble: Bubble; model: string; onClose: () => void }) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/10 bg-surface/95 p-5 shadow-2xl backdrop-blur-xl md:inset-x-auto md:right-6 md:bottom-6 md:w-[380px]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">{bubble.speaker || "Someone"}</span>
          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">{bubble.tone}</span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-paper/50">{bubble.kind}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-8 place-items-center rounded-full text-paper/50 transition hover:bg-white/10 hover:text-paper"
        >
          ✕
        </button>
      </div>
      <p className="mb-4 border-l-2 border-white/15 pl-3 text-sm text-paper/60">{bubble.text}</p>
      <dl className="space-y-3">
        {ROWS.map((row) => (
          <div key={row.key}>
            <dt className="text-[11px] font-semibold tracking-wider text-paper/40 uppercase">{row.label}</dt>
            <dd className={`mt-0.5 text-[15px] leading-snug ${row.key === "tanglish" ? "" : "font-tamil"}`}>
              {bubble[row.key]}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[11px] text-paper/35">Lettered by {model} · Gemini API</p>
    </motion.aside>
  );
}
