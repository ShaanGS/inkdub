"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type RefObject } from "react";
import { savePage, shareLink } from "@/lib/share";

type Status = "idle" | "working" | "saved" | "shared" | "copied" | "failed";

const DONE: Partial<Record<Status, string>> = { saved: "Saved!", shared: "Sent!", copied: "Link copied!", failed: "Try again" };

/** Save (or, on phones, share) the lettered page as an image with the Inkdub credit strip. */
export function SaveButton({
  target,
  pixelWidth,
  name,
  label,
  art,
  className = "",
}: {
  target: RefObject<HTMLElement | null>;
  pixelWidth: number;
  name: string;
  label: string;
  art?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const run = async () => {
    if (!target.current || status === "working") return;
    setStatus("working");
    try {
      const result = await savePage(target.current, { pixelWidth, name, label, art });
      setStatus(result === "cancelled" ? "idle" : result);
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
    setTimeout(() => setStatus("idle"), 2200);
  };
  return (
    <button type="button" onClick={run} disabled={status === "working"} className={`stamp ${className}`}>
      <Flip text={status === "working" ? "Inking…" : (DONE[status] ?? "Save & share page")} />
    </button>
  );
}

/** Copy the current address (or open the share sheet on phones). */
export function LinkButton({ text, className = "" }: { text: string; className?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const result = await shareLink(window.location.href, text);
        if (result === "cancelled") return;
        setStatus(result);
        setTimeout(() => setStatus("idle"), 2000);
      }}
    >
      <Flip text={DONE[status] ?? "Share link"} />
    </button>
  );
}

function Flip({ text }: { text: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={text}
        className="inline-block"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.14 }}
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}
