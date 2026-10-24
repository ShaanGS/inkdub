"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Letters text as large as its box allows: binary-searches the font size until nothing overflows.
 * Lines are balanced so a bubble reads as a rounded block, the way a letterer would set it.
 */
export function FitText({ text, max = 44, lineHeight = 1.3 }: { text: string; max?: number; lineHeight?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const span = textRef.current;
    if (!box || !span) return;
    const fit = () => {
      let lo = 4;
      let hi = max;
      while (hi - lo > 0.4) {
        const mid = (lo + hi) / 2;
        span.style.fontSize = `${mid}px`;
        const fits = span.scrollHeight <= box.clientHeight && span.scrollWidth <= box.clientWidth;
        if (fits) lo = mid;
        else hi = mid;
      }
      span.style.fontSize = `${lo}px`;
    };
    fit();
    // Web fonts can land after the first fit and change every measurement.
    document.fonts?.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text, max]);

  return (
    <div ref={boxRef} className="flex h-full w-full items-center justify-center overflow-hidden">
      {/* Words shrink rather than break: a Tamil word split mid-syllable reads badly. */}
      <span
        ref={textRef}
        className="block w-full text-center [overflow-wrap:normal] [text-wrap:balance]"
        style={{ lineHeight }}
      >
        {text}
      </span>
    </div>
  );
}
