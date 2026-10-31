"use client";

import { track } from "@vercel/analytics";
import { useVoice } from "@/lib/voice-player";

/** A small play stamp that speaks one shipped clip. Renders nothing when there is no clip. */
export function HearLine({ src, label }: { src: string | null; label: string }) {
  const { speaking, play, stop } = useVoice();
  if (!src) return null;
  const on = speaking !== null;
  return (
    <button
      type="button"
      aria-label={on ? "Stop" : label}
      onClick={() => {
        if (on) return stop();
        track("voice_home");
        play(0, src);
      }}
      className={`ml-2 inline-flex items-center gap-1 border-2 border-ink px-1.5 align-middle font-mono text-[10px] leading-4 font-semibold tracking-[0.1em] uppercase transition ${
        on ? "bg-sun text-ink" : "bg-paper-hi text-ink hover:bg-ink hover:text-paper-hi"
      }`}
    >
      {on ? "■ stop" : "▶ hear"}
    </button>
  );
}
