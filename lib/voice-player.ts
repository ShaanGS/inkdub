"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One voice at a time: starting a clip cuts off whatever was playing. `play` resolves true when the
 * clip finishes and false when it fails or is cut off. Each clip is played on behalf of someone (a tap,
 * the page reader), and `stop(by)` only silences clips that `by` started.
 */
export function useVoice() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const cancel = useRef(() => {});
  const owner = useRef<string | null>(null);
  const [speaking, setSpeaking] = useState<number | null>(null);

  const play = useCallback((index: number, src: string, by = "tap") => {
    cancel.current();
    const clip = (audio.current ??= new Audio());
    clip.src = src;
    owner.current = by;
    setSpeaking(index);
    return new Promise<boolean>((resolve) => {
      const finish = (ok: boolean) => {
        clip.onended = clip.onerror = null;
        cancel.current = () => {};
        owner.current = null;
        setSpeaking((now) => (now === index ? null : now));
        resolve(ok);
      };
      cancel.current = () => {
        clip.pause();
        finish(false);
      };
      clip.onended = () => finish(true);
      clip.onerror = () => finish(false);
      clip.play().catch(() => finish(false));
    });
  }, []);

  const stop = useCallback((by?: string) => {
    if (!by || owner.current === by) cancel.current();
  }, []);

  useEffect(() => () => cancel.current(), []);

  return { speaking, play, stop };
}
