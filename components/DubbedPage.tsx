"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import type { Bubble, View } from "@/lib/types";
import { FitText } from "./FitText";

type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  bubbles: Bubble[];
  view: View;
  /** Changing this replays the lettering animation. */
  playKey?: string | number;
  selected?: number | null;
  onSelect?: (index: number) => void;
  /** Seconds before the first bubble letters in. */
  delay?: number;
};

type Box = [number, number, number, number]; // ymin, xmin, ymax, xmax in 0–1000

type Layout = {
  /** Where the patch sits: the traced bubble interior, or Gemma's text box plus a margin. */
  box: Box;
  /** PNG of the bubble's exact interior painted in its paper colour, when we could trace it. */
  mask?: string;
  background: string;
  ink: string;
};

// Gemma's boxes hug the text; grow an untraced patch a little so no stray English pixels peek out.
const PAD = 4;
const STAGGER = 0.09;

export function DubbedPage({ src, alt, width, height, bubbles, view, playKey, selected, onSelect, delay = 0.2 }: Props) {
  const layouts = useBubbleLayouts(src, bubbles);
  const [settledKey, setSettledKey] = useState<Props["playKey"] | null>(null);
  const settled = settledKey === playKey;
  const dubbed = view !== "original";

  // After the first lettering pass, view switches ripple quickly instead of replaying the slow stagger.
  useEffect(() => {
    const timer = setTimeout(() => setSettledKey(playKey), (delay + bubbles.length * STAGGER + 0.6) * 1000);
    return () => clearTimeout(timer);
  }, [playKey, delay, bubbles.length]);

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${width} / ${height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- patches are positioned against the raw page pixels */}
      <img src={src} alt={alt} draggable={false} className="absolute inset-0 h-full w-full" />
      {bubbles.map((bubble, i) => {
        const layout = layouts[i];
        const [top, left, bottom, right] = layout.box;
        const wait = settled ? i * 0.035 : delay + i * STAGGER;
        const shout = bubble.tone === "shout";
        // A traced bubble is round, so keep the letters inside its widest band.
        const inset = layout.mask ? "13% 12%" : "5%";
        return (
          <motion.button
            key={`${playKey}-${i}`}
            type="button"
            onClick={() => onSelect?.(i)}
            aria-label={`${bubble.speaker || "Bubble"}: ${bubble.text}`}
            className="absolute cursor-pointer rounded-[40%] outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={{
              top: `${top / 10}%`,
              left: `${left / 10}%`,
              width: `${(right - left) / 10}%`,
              height: `${(bottom - top) / 10}%`,
            }}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            {layout.mask ? (
              <motion.img
                aria-hidden
                alt=""
                src={layout.mask}
                draggable={false}
                className="absolute inset-0 h-full w-full"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={dubbed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 380, damping: 26, delay: dubbed ? wait : 0 }}
              />
            ) : (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-[40%]"
                style={{ background: layout.background, boxShadow: `0 0 4px 2px ${layout.background}` }}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={dubbed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 24, delay: dubbed ? wait : 0 }}
              />
            )}
            <AnimatePresence mode="wait">
              {dubbed && (
                <motion.span
                  key={view}
                  className="absolute font-bubble"
                  style={{ inset, color: layout.ink, fontWeight: shout ? 800 : 600 }}
                  initial={{ opacity: 0, y: 5, scale: shout ? 1.25 : 1, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -5, filter: "blur(5px)", transition: { duration: 0.14 } }}
                  transition={{ duration: 0.32, delay: wait + 0.08, ease: [0.22, 1, 0.36, 1] }}
                >
                  <FitText text={bubble[view]} />
                </motion.span>
              )}
            </AnimatePresence>
            {selected === i && (
              <motion.span
                layoutId="bubble-ring"
                aria-hidden
                className="pointer-events-none absolute -inset-1.5 rounded-[40%] border-2 border-accent shadow-[0_0_28px_rgba(255,77,46,0.55)]"
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function padded([y0, x0, y1, x1]: Box): Box {
  return [Math.max(0, y0 - PAD), Math.max(0, x0 - PAD), Math.min(1000, y1 + PAD), Math.min(1000, x1 + PAD)];
}

/** Read the page pixels once, then trace every bubble so the Tamil sits on the bubble's own paper. */
function useBubbleLayouts(src: string, bubbles: Bubble[]): Layout[] {
  const fallback = useMemo(
    () => bubbles.map((b): Layout => ({ box: padded(b.box_2d), background: "#fffdf8", ink: "#141414" })),
    [bubbles],
  );
  const [traced, setTraced] = useState<{ src: string; bubbles: Bubble[]; layouts: Layout[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (cancelled) return;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setTraced({ src, bubbles, layouts: bubbles.map((b) => layoutBubble(pixels, b.box_2d)) });
    };
    return () => {
      cancelled = true;
    };
  }, [src, bubbles]);

  return traced && traced.src === src && traced.bubbles === bubbles ? traced.layouts : fallback;
}

function layoutBubble(pixels: ImageData, box: Box): Layout {
  const paper = samplePaper(pixels, box);
  const light = luma(paper) > 110;
  const background = `rgb(${paper.join(",")})`;
  const ink = light ? "#141414" : "#fafafa";
  const trace = light ? traceInterior(pixels, box, paper) : null;
  return trace ? { ...trace, background, ink } : { box: padded(box), background, ink };
}

const luma = (c: number[]) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];

/** The paper colour: inside the text box the paper always outnumbers the letters. */
function samplePaper({ data, width: w, height: h }: ImageData, [y0, x0, y1, x1]: Box): number[] {
  const samples: number[][] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const x = Math.min(w - 1, Math.round(((x0 + ((x1 - x0) * i) / steps) / 1000) * w));
      const y = Math.min(h - 1, Math.round(((y0 + ((y1 - y0) * j) / steps) / 1000) * h));
      const o = (y * w + x) * 4;
      samples.push([data[o], data[o + 1], data[o + 2]]);
    }
  }
  samples.sort((a, b) => luma(b) - luma(a));
  const light = luma(samples[samples.length >> 1]) > 110;
  const half = Math.ceil(samples.length / 2);
  const pool = light ? samples.slice(0, half) : samples.slice(-half);
  return [0, 1, 2].map((k) => Math.round(pool.reduce((sum, c) => sum + c[k], 0) / pool.length));
}

/**
 * Flood-fill the bubble's paper outward from Gemma's text box until it meets the outline, then fill
 * each row between its outermost paper pixels so the letters inside are covered too. Gives up (and the
 * caller falls back to a padded patch) if the fill escapes the bubble, e.g. through a gap in the outline.
 */
function traceInterior({ data, width: w, height: h }: ImageData, [y0, x0, y1, x1]: Box, paper: number[]) {
  const bx0 = Math.floor((x0 / 1000) * w);
  const bx1 = Math.ceil((x1 / 1000) * w);
  const by0 = Math.floor((y0 / 1000) * h);
  const by1 = Math.ceil((y1 / 1000) * h);
  const reach = Math.round(Math.max(bx1 - bx0, by1 - by0) * 0.6);
  const wx0 = Math.max(0, bx0 - reach);
  const wy0 = Math.max(0, by0 - reach);
  const ww = Math.min(w - 1, bx1 + reach) - wx0 + 1;
  const wh = Math.min(h - 1, by1 + reach) - wy0 + 1;
  const isPaper = (x: number, y: number) => {
    const o = ((wy0 + y) * w + wx0 + x) * 4;
    return Math.abs(data[o] - paper[0]) + Math.abs(data[o + 1] - paper[1]) + Math.abs(data[o + 2] - paper[2]) < 60;
  };

  const inside = new Uint8Array(ww * wh);
  const queue = new Int32Array(ww * wh);
  let head = 0;
  let tail = 0;
  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 8; j++) {
      const x = bx0 - wx0 + Math.floor(((bx1 - bx0) * i) / 8);
      const y = by0 - wy0 + Math.floor(((by1 - by0) * j) / 8);
      const k = y * ww + x;
      if (!inside[k] && isPaper(x, y)) {
        inside[k] = 1;
        queue[tail++] = k;
      }
    }
  }
  if (!tail) return null;

  let minX = ww;
  let maxX = 0;
  let minY = wh;
  let maxY = 0;
  const maxArea = (bx1 - bx0) * (by1 - by0) * 5;
  while (head < tail) {
    const k = queue[head++];
    const x = k % ww;
    const y = (k - x) / ww;
    if (x === 0 || y === 0 || x === ww - 1 || y === wh - 1 || tail > maxArea) return null;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    for (const n of [k - 1, k + 1, k - ww, k + ww]) {
      if (!inside[n] && isPaper(n % ww, Math.floor(n / ww))) {
        inside[n] = 1;
        queue[tail++] = n;
      }
    }
  }

  const mw = maxX - minX + 1;
  const mh = maxY - minY + 1;
  const canvas = document.createElement("canvas");
  canvas.width = mw;
  canvas.height = mh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const out = ctx.createImageData(mw, mh);
  for (let y = 0; y < mh; y++) {
    const row = (y + minY) * ww;
    let first = -1;
    let last = -1;
    for (let x = 0; x < mw; x++) {
      if (inside[row + x + minX]) {
        if (first < 0) first = x;
        last = x;
      }
    }
    for (let x = first; first >= 0 && x <= last; x++) {
      const o = (y * mw + x) * 4;
      out.data[o] = paper[0];
      out.data[o + 1] = paper[1];
      out.data[o + 2] = paper[2];
      out.data[o + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const box: Box = [
    ((wy0 + minY) / h) * 1000,
    ((wx0 + minX) / w) * 1000,
    ((wy0 + maxY + 1) / h) * 1000,
    ((wx0 + maxX + 1) / w) * 1000,
  ];
  return { box, mask: canvas.toDataURL() };
}
