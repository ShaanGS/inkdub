"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Episode } from "@/lib/episode";
import { creditLabel } from "@/lib/share";
import type { View } from "@/lib/types";
import { VIEWS } from "@/lib/views";
import { BubbleCard } from "./BubbleCard";
import { Logo } from "./Comic";
import { DubbedPage } from "./DubbedPage";
import { LinkButton, SaveButton } from "./Share";
import { StyleSwitch } from "./StyleSwitch";

type ReaderProps = { episode: Episode; initialPage?: number; initialView?: View };

// Pages turn on their spine: the old page swings away, the new one settles in from the other side.
const turn = {
  enter: (dir: number) => ({ opacity: 0, rotateY: 20 * dir, x: 28 * dir, transformOrigin: dir > 0 ? "100% 50%" : "0% 50%" }),
  center: { opacity: 1, rotateY: 0, x: 0 },
  exit: (dir: number) => ({ opacity: 0, rotateY: -70 * dir, x: -16 * dir, transformOrigin: dir > 0 ? "0% 50%" : "100% 50%" }),
};

export function Reader({ episode, initialPage = 0, initialView = "tamil" }: ReaderProps) {
  const [index, setIndex] = useState(initialPage);
  const [direction, setDirection] = useState(1);
  const [view, setView] = useState<View>(initialView);
  const [peek, setPeek] = useState(false);
  const [community, setCommunity] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
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
    <div className="flex min-h-dvh flex-col bg-night text-paper-hi">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-night/90 px-4 py-3 backdrop-blur sm:px-6">
        <Logo light />
        <p className="hidden font-mono text-[11px] font-semibold tracking-[0.14em] text-paper/60 uppercase lg:block">
          {episode.series} · Ep. {episode.number} · {episode.title}
        </p>
        <StyleSwitch value={view} onChange={setView} />
      </header>

      <main className="relative flex flex-1 items-center justify-center gap-4 px-3 py-6 sm:gap-8">
        <PageArrow label="Previous page" disabled={index === 0} onClick={() => goTo(index - 1)} flip />
        <div className="relative w-full max-w-[min(94vw,calc((100dvh-190px)*1200/1660))] [perspective:1800px]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={`${page.id}-${community}`}
              custom={direction}
              variants={turn}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 210, damping: 26 }}
              // Swipe to turn the page on phones, where the arrows are hidden.
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              dragSnapToOrigin
              onDragEnd={(_, { offset, velocity }) => {
                if (offset.x < -70 || velocity.x < -500) goTo(index + 1);
                else if (offset.x > 70 || velocity.x > 500) goTo(index - 1);
              }}
              className="relative touch-pan-y bg-paper-hi shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] ring-1 ring-black/40"
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
                  <span className="absolute top-3 left-3 border-2 border-ink bg-paper-hi px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.1em] text-ink uppercase">
                    Human translation · Pepper&amp;Carrot community
                  </span>
                </>
              ) : (
                <div ref={pageRef}>
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
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <PageArrow label="Next page" disabled={index === last} onClick={() => goTo(index + 1)} />
      </main>

      <footer className="border-t border-white/10 px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Pages" className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {episode.pages.map((p, i) => (
              <button
                key={p.id}
                type="button"
                aria-label={`Page ${i + 1}`}
                aria-current={i === index}
                onClick={() => goTo(i)}
                className={`relative w-9 shrink-0 transition-transform duration-200 hover:-translate-y-1 ${
                  i === index ? "-translate-y-1.5" : "opacity-55 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny page thumbnails */}
                <img src={p.src} alt="" className="block w-full" style={{ aspectRatio: `${episode.width} / ${episode.height}` }} />
                {i === index && <motion.span layoutId="thumb" className="absolute -inset-1 border-2 border-accent" />}
              </button>
            ))}
            <span className="self-center pl-2 font-mono text-xs text-paper/60 tabular-nums">
              {index + 1}/{last + 1}
            </span>
          </nav>
          <div className="flex flex-wrap gap-2 font-mono text-[11px] font-semibold tracking-[0.1em] uppercase">
            <button
              type="button"
              onPointerDown={() => setPeek(true)}
              onPointerUp={() => setPeek(false)}
              onPointerLeave={() => setPeek(false)}
              className="border-2 border-paper/40 px-3 py-1.5 text-paper/80 transition hover:border-paper hover:text-paper-hi active:bg-paper active:text-ink"
            >
              Hold to peek at the English <kbd className="ml-1 hidden opacity-60 sm:inline">space</kbd>
            </button>
            <button
              type="button"
              aria-pressed={community}
              onClick={() => setCommunity((on) => !on)}
              className={`border-2 px-3 py-1.5 transition ${
                community
                  ? "border-accent bg-accent text-paper-hi"
                  : "border-paper/40 text-paper/80 hover:border-paper hover:text-paper-hi"
              }`}
            >
              Compare with the community&apos;s Tamil <kbd className="ml-1 hidden opacity-60 sm:inline">C</kbd>
            </button>
            <LinkButton
              text={`${episode.series} page ${index + 1}, dubbed into Tamil by Inkdub`}
              className="border-2 border-paper/40 px-3 py-1.5 text-paper/80 transition hover:border-paper hover:text-paper-hi"
            />
            {!community && (
              <SaveButton
                target={pageRef}
                pixelWidth={episode.width}
                name={`inkdub-${episode.series.replace("&", "-and-").toLowerCase()}-p${index + 1}-${view}`}
                label={creditLabel(view)}
                className="stamp-paper !px-3 !py-1.5 !text-[11px] !shadow-[3px_3px_0_var(--accent)]"
              />
            )}
          </div>
        </div>
        <p className="mt-3 font-mono text-[10px] tracking-[0.06em] text-paper/45">
          Art &amp; story:{" "}
          <a href={episode.sourceUrl} className="underline underline-offset-2 hover:text-paper-hi">
            {episode.author}
          </a>{" "}
          (
          <a href={episode.licenseUrl} className="underline underline-offset-2 hover:text-paper-hi">
            {episode.license}
          </a>
          ) · Lettering: {episode.model}
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
      whileHover={{ scale: 1.06, rotate: flip ? 3 : -3 }}
      whileTap={{ scale: 0.9 }}
      className="hidden size-12 shrink-0 place-items-center border-2 border-paper-hi bg-paper-hi font-mono text-lg font-bold text-ink shadow-[4px_4px_0_var(--accent)] disabled:pointer-events-none disabled:opacity-20 sm:grid"
    >
      {flip ? "←" : "→"}
    </motion.button>
  );
}
