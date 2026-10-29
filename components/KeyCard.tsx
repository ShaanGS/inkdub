"use client";

import { track } from "@vercel/analytics";
import { AnimatePresence, motion } from "motion/react";
import { useState, type RefObject } from "react";
import { forgetKey, maskKey, saveKey, useGeminiKey } from "@/lib/key";
import { Caption } from "./Comic";

const GET_KEY = "https://aistudio.google.com/apikey";
export const GEMINI_TERMS = "https://ai.google.dev/gemini-api/terms";

/**
 * Bring your own key: Inkdub has no server bill because each reader dubs with their own free Gemini key,
 * which stays in their browser. Shows the saved key, or a field to paste one (checked before it is kept).
 */
export function KeyCard({
  inputRef,
  note,
  onSaved,
}: {
  inputRef?: RefObject<HTMLInputElement | null>;
  note?: string;
  onSaved?: () => void;
}) {
  const key = useGeminiKey();
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<{ checking: boolean; error?: string }>({ checking: false });

  if (key) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#2f9e44]" aria-hidden />
          Dubbing with your Gemini key <span className="tracking-normal text-ink-soft normal-case">{maskKey(key)}</span>
        </span>
        <button type="button" onClick={forgetKey} className="text-ink-soft underline-offset-4 hover:text-accent hover:underline">
          Forget key
        </button>
      </div>
    );
  }

  const submit = async () => {
    const value = draft.trim();
    if (!value || status.checking) return;
    setStatus({ checking: true });
    const { checkKey, explain } = await import("@/lib/gemma");
    try {
      await checkKey(value);
      saveKey(value);
      setDraft("");
      setStatus({ checking: false });
      track("key_saved");
      onSaved?.();
    } catch (error) {
      setStatus({ checking: false, error: explain(error) });
    }
  };

  return (
    <Caption className="max-w-md">
      <p className="font-display text-lg leading-tight">Bring your own key</p>
      <p className="mt-2 font-letter text-[15px] leading-snug">
        Inkdub runs on <b>your</b> free Gemini key. It stays in this browser, and pages go straight to Google, never to
        Inkdub.
      </p>
      <AnimatePresence>
        {note && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 font-mono text-[11px] font-semibold tracking-[0.06em] text-accent uppercase"
          >
            {note}
          </motion.p>
        )}
      </AnimatePresence>
      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          type="password"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste your Gemini API key"
          aria-label="Gemini API key"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 border-2 border-ink bg-paper-hi px-3 py-2 font-mono text-sm outline-none placeholder:text-ink-soft/70 focus:border-accent"
        />
        <button type="submit" disabled={!draft.trim() || status.checking} className="stamp stamp-ink !px-4 !py-2 disabled:opacity-50">
          {status.checking ? "Checking…" : "Use key"}
        </button>
      </form>
      {status.error && <p className="mt-2 font-mono text-[11px] font-semibold text-accent">{status.error}</p>}
      <p className="mt-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-ink-soft">
        No key?{" "}
        <a href={GET_KEY} target="_blank" rel="noreferrer" className="font-semibold text-ink underline underline-offset-4 hover:text-accent">
          Get one free
        </a>{" "}
        (a minute, no card). The sample pages work without one.
      </p>
      <p className="mt-2 border-t-2 border-dashed border-ink/20 pt-2 font-mono text-[10.5px] leading-relaxed tracking-[0.03em] text-ink-soft">
        On a free key,{" "}
        <a href={GEMINI_TERMS} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-accent">
          Google may use what you send
        </a>{" "}
        to improve its products, and people may review it (not in the EEA, UK or Switzerland). Don&apos;t upload
        anything private.
      </p>
    </Caption>
  );
}
