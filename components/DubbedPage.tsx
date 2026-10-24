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
  /** Where the Tamil goes: a traced bubble's interior, or Gemma's text box plus a margin. */
  textBox: Box;
  /** True when textBox is a whole bubble, so the letters keep to its widest band. */
  round: boolean;
  /** The patch that hides the original lettering, and a PNG of its exact shape when we traced one. */
  maskBox: Box;
  mask?: string;
  background: string;
  ink: string;
};

// Gemma's boxes hug the text; grow an untraced patch a little so no stray English pixels peek out.
const PAD = 4;
const STAGGER = 0.09;

const place = ([top, left, bottom, right]: Box) => ({
  top: `${top / 10}%`,
  left: `${left / 10}%`,
  width: `${(right - left) / 10}%`,
  height: `${(bottom - top) / 10}%`,
});

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

  const wait = (i: number) => (settled ? i * 0.035 : delay + i * STAGGER);

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${width} / ${height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- patches are positioned against the raw page pixels */}
      <img src={src} alt={alt} draggable={false} className="absolute inset-0 h-full w-full" />

      {layouts.map((layout, i) => {
        const shown = dubbed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 };
        const transition = { type: "spring" as const, stiffness: 400, damping: 26, delay: dubbed ? wait(i) : 0 };
        return layout.mask ? (
          <motion.img
            key={`${playKey}-mask-${i}`}
            aria-hidden
            alt=""
            src={layout.mask}
            draggable={false}
            className="pointer-events-none absolute"
            style={place(layout.maskBox)}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={shown}
            transition={transition}
          />
        ) : (
          <motion.span
            key={`${playKey}-mask-${i}`}
            aria-hidden
            className="pointer-events-none absolute rounded-[40%]"
            style={{ ...place(layout.maskBox), background: layout.background, boxShadow: `0 0 4px 2px ${layout.background}` }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={shown}
            transition={transition}
          />
        );
      })}

      {bubbles.map((bubble, i) => {
        const layout = layouts[i];
        const shout = bubble.tone === "shout";
        return (
          <motion.button
            key={`${playKey}-${i}`}
            type="button"
            onClick={() => onSelect?.(i)}
            aria-label={`${bubble.speaker || "Bubble"}: ${bubble.text}`}
            className="absolute cursor-pointer rounded-[40%] outline-none focus-visible:ring-2 focus-visible:ring-accent"
            style={place(layout.textBox)}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 24 }}
          >
            <AnimatePresence mode="wait">
              {dubbed && (
                <motion.span
                  key={view}
                  className="absolute font-bubble"
                  style={{ inset: layout.round ? "13% 12%" : "5%", color: layout.ink, fontWeight: shout ? 800 : 600 }}
                  initial={{ opacity: 0, y: 5, scale: shout ? 1.25 : 1, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -5, filter: "blur(5px)", transition: { duration: 0.14 } }}
                  transition={{ duration: 0.32, delay: wait(i) + 0.08, ease: [0.22, 1, 0.36, 1] }}
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

function untraced(box: Box, background = "#fffdf8", ink = "#141414"): Layout {
  return { textBox: padded(box), round: false, maskBox: padded(box), background, ink };
}

/** Read the page pixels once, then trace every bubble so the Tamil sits on the bubble's own paper. */
function useBubbleLayouts(src: string, bubbles: Bubble[]): Layout[] {
  const fallback = useMemo(() => bubbles.map((b) => untraced(b.box_2d)), [bubbles]);
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
  const trace = light ? traceBubble(pixels, box, paper) : null;
  return trace ? { ...trace, background, ink } : untraced(box, background, ink);
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
 * Find what to paint over in a window around Gemma's box:
 * 1. flood the bubble's paper outward from inside the box;
 * 2. anything the paper fully encloses is the original lettering (outlines and art reach the window edge);
 * 3. a closed bubble gets its whole interior painted. An open one (cut by the panel edge, or joined to
 *    another bubble) only gets the enclosed letters near Gemma's box, so the gutter and nearby art are safe.
 */
function traceBubble({ data, width: w, height: h }: ImageData, box: Box, paper: number[]) {
  const bx0 = Math.floor((box[1] / 1000) * w);
  const bx1 = Math.ceil((box[3] / 1000) * w);
  const by0 = Math.floor((box[0] / 1000) * h);
  const by1 = Math.ceil((box[2] / 1000) * h);
  const size = Math.max(bx1 - bx0, by1 - by0);
  const reach = Math.round(size * 0.6);
  const wx0 = Math.max(0, bx0 - reach);
  const wy0 = Math.max(0, by0 - reach);
  const ww = Math.min(w, bx1 + reach + 1) - wx0;
  const wh = Math.min(h, by1 + reach + 1) - wy0;
  const isPaper = (k: number) => {
    const o = ((wy0 + Math.floor(k / ww)) * w + wx0 + (k % ww)) * 4;
    return Math.abs(data[o] - paper[0]) + Math.abs(data[o + 1] - paper[1]) + Math.abs(data[o + 2] - paper[2]) < 60;
  };

  const queue = new Int32Array(ww * wh);
  const region = new Uint8Array(ww * wh);
  let tail = 0;
  for (let i = 1; i < 8; i++) {
    for (let j = 1; j < 8; j++) {
      const x = bx0 - wx0 + Math.floor(((bx1 - bx0) * i) / 8);
      const y = by0 - wy0 + Math.floor(((by1 - by0) * j) / 8);
      const k = y * ww + x;
      if (!region[k] && isPaper(k)) {
        region[k] = 1;
        queue[tail++] = k;
      }
    }
  }
  if (!tail) return null;
  let open = false;
  const flood = (k: number) => {
    if (!region[k] && isPaper(k)) {
      region[k] = 1;
      queue[tail++] = k;
    }
  };
  for (let head = 0; head < tail; head++) {
    const k = queue[head];
    const x = k % ww;
    const y = (k - x) / ww;
    if (x === 0 || y === 0 || x === ww - 1 || y === wh - 1) open = true;
    if (x > 0) flood(k - 1);
    if (x < ww - 1) flood(k + 1);
    if (y > 0) flood(k - ww);
    if (y < wh - 1) flood(k + ww);
  }

  const outside = new Uint8Array(ww * wh);
  tail = 0;
  const escape = (k: number) => {
    if (!region[k] && !outside[k]) {
      outside[k] = 1;
      queue[tail++] = k;
    }
  };
  for (let x = 0; x < ww; x++) {
    escape(x);
    escape((wh - 1) * ww + x);
  }
  for (let y = 0; y < wh; y++) {
    escape(y * ww);
    escape(y * ww + ww - 1);
  }
  for (let head = 0; head < tail; head++) {
    const k = queue[head];
    const x = k % ww;
    const y = (k - x) / ww;
    if (x > 0) escape(k - 1);
    if (x < ww - 1) escape(k + 1);
    if (y > 0) escape(k - ww);
    if (y < wh - 1) escape(k + ww);
  }

  const margin = Math.round(size * 0.25);
  const zx0 = open ? Math.max(0, bx0 - wx0 - margin) : 0;
  const zx1 = open ? Math.min(ww - 1, bx1 - wx0 + margin) : ww - 1;
  const zy0 = open ? Math.max(0, by0 - wy0 - margin) : 0;
  const zy1 = open ? Math.min(wh - 1, by1 - wy0 + margin) : wh - 1;
  const inZone = (k: number) => {
    const x = k % ww;
    const y = (k - x) / ww;
    return x >= zx0 && x <= zx1 && y >= zy0 && y <= zy1;
  };
  const covered = new Uint8Array(ww * wh);
  for (let k = 0; k < ww * wh; k++) if (region[k] && inZone(k)) covered[k] = 1;
  // Each enclosed blob (usually one letter) is painted only if it sits wholly inside the zone, so a
  // neighbouring bubble's word is never cut in half.
  const seen = new Uint8Array(ww * wh);
  for (let start = 0; start < ww * wh; start++) {
    if (region[start] || outside[start] || seen[start]) continue;
    let size = 0;
    let inside = true;
    seen[start] = 1;
    queue[size++] = start;
    for (let head = 0; head < size; head++) {
      const k = queue[head];
      const x = k % ww;
      if (!inZone(k)) inside = false;
      for (const n of [x > 0 ? k - 1 : -1, x < ww - 1 ? k + 1 : -1, k - ww, k + ww]) {
        if (n >= 0 && n < ww * wh && !region[n] && !outside[n] && !seen[n]) {
          seen[n] = 1;
          queue[size++] = n;
        }
      }
    }
    if (inside) for (let i = 0; i < size; i++) covered[queue[i]] = 1;
  }

  let minX = ww;
  let maxX = -1;
  let minY = wh;
  let maxY = -1;
  for (let k = 0; k < ww * wh; k++) {
    if (!covered[k]) continue;
    const x = k % ww;
    const y = (k - x) / ww;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  if (maxX < 0) return null;

  const mw = maxX - minX + 1;
  const mh = maxY - minY + 1;
  const canvas = document.createElement("canvas");
  canvas.width = mw;
  canvas.height = mh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const out = ctx.createImageData(mw, mh);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      if (!covered[(y + minY) * ww + x + minX]) continue;
      const o = (y * mw + x) * 4;
      out.data[o] = paper[0];
      out.data[o + 1] = paper[1];
      out.data[o + 2] = paper[2];
      out.data[o + 3] = 255;
    }
  }
  ctx.putImageData(out, 0, 0);
  const maskBox: Box = [
    ((wy0 + minY) / h) * 1000,
    ((wx0 + minX) / w) * 1000,
    ((wy0 + maxY + 1) / h) * 1000,
    ((wx0 + maxX + 1) / w) * 1000,
  ];
  // A closed bubble gives the Tamil its whole interior; an open one keeps to Gemma's box.
  return { maskBox, mask: canvas.toDataURL(), textBox: open ? padded(box) : maskBox, round: !open };
}
