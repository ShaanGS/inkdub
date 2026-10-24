"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import type { Page } from "@/lib/episode";
import type { View } from "@/lib/types";
import { DubbedPage } from "./DubbedPage";

type Crop = [number, number, number, number]; // ymin, xmin, ymax, xmax in 0–1000 of the page

/**
 * One panel cut out of a real page. It letters itself in the first time it scrolls into view;
 * `boxes` shows what Gemma 4 detected instead, as dashed outlines.
 */
export function PanelCrop({
  page,
  width,
  height,
  crop,
  view,
  delay = 0,
  boxes = false,
}: {
  page: Page;
  width: number;
  height: number;
  crop: Crop;
  view: View;
  delay?: number;
  boxes?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [y0, x0, y1, x1] = crop;
  const cropW = ((x1 - x0) / 1000) * width;
  const cropH = ((y1 - y0) / 1000) * height;
  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ aspectRatio: `${cropW} / ${cropH}` }}>
      <div
        className="absolute"
        style={{
          width: `${(1000 / (x1 - x0)) * 100}%`,
          left: `${(-x0 / (x1 - x0)) * 100}%`,
          top: `${(-y0 / (y1 - y0)) * 100}%`,
        }}
      >
        <DubbedPage
          src={page.src}
          alt=""
          width={width}
          height={height}
          bubbles={page.bubbles}
          view={inView && !boxes ? view : "original"}
          playKey={`${page.id}-${inView}`}
          delay={delay}
        />
        {boxes &&
          page.bubbles.map((bubble, i) => {
            const [top, left, bottom, right] = bubble.box_2d;
            return (
              <motion.span
                key={i}
                aria-hidden
                className="absolute border-2 border-dashed border-accent bg-accent/10"
                style={{
                  top: `${top / 10}%`,
                  left: `${left / 10}%`,
                  width: `${(right - left) / 10}%`,
                  height: `${(bottom - top) / 10}%`,
                }}
                initial={{ opacity: 0, scale: 1.6 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 380, damping: 22, delay: delay + i * 0.18 }}
              />
            );
          })}
      </div>
    </div>
  );
}
