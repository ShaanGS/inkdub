"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Page } from "@/lib/episode";
import type { View } from "@/lib/types";
import { DubbedPage } from "./DubbedPage";
import { StyleSwitch } from "./StyleSwitch";

const CYCLE: View[] = ["original", "tamil", "tanglish", "madras"];

/** The landing page's live specimen: one real page that keeps re-lettering itself until you take over. */
export function HeroDemo({ page, width, height }: { page: Page; width: number; height: number }) {
  const [view, setView] = useState<View>("original");
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => setView((v) => CYCLE[(CYCLE.indexOf(v) + 1) % CYCLE.length]), 2800);
    return () => clearInterval(timer);
  }, [auto]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: 2 }}
      animate={{ opacity: 1, y: 0, rotate: 1.2 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
      className="relative"
    >
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-accent/20 blur-3xl" />
      <div className="overflow-hidden rounded-xl shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
        <DubbedPage
          src={page.src}
          alt="Pepper&Carrot page lettered in Tamil by Inkdub"
          width={width}
          height={height}
          bubbles={page.bubbles}
          view={view}
          playKey="hero"
          delay={0.6}
        />
      </div>
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2" onPointerDown={() => setAuto(false)}>
        <StyleSwitch id="hero" value={view} onChange={setView} />
      </div>
    </motion.div>
  );
}
