"use client";

import { useSyncExternalStore } from "react";

// The reader's own Gemini API key. It is kept in this browser only and sent only to Google, from the
// browser, when a page is dubbed; Inkdub's server never sees it.
const STORAGE = "inkdub.gemini-key";
const listeners = new Set<() => void>();
let memory: string | null = null; // where the key lives when storage is blocked (private mode, previews)

function read() {
  try {
    return localStorage.getItem(STORAGE) ?? memory;
  } catch {
    return memory;
  }
}

function write(key: string | null) {
  memory = key;
  try {
    if (key) localStorage.setItem(STORAGE, key);
    else localStorage.removeItem(STORAGE);
  } catch {
    // Storage is blocked; the key lasts for this visit only.
  }
  listeners.forEach((notify) => notify());
}

export const saveKey = (key: string) => write(key.trim());
export const forgetKey = () => write(null);
export const currentKey = read;

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (e: StorageEvent) => e.key === STORAGE && notify();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

/** The saved key, or null. Null on the server, so the page renders the same before it hydrates. */
export function useGeminiKey() {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** "AIza…f3Qk": enough to recognise which key is saved without showing it. */
export const maskKey = (key: string) => `${key.slice(0, 4)}…${key.slice(-4)}`;
