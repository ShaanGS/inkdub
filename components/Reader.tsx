"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Episode } from "@/lib/episode";
import type { View } from "@/lib/types";
import { BubbleCard } from "./BubbleCard";
import { DubbedPage } from "./DubbedPage";
import { VIEWS } from "@/lib/views";
import { StyleSwitch } from "./StyleSwitch";

type ReaderProps = { episode: Episode; initialPage?: number; initialView?: View };

export function Reader({ episode, initialPage = 0, initialView = "tamil" }: ReaderProps) {
  const [index, setIndex] = useState(initialPage);
  const [direction, setDirection] = useState(1);
  const [view, setView] = useState<View>(initialView);
  const [peek, setPeek] = useState(false);
  const [community, setCommunity] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const page = episode.pages[index];
  const last = episode.pages.length - 1;

  // Keep the address bar shareable: /read?page=4&view=madras opens exactly this.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(index + 1));
    url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);
  }, [index, view]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next > last || next === index) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
      setSelected(null);
    },
    [index, last],
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === " ") {
        e.preventDefault();
        setPeek(true);
      } else if (e.key === "Escape") setSelected(null);
      else if (e.key === "c") setCommunity((on) => !on);
      else if (/^[1-4]$/.test(e.key)) setView(VIEWS[Number(e.key) - 1].id);
    };
    const up = (e: KeyboardEvent) => e.key === " " && setPeek(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [goTo, index]);

  const shown: View = peek ? "original" : view;
  const bubble = selected === null ? null : page.bubbles[selected];

  return (
    <div className="flex min-h-dvh flex-col bg-ink text-paper">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/[0.07] bg-ink/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <Link href="/" className="font-display text-xl tracking-tight">
          Ink<span className="text-accent">dub</span>
        </Link>
        <p className="hidden text-sm text-paper/55 lg:block">
          {episode.series} · Episode {episode.number}: {episode.title}
        </p>
        <StyleSwitch value={view} onChange={setView} />
      </header>

      <main className="relative flex flex-1 items-center justify-center gap-3 px-3 py-5 sm:gap-6">
        <PageArrow label="Previous page" disabled={index === 0} onClick={() => goTo(index - 1)} flip />
        <div className="relative w-full max-w-[min(94vw,calc((100dvh-150px)*1200/1660))]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={`${page.id}-${community}`}
              custom={direction}
              initial={{ opacity: 0, x: 48 * direction, rotate: 0.8 * direction }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              exit={{ opacity: 0, x: -48 * direction, rotate: -0.8 * direction }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className="relative overflow-hidden rounded-lg shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
            >
              {community ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- the community page is shown as-is */}
                  <img
                    src={page.humanTamilSrc}
                    alt={`Page ${index + 1} in the Pepper&Carrot community's Tamil translation`}
                    className="block w-full"
                    style={{ aspectRatio: `${episode.width} / ${episode.height}` }}
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-ink/85 px-3 py-1 text-xs font-medium text-paper backdrop-blur">
                    Human translation by the Pepper&amp;Carrot community
                  </span>
                </>
              ) : (
                <DubbedPage
                  src={page.src}
                  alt={`${episode.series} episode ${episode.number}, page ${index + 1}`}
                  width={episode.width}
                  height={episode.height}
                  bubbles={page.bubbles}
                  view={shown}
                  playKey={page.id}
                  selected={selected}
                  onSelect={setSelected}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <PageArrow label="Next page" disabled={index === last} onClick={() => goTo(index + 1)} />
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/[0.07] px-4 py-3 text-xs text-paper/45 sm:px-6">
        <div className="flex items-center gap-1.5" aria-label="Pages">
          {episode.pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={`Page ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className="relative h-1.5 w-5 overflow-hidden rounded-full bg-white/10 transition hover:bg-white/25"
            >
              {i === index && (
                <motion.span layoutId="page-dot" className="absolute inset-0 rounded-full bg-accent" />
              )}
            </button>
          ))}
          <span className="ml-2 tabular-nums">
            {index + 1} / {last + 1}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onPointerDown={() => setPeek(true)}
            onPointerUp={() => setPeek(false)}
            onPointerLeave={() => setPeek(false)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-paper/70 transition hover:border-white/25 active:bg-white/10"
          >
            Hold to peek at the original <kbd className="ml-1 hidden opacity-60 sm:inline">space</kbd>
          </button>
          <button
            type="button"
            aria-pressed={community}
            onClick={() => setCommunity((on) => !on)}
            className={`rounded-full border px-3 py-1.5 transition ${
              community
                ? "border-accent bg-accent/15 text-paper"
                : "border-white/10 text-paper/70 hover:border-white/25"
            }`}
          >
            Compare with the community&apos;s Tamil <kbd className="ml-1 hidden opacity-60 sm:inline">C</kbd>
          </button>
        </div>
        <p>
          Art &amp; story:{" "}
          <a href={episode.sourceUrl} className="underline decoration-white/20 underline-offset-2 hover:text-paper">
            {episode.author}
          </a>{" "}
          (
          <a href={episode.licenseUrl} className="underline decoration-white/20 underline-offset-2 hover:text-paper">
            {episode.license}
          </a>
          ) · Dub: Gemma 4
        </p>
      </footer>

      <AnimatePresence>
        {bubble && <BubbleCard key={selected} bubble={bubble} model={episode.model} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}

function PageArrow({ label, disabled, onClick, flip }: { label: string; disabled: boolean; onClick: () => void; flip?: boolean }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className="hidden size-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-xl text-paper/70 transition hover:border-white/25 hover:text-paper disabled:pointer-events-none disabled:opacity-20 sm:grid"
    >
      <span className={flip ? "rotate-180" : ""}>→</span>
    </motion.button>
  );
}
