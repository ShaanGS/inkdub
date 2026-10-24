"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Page } from "@/lib/episode";
import type { View } from "@/lib/types";
import { VIEWS } from "@/lib/views";
import { DubbedPage } from "./DubbedPage";
import { StyleSwitch } from "./StyleSwitch";

const CYCLE: View[] = ["original", "tamil", "tanglish", "madras"];
const subscribeNever = () => () => {};

/**
 * The landing page's live specimen: one real page that keeps re-lettering itself until you take over.
 * `/?hero=madras` pins it to one style, for screenshots and links.
 */
export function HeroDemo({ page, width, height }: { page: Page; width: number; height: number }) {
  const [view, setView] = useState<View>("original");
  const [auto, setAuto] = useState(true);
  const pinnedParam = useSyncExternalStore(
    subscribeNever,
    () => new URLSearchParams(window.location.search).get("hero"),
    () => null,
  );
  const pinned = VIEWS.find((v) => v.id === pinnedParam)?.id;

  useEffect(() => {
    if (!auto || pinned) return;
    const timer = setInterval(() => setView((v) => CYCLE[(CYCLE.indexOf(v) + 1) % CYCLE.length]), 2800);
    return () => clearInterval(timer);
  }, [auto, pinned]);

  const shown = auto && pinned ? pinned : view;

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-paper-hi py-2.5 pr-3 pl-[6%]"
        onPointerDown={() => setAuto(false)}
      >
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
          Live · Pepper&amp;Carrot ep.6 p.2
        </span>
        <StyleSwitch value={shown} onChange={setView} />
      </div>
      <DubbedPage
        src={page.src}
        alt="A Pepper&Carrot page lettered in Tamil by Inkdub"
        width={width}
        height={height}
        bubbles={page.bubbles}
        view={shown}
        playKey="hero"
        delay={0.9}
      />
      <p className="mt-auto border-t-[3px] border-ink px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-ink-soft uppercase">
        ↑ Tap a stamp to re-letter this page. Every line here came straight from Gemma 4.
      </p>
    </div>
  );
}
