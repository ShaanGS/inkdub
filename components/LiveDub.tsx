"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DubResult, View } from "@/lib/types";
import { DubbedPage } from "./DubbedPage";
import { StyleSwitch } from "./StyleSwitch";

type Upload = { url: string; width: number; height: number };
type State =
  | { phase: "idle" }
  | { phase: "dubbing"; page: Upload; started: number }
  | { phase: "done"; page: Upload; result: DubResult }
  | { phase: "error"; page: Upload; message: string };

const SAMPLES = ["P03", "P07", "P09"].map((id) => `/comics/pepper-carrot/ep06/en/${id}.jpg`);
const STAGES = ["Reading the page", "Finding every bubble", "Localizing into Tamil", "Lettering it back in"];
const MAX_SIDE = 1600; // keeps uploads well under the 4.5 MB request limit while staying readable to Gemma

export function LiveDub() {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [view, setView] = useState<View>("tamil");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const dub = useCallback(async (source: Blob | string) => {
    const page = await toJpeg(source);
    setState({ phase: "dubbing", page, started: Date.now() });
    setView("tamil");
    try {
      const response = await fetch("/api/dub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: page.url }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Something went wrong.");
      setState({ phase: "done", page, result: body as DubResult });
    } catch (error) {
      setState({ phase: "error", page, message: error instanceof Error ? error.message : String(error) });
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
    <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 pt-4 pb-16 lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="lg:pt-10">
        <h1 className="font-display text-4xl leading-tight sm:text-5xl">
          Dub any page, <span className="text-accent">live.</span>
        </h1>
        <p className="mt-4 max-w-md text-paper/65">
          Drop in a comic or manga page. Gemma 4 finds every bubble, localizes it, and Inkdub letters the Tamil back
          into the art, usually in under twenty seconds.
        </p>
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold tracking-wider text-paper/40 uppercase">Or try a real page</p>
          <div className="flex gap-3">
            {SAMPLES.map((src) => (
              <button
                key={src}
                type="button"
                disabled={state.phase === "dubbing"}
                onClick={() => dub(src)}
                className="group relative h-28 w-20 overflow-hidden rounded-lg ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-accent disabled:opacity-40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny local thumbnails */}
                <img src={src} alt="Sample comic page" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {state.phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-10 space-y-4">
              <StyleSwitch id="live" value={view} onChange={setView} />
              <p className="text-sm text-paper/50">
                {state.result.bubbles.length} bubbles lettered by{" "}
                <span className="text-paper/80">{state.result.model}</span> in {(state.result.ms / 1000).toFixed(1)}s
                · tap a bubble to see the original
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <Link href="/read" className="mt-10 inline-block text-sm text-paper/50 underline-offset-4 hover:text-paper hover:underline">
          ← Read the full Pepper&amp;Carrot episode in Tamil
        </Link>
      </div>

      <div
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: dragging ? 1.02 : 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`halftone grid aspect-[1200/1660] w-full place-items-center rounded-2xl border-2 border-dashed transition-colors ${
                dragging ? "border-accent bg-accent/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"
              }`}
            >
              <span className="text-center">
                <span className="block font-display text-2xl">Drop a page here</span>
                <span className="mt-2 block text-sm text-paper/50">or click to upload · or paste with ⌘V</span>
              </span>
            </motion.button>
          ) : (
            <motion.div
              key={page.url}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
            >
              {state.phase === "done" ? (
                <DubbedPage
                  src={page.url}
                  alt="Your page, lettered in Tamil"
                  width={page.width}
                  height={page.height}
                  bubbles={state.result.bubbles}
                  view={view}
                  playKey={page.url}
                />
              ) : (
                <div className="relative" style={{ aspectRatio: `${page.width} / ${page.height}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the upload */}
                  <img src={page.url} alt="Your page" className="absolute inset-0 h-full w-full" />
                  {state.phase === "dubbing" && <Scanner started={state.started} />}
                  {state.phase === "error" && (
                    <div className="absolute inset-0 grid place-items-center bg-ink/70 p-6 text-center backdrop-blur-sm">
                      <div>
                        <p className="font-semibold">{state.message}</p>
                        <button
                          type="button"
                          onClick={() => dub(page.url)}
                          className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {page && state.phase !== "dubbing" && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-4 text-sm text-paper/50 underline-offset-4 hover:text-paper hover:underline"
          >
            Dub another page
          </button>
        )}
      </div>
    </div>
  );
}

/** While Gemma works: a scanning beam, the stage it is probably on, and an honest clock. */
function Scanner({ started }: { started: number }) {
  const [now, setNow] = useState(started);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, []);
  const seconds = (now - started) / 1000;
  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(seconds / 4.5))];
  return (
    <div className="absolute inset-0 overflow-hidden bg-ink/35">
      <motion.div
        className="absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-accent/45 to-transparent mix-blend-screen"
        initial={{ top: "-15%" }}
        animate={{ top: "105%" }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink/90 to-transparent p-4 pt-12">
        <AnimatePresence mode="wait">
          <motion.span
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold"
          >
            {stage}…
          </motion.span>
        </AnimatePresence>
        <span className="text-sm text-paper/60 tabular-nums">Gemma 4 · {seconds.toFixed(1)}s</span>
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
