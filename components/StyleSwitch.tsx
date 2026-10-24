"use client";

import { motion } from "motion/react";
import type { View } from "@/lib/types";

export const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "original", label: "Original", hint: "English" },
  { id: "tamil", label: "தமிழ்", hint: "Tamil" },
  { id: "tanglish", label: "Tanglish", hint: "Casual" },
  { id: "madras", label: "Madras", hint: "Bashai" },
];

export function StyleSwitch({ value, onChange, id = "style" }: { value: View; onChange: (view: View) => void; id?: string }) {
  return (
    <div
      role="radiogroup"
      aria-label="Dub style"
      className="relative flex rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur"
    >
      {VIEWS.map((view, i) => {
        const active = value === view.id;
        return (
          <button
            key={view.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${view.hint} (${i + 1})`}
            onClick={() => onChange(view.id)}
            className={`relative rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4 ${
              active ? "text-white" : "text-paper/60 hover:text-paper"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`${id}-pill`}
                className="absolute inset-0 rounded-full bg-accent shadow-[0_6px_24px_-6px_rgba(255,77,46,0.8)]"
                transition={{ type: "spring", stiffness: 520, damping: 36 }}
              />
            )}
            <span className={`relative ${view.id === "tamil" ? "font-tamil" : ""}`}>{view.label}</span>
          </button>
        );
      })}
    </div>
  );
}
