"use client";

import { track } from "@vercel/analytics";
import { domToCanvas } from "modern-screenshot";
import type { View } from "./types";

export const SITE = "inkdubs.vercel.app";

/**
 * Render a lettered page to a JPEG at the page's own resolution with an Inkdub credit strip along the
 * bottom (so a forwarded image always says where it came from), then hand it to the phone's share
 * sheet when there is one, or download it. `art` credits the artwork when it is known (the sample
 * comic is CC BY, so its credit has to travel with every copy).
 */
export async function savePage(
  node: HTMLElement,
  { pixelWidth, name, label, art }: { pixelWidth: number; name: string; label: string; art?: string },
) {
  const page = await domToCanvas(node, { scale: Math.max(1, pixelWidth / node.clientWidth) });
  const blob = await withCredit(page, label, art);
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

async function withCredit(page: HTMLCanvasElement, label: string, art?: string): Promise<Blob> {
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
  ctx.fillText(label.toUpperCase(), after, art ? mid - h * 0.14 : mid);
  if (art) {
    ctx.font = `500 ${Math.round(h * 0.15)}px ${mono}`;
    ctx.fillStyle = "rgba(255,252,244,0.5)";
    ctx.fillText(art, after, mid + h * 0.16);
  }

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

/** The CC BY credit for an openly licensed comic: author, license, and that the lettering was changed. */
export const artCredit = ({ series, author, license }: { series: string; author: string; license: string }, view: View) =>
  `${series} by ${author} · ${license}${view === "original" ? "" : " · lettering changed by Inkdub"}`;
