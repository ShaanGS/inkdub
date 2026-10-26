"use client";

import { track } from "@vercel/analytics";
import { domToCanvas } from "modern-screenshot";
import type { View } from "./types";

export const SITE = "inkdub-app.vercel.app";

/**
 * Render a lettered page to a JPEG at the page's own resolution with an Inkdub credit strip along the
 * bottom (so a forwarded image always says where it came from), then hand it to the phone's share
 * sheet when there is one, or download it.
 */
export async function savePage(node: HTMLElement, { pixelWidth, name, label }: { pixelWidth: number; name: string; label: string }) {
  const page = await domToCanvas(node, { scale: Math.max(1, pixelWidth / node.clientWidth) });
  const blob = await withCredit(page, label);
  const file = new File([blob], `${name}.jpg`, { type: "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `Dubbed into Tamil with Inkdub · https://${SITE}` });
      track("page_shared", { via: "share-sheet" });
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
      // Some browsers say they can share files and then refuse; fall through to a download.
    }
  }
  const url = URL.createObjectURL(blob);
  Object.assign(document.createElement("a"), { href: url, download: file.name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  track("page_shared", { via: "download" });
  return "saved" as const;
}

/** Copy a link, or use the share sheet on phones. */
export async function shareLink(url: string, text: string) {
  try {
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ url, text });
      track("link_shared", { via: "share-sheet" });
      return "shared" as const;
    }
    await navigator.clipboard.writeText(url);
    track("link_shared", { via: "clipboard" });
    return "copied" as const;
  } catch {
    return "cancelled" as const;
  }
}

// The family a utility class resolves to, so canvas text uses the same next/font faces as the page.
function family(className: string) {
  const probe = Object.assign(document.createElement("span"), { className });
  document.body.append(probe);
  const value = getComputedStyle(probe).fontFamily;
  probe.remove();
  return value;
}

async function withCredit(page: HTMLCanvasElement, label: string): Promise<Blob> {
  const w = page.width;
  const h = Math.round(w * 0.075);
  const canvas = Object.assign(document.createElement("canvas"), { width: w, height: page.height + h });
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(page, 0, 0);

  const top = page.height;
  const pad = h * 0.32;
  ctx.fillStyle = "#141210";
  ctx.fillRect(0, top, w, h);

  // The painted wordmark, as on the site's header.
  const logo = new Image();
  logo.src = "/brand/inkdub-wordmark.webp";
  await logo.decode();
  const logoH = h * 0.68;
  const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
  ctx.drawImage(logo, pad, top + (h - logoH) / 2, logoW, logoH);

  const mid = top + h / 2;
  ctx.textBaseline = "middle";
  const after = pad + logoW + h * 0.35;

  const mono = family("font-mono");
  ctx.font = `600 ${Math.round(h * 0.2)}px ${mono}`;
  ctx.fillStyle = "rgba(255,252,244,0.62)";
  ctx.fillText(label.toUpperCase(), after, mid);

  ctx.textAlign = "right";
  ctx.fillStyle = "#ffc21a";
  ctx.font = `600 ${Math.round(h * 0.24)}px ${mono}`;
  ctx.fillText(SITE, w - pad, mid);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not render the page"))), "image/jpeg", 0.92),
  );
}

const CREDITS: Record<View, string> = {
  original: "Original lettering",
  tamil: "Tamil · lettered by Gemma 4",
  tanglish: "Tanglish · lettered by Gemma 4",
  madras: "Madras Bashai · lettered by Gemma 4",
};

/** The line on the credit strip for a given dub style. */
export const creditLabel = (view: View) => CREDITS[view];
