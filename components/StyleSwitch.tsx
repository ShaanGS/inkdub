"use client";

import { motion } from "motion/react";
import type { View } from "@/lib/types";
import { VIEWS } from "@/lib/views";

/** The dub styles as rubber-stamp tabs; the chosen one is inked red and knocked slightly askew. */
export function StyleSwitch({ value, onChange }: { value: View; onChange: (view: View) => void }) {
  return (
    <div role="radiogroup" aria-label="Dub style" className="flex flex-wrap gap-1.5">
      {VIEWS.map((view, i) => {
        const active = value === view.id;
        return (
          <motion.button
            key={view.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={`${view.hint} (${i + 1})`}
            onClick={() => onChange(view.id)}
            animate={{ rotate: active ? -3 : 0, y: active ? -2 : 0 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 520, damping: 18 }}
            className={`border-2 border-ink px-2.5 py-1 font-mono text-[11px] font-semibold tracking-[0.1em] uppercase transition-colors sm:px-3 sm:text-xs ${
              active ? "bg-accent text-paper-hi shadow-[3px_3px_0_var(--ink)]" : "bg-paper-hi text-ink hover:bg-paper"
            }`}
          >
            <span className={view.id === "tamil" ? "font-tamil text-[13px] tracking-normal normal-case" : ""}>
              {view.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
