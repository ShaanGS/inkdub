"use client";

import { AnimatePresence, motion } from "motion/react";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { creditLabel } from "@/lib/share";
import type { DubResult, View } from "@/lib/types";
import { Caption, Tag } from "./Comic";
import { DubbedPage } from "./DubbedPage";
import { SaveButton } from "./Share";
import { StyleSwitch } from "./StyleSwitch";

type Upload = { url: string; width: number; height: number };
type State =
  | { phase: "idle" }
  | { phase: "dubbing"; page: Upload; started: number }
  | { phase: "done"; page: Upload; result: DubResult; cached: boolean }
  | { phase: "error"; page: Upload; message: string };

const SAMPLES = ["P03", "P07", "P09"].map((id) => `/comics/pepper-carrot/ep06/en/${id}.jpg`);
const STAGES = ["Reading the page", "Finding every bubble", "Localizing into Tamil", "Lettering it back in"];
const MAX_SIDE = 1600; // keeps uploads well under the 4.5 MB request limit while staying readable to Gemma

export function LiveDub() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [view, setView] = useState<View>("tamil");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const dub = useCallback(async (source: Blob | string) => {
    const sample = typeof source === "string" ? SAMPLES.indexOf(source) : -1;
    const page = await toJpeg(source);
    setState({ phase: "dubbing", page, started: Date.now() });
    setView("tamil");
    // On a phone the page sits below the intro; bring it up so the scan is actually seen.
    if (window.innerWidth < 1024) stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    track("dub_started", { source: sample >= 0 ? "sample" : "upload" });
    try {
      const response = await fetch("/api/dub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: page.url }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Something went wrong. Try again in a moment.");
      const result = body as DubResult;
      setState({ phase: "done", page, result, cached: false });
      track("dub_done", { bubbles: result.bubbles.length, seconds: Math.round(result.ms / 1000) });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      track("dub_failed", { source: sample >= 0 ? "sample" : "upload" });
      // When Gemma is swamped, the sample pages fall back to the dub Gemma made of them earlier.
      if (sample >= 0) {
        const cached = await fetch(SAMPLES[sample].replace("/en/", "/gemma/").replace(".jpg", ".json"))
          .then((r) => r.json() as Promise<{ model: string; bubbles: DubResult["bubbles"] }>)
          .catch(() => null);
        if (cached) return setState({ phase: "done", page, result: { ...cached, ms: 0 }, cached: true });
      }
      setState({ phase: "error", page, message });
    }
  }, []);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) dub(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [dub]);

  const page = state.phase === "idle" ? null : state.page;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pt-2 pb-16 lg:grid-cols-[1fr_minmax(0,540px)]">
      <div className="lg:pt-8">
        <Tag>Live · Gemma 4</Tag>
        <h1 className="mt-5 font-display text-5xl leading-[0.95] sm:text-6xl">
          Dub any page,
          <br />
          <span className="text-accent">live.</span>
        </h1>
        <p className="mt-6 max-w-md font-letter text-lg leading-snug">
          Drop in a comic or manga page. Gemma 4 finds every bubble and localizes it, and Inkdub letters the Tamil back
          into the art. Usually in fifteen to forty seconds.
        </p>
        <div className="mt-9">
          <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
            Or try a real page
          </p>
          <div className="flex gap-3">
            {SAMPLES.map((src, i) => (
              <motion.button
                key={src}
                type="button"
                disabled={state.phase === "dubbing"}
                onClick={() => dub(src)}
                whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-20 border-[2.5px] border-ink bg-paper-hi shadow-[4px_4px_0_var(--ink)] disabled:opacity-40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny local thumbnails */}
                <img src={src} alt="Sample comic page" className="block aspect-[1200/1660] w-full object-cover" />
              </motion.button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {state.phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
              <StyleSwitch value={view} onChange={setView} />
              <p className="font-mono text-xs leading-relaxed text-ink-soft">
                {state.result.bubbles.length} bubbles lettered by{" "}
                <span className="font-semibold text-ink">{state.result.model}</span>{" "}
                {state.cached
                  ? "earlier. Gemma is swamped right now, so this is the dub it made of this page before."
                  : `in ${(state.result.ms / 1000).toFixed(1)}s`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <Link
          href="/read"
          className="mt-10 inline-block font-mono text-xs font-semibold tracking-[0.1em] uppercase underline-offset-4 hover:underline"
        >
          ← Read the full episode in Tamil
        </Link>
      </div>

      <div
        ref={stageRef}
        className="scroll-mt-4"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
          if (file) dub(file);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && dub(e.target.files[0])}
        />
        <AnimatePresence mode="wait">
          {!page ? (
            <motion.button
              key="drop"
              type="button"
              onClick={() => inputRef.current?.click()}
              initial={{ opacity: 0, rotate: 1 }}
              animate={{ opacity: 1, rotate: dragging ? -1.5 : 0, scale: dragging ? 1.02 : 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className={`relative grid aspect-[1200/1660] w-full grid-rows-[1.2fr_1fr] gap-3 border-[3px] p-4 transition-colors ${
                dragging ? "border-accent bg-accent/10" : "border-ink bg-paper-hi"
              } shadow-[8px_8px_0_var(--ink)]`}
            >
              {/* A blank page with panel guides, waiting for art. */}
              <span className="border-2 border-dashed border-ink/30" />
              <span className="grid grid-cols-[1fr_1.3fr] gap-3">
                <span className="border-2 border-dashed border-ink/30" />
                <span className="border-2 border-dashed border-ink/30" />
              </span>
              <span className="absolute inset-0 grid place-items-center text-center">
                <span>
                  <span className="block font-letter text-4xl font-extrabold uppercase pointer-coarse:hidden">Drop a page</span>
                  <span className="hidden font-letter text-4xl font-extrabold uppercase pointer-coarse:block">Add a page</span>
                  <span className="mt-2 block font-mono text-xs tracking-[0.1em] text-ink-soft uppercase pointer-coarse:hidden">
                    or click to upload · or paste ⌘V
                  </span>
                  <span className="mt-2 hidden font-mono text-xs tracking-[0.1em] text-ink-soft uppercase pointer-coarse:block">
                    Tap to pick a photo or screenshot
                  </span>
                </span>
              </span>
            </motion.button>
          ) : (
            <motion.div
              key={page.url}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative border-[3px] border-ink bg-paper-hi shadow-[8px_8px_0_var(--ink)]"
            >
              {state.phase === "done" ? (
                <div ref={pageRef}>
                  <DubbedPage
                    src={page.url}
                    alt="Your page, lettered in Tamil"
                    width={page.width}
                    height={page.height}
                    bubbles={state.result.bubbles}
                    view={view}
                    playKey={page.url}
                  />
                </div>
              ) : (
                <div className="relative overflow-hidden" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the upload */}
                  <img src={page.url} alt="Your page" className="absolute inset-0 h-full w-full" />
                  {state.phase === "dubbing" && <Scanner started={state.started} />}
                  {state.phase === "error" && (
                    <div className="absolute inset-0 grid place-items-center bg-paper/80 p-6">
                      <Caption className="max-w-xs text-center">
                        <p className="font-letter font-bold">{state.message}</p>
                        <button type="button" onClick={() => dub(page.url)} className="stamp stamp-ink mt-4">
                          Try again
                        </button>
                      </Caption>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {page && state.phase !== "dubbing" && (
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
            {state.phase === "done" && (
              <SaveButton
                target={pageRef}
                pixelWidth={page.width}
                name={`inkdub-${view}`}
                label={creditLabel(view)}
                className="stamp-ink"
              />
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-mono text-xs font-semibold tracking-[0.1em] uppercase underline-offset-4 hover:underline"
            >
              Dub another page
            </button>
          </div>
        )}
        <p className="mt-6 max-w-md font-mono text-[10px] leading-relaxed tracking-[0.04em] text-ink-soft">
          Your page goes to Google&apos;s Gemini API to be read and is not stored by Inkdub. Please only dub pages you
          have the right to share.
        </p>
      </div>
    </div>
  );
}

/** While Gemma works: a band of screentone sweeps the page, with the likely stage and an honest clock. */
function Scanner({ started }: { started: number }) {
  const [now, setNow] = useState(started);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);
  const seconds = (now - started) / 1000;
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(seconds / 4.5))];
  return (
    <div className="absolute inset-0">
      <motion.div
        className="tone absolute inset-x-0 h-1/4 opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_40%,black_60%,transparent)]"
        initial={{ top: "-25%" }}
        animate={{ top: "100%" }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-3 bottom-3">
        <Caption className="flex items-center justify-between gap-3 font-mono text-xs font-semibold tracking-[0.06em] uppercase">
          <AnimatePresence mode="wait">
            <motion.span key={stage} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {stage}…
            </motion.span>
          </AnimatePresence>
          <span className="text-ink-soft tabular-nums">Gemma 4 · {seconds.toFixed(1)}s</span>
        </Caption>
      </div>
    </div>
  );
}

/** Re-encode any upload as a JPEG no larger than MAX_SIDE on its long edge. */
async function toJpeg(source: Blob | string): Promise<Upload> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  const img = new Image();
  img.src = url;
  await img.decode();
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (typeof source !== "string") URL.revokeObjectURL(url);
  return { url: canvas.toDataURL("image/jpeg", 0.88), width: canvas.width, height: canvas.height };
}
