"use client";

import { motion, useInView } from "motion/react";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { FitText } from "./FitText";

/** The wordmark: a hanko seal carrying இ, the Tamil "I", beside INKDUB in poster gothic. */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Inkdub home">
      <span className="grid size-9 -rotate-6 place-items-center rounded-[5px] bg-accent font-tamil text-xl leading-none font-bold text-paper-hi shadow-[2px_2px_0_var(--ink)] transition-transform duration-300 group-hover:rotate-3">
        இ
      </span>
      <span className={`font-display text-xl tracking-tight ${light ? "text-paper-hi" : "text-ink"}`}>INKDUB</span>
    </Link>
  );
}

/**
 * A manga panel: content clipped to a (possibly slanted) polygon, with an ink border that draws
 * itself in the first time the panel scrolls into view.
 */
export function Panel({
  points = "0,0 100,0 100,100 0,100",
  className = "",
  delay = 0,
  children,
}: {
  points?: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  // Watch the panel, not the border: a fully clipped element never registers as on screen.
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const clip = `polygon(${points
    .split(" ")
    .map((p) => p.split(",").map((n) => `${n}%`).join(" "))
    .join(",")})`;
  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative h-full" style={{ clipPath: clip }}>
        {children}
      </div>
      {/* The border keeps a constant 3px on screen, so it is inked in with a wipe rather than a
          dash animation (dash lengths are measured after the non-uniform scale and come out dotted). */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ clipPath: "inset(-3% 103% -3% -3%)" }}
        animate={inView ? { clipPath: "inset(-3% -3% -3% -3%)" } : undefined}
        transition={{ duration: 0.8, delay, ease: [0.65, 0, 0.35, 1] }}
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <polygon
            points={points}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={3}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </motion.div>
    </div>
  );
}

// An oval speech bubble in a 200×120 box with a tail leaving between two angles (degrees, y down).
function bubblePath(from: number, to: number, tip: [number, number]) {
  const [cx, cy, rx, ry] = [100, 55, 96, 50];
  const at = (deg: number) => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
  const [x0, y0] = at(from);
  const [x1, y1] = at(to);
  return `M ${x1} ${y1} A ${rx} ${ry} 0 1 1 ${x0} ${y0} L ${tip[0]} ${tip[1]} Z`;
}

// A shout burst: spikes around an ellipse, irregular but stable between renders.
function burstPath(spikes = 22) {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2;
    const outer = i % 2 === 0;
    const wobble = outer ? 1 + ((i * 37) % 11) / 60 : 0.8 + ((i * 53) % 7) / 90;
    points.push(`${100 + 98 * wobble * 0.97 * Math.cos(angle)},${60 + 56 * wobble * 0.97 * Math.sin(angle)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

const BUBBLE_TAILS = {
  "bottom-left": bubblePath(108, 124, [34, 119]),
  "bottom-right": bubblePath(56, 72, [168, 119]),
} as const;

/** A lettered speech bubble (or a shout burst) that pops in with a little overshoot. */
export function Bubble({
  children,
  tail = "bottom-left",
  burst = false,
  fill = "var(--paper-hi)",
  className = "",
  delay = 0,
  rotate = 0,
}: {
  children: ReactNode;
  tail?: keyof typeof BUBBLE_TAILS;
  burst?: boolean;
  fill?: string;
  className?: string;
  delay?: number;
  rotate?: number;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.55, rotate: rotate - 8 }}
      whileInView={{ opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: "spring", stiffness: 420, damping: 14, delay }}
    >
      <svg viewBox="0 0 200 122" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <path
          d={burst ? burstPath() : BUBBLE_TAILS[tail]}
          fill={fill}
          stroke="var(--ink)"
          strokeWidth={3}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className={`relative grid place-items-center text-center ${burst ? "px-[17%] py-[15%]" : "px-[13%] pt-[9%] pb-[14%]"}`}>
        {children}
      </div>
    </motion.div>
  );
}

/** A sound effect that slams onto the page: oversized, outlined, and a touch of screen shake. */
export function Sfx({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none inline-block font-tamil-display font-extrabold text-paper-hi [paint-order:stroke_fill] [-webkit-text-stroke:3px_var(--ink)] [text-shadow:5px_5px_0_var(--accent)] ${className}`}
      initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -8, x: [0, -5, 4, -2, 0] }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 500, damping: 16, delay, x: { delay: delay + 0.18, duration: 0.3 } }}
    >
      {children}
    </motion.span>
  );
}

/**
 * A line lettered into one of the hero banner's own painted bubbles. `at` is the bubble body's box
 * (tail excluded) as percentages of the banner: left, top, right, bottom. The text keeps to the oval's
 * safe middle and is sized to fit, like the comic reader's lettering.
 */
export function BannerLine({
  at: [left, top, right, bottom],
  text,
  delay = 0,
  className = "",
}: {
  at: [number, number, number, number];
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ left: `${left}%`, top: `${top}%`, width: `${right - left}%`, height: `${bottom - top}%` }}
      initial={{ opacity: 0, scale: 0.4 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 460, damping: 14, delay }}
    >
      {/* Insets on an absolute child are relative to this bubble (padding % would follow the banner's width). */}
      <div className="absolute" style={{ inset: "17% 15%" }}>
        <FitText text={text} max={64} lineHeight={1.12} />
      </div>
    </motion.div>
  );
}

/** A rectangular narration caption, the boxes manga uses for the narrator's voice. */
export function Caption({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-[2.5px] border-ink bg-paper-hi px-4 py-3 shadow-[4px_4px_0_var(--ink)] ${className}`}>{children}</div>
  );
}

/** A small rubber-stamp label. */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-block border-2 border-ink bg-paper-hi px-2 py-0.5 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase ${className}`}
    >
      {children}
    </span>
  );
}
