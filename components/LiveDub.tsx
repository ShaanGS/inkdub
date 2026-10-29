"use client";

import { AnimatePresence, motion } from "motion/react";
import { track } from "@vercel/analytics";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { currentKey, forgetKey } from "@/lib/key";
import { artCredit, creditLabel } from "@/lib/share";
import type { DubResult, View } from "@/lib/types";
import { Caption, Tag } from "./Comic";
import { DubbedPage } from "./DubbedPage";
import { GEMINI_TERMS, KeyCard } from "./KeyCard";
import { SaveButton } from "./Share";
import { StyleSwitch } from "./StyleSwitch";

type Upload = { url: string; width: number; height: number; sample?: boolean };
type State =
  | { phase: "idle" }
  | { phase: "dubbing"; page: Upload; started: number }
  | { phase: "needs-key"; page: Upload; note?: string }
  // `cached` says why a sample shows the dub Gemma made of it earlier instead of a live one.
  | { phase: "done"; page: Upload; result: DubResult; cached?: "no-key" | "busy" }
  | { phase: "error"; page: Upload; message: string };

const SAMPLES = ["P03", "P07", "P09"].map((id) => `/comics/pepper-carrot/ep06/en/${id}.jpg`);
const SAMPLE_ART = { series: "Pepper&Carrot", author: "David Revoy", license: "CC BY 4.0" };
const STAGES = ["Reading the page", "Finding every bubble", "Localizing into Tamil", "Lettering it back in"];
const MAX_SIDE = 1600; // keeps the request small while staying readable to Gemma

/** The dub Gemma made of a sample page earlier, shipped with the site. */
async function cachedDub(sample: string): Promise<DubResult | null> {
  return fetch(sample.replace("/en/", "/gemma/").replace(".jpg", ".json"))
    .then((r) => r.json() as Promise<{ model: string; bubbles: DubResult["bubbles"] }>)
    .then((cached) => ({ ...cached, ms: 0 }))
    .catch(() => null);
}

export function LiveDub() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [view, setView] = useState<View>("tamil");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const dub = useCallback(async (source: Blob | string) => {
    const sample = typeof source === "string" && SAMPLES.includes(source) ? source : null;
    const page = { ...(await toJpeg(source)), sample: !!sample };
    setView("tamil");
    // On a phone the page sits below the intro; bring it up so the result is actually seen.
    if (window.innerWidth < 1024) stageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const apiKey = currentKey();
    if (!apiKey) {
      // No key: samples show the dub Gemma made of them earlier; your own pages wait for a key.
      const cached = sample && (await cachedDub(sample));
      if (cached) return setState({ phase: "done", page, result: cached, cached: "no-key" });
      setState({ phase: "needs-key", page });
      keyRef.current?.focus({ preventScroll: true });
      return;
    }

    setState({ phase: "dubbing", page, started: Date.now() });
    track("dub_started", { source: sample ? "sample" : "upload" });
    const { dubPage, explain, isKeyError } = await import("@/lib/gemma");
    try {
      const [, mimeType, data] = /^data:([^;]+);base64,(.*)$/.exec(page.url) ?? [];
      const result = await dubPage({ mimeType, data }, { apiKey });
      setState({ phase: "done", page, result });
      track("dub_done", { bubbles: result.bubbles.length, seconds: Math.round(result.ms / 1000) });
    } catch (error) {
      console.error(error);
      track("dub_failed", { source: sample ? "sample" : "upload" });
      if (isKeyError(error)) {
        forgetKey();
        return setState({ phase: "needs-key", page, note: explain(error) });
      }
      // When Gemma is swamped, the sample pages fall back to the dub it made of them earlier.
      const cached = sample && (await cachedDub(sample));
      if (cached) return setState({ phase: "done", page, result: cached, cached: "busy" });
      setState({ phase: "error", page, message: explain(error) });
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
        <div className="mt-7">
          <KeyCard
            inputRef={keyRef}
            note={state.phase === "needs-key" ? (state.note ?? "Add a key to dub your page") : undefined}
            // A page dropped before there was a key gets dubbed the moment one is saved.
            onSaved={() => state.phase === "needs-key" && dub(state.page.url)}
          />
        </div>
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
                {state.cached === "no-key"
                  ? "earlier. Add your key to watch it dub a page live."
                  : state.cached === "busy"
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
                  {state.phase === "needs-key" && (
                    <div className="absolute inset-0 grid place-items-center bg-paper/80 p-6">
                      <Caption className="max-w-xs text-center">
                        <p className="font-letter font-bold">
                          {state.note ?? "Add your free Gemini key and this page dubs right away."}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            keyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            keyRef.current?.focus({ preventScroll: true });
                          }}
                          className="stamp stamp-ink mt-4"
                        >
                          Add my key
                        </button>
                      </Caption>
                    </div>
                  )}
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
                art={page.sample ? artCredit(SAMPLE_ART, view) : undefined}
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
          Your page goes from this browser straight to Google&apos;s Gemini API, on your key. Inkdub never sees or
          stores it. On a free key,{" "}
          <a href={GEMINI_TERMS} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-accent">
            Google may use it to improve its products and people may review it
          </a>{" "}
          (not in the EEA, UK or Switzerland), so don&apos;t upload anything private. Please only dub pages you have the
          right to share.
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
