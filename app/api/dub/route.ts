import { ApiError } from "@google/genai";
import { dubPage } from "@/lib/gemma";

export const maxDuration = 300;

const DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/;

// A light per-visitor brake so one tab (or one script) can't spend the whole Gemini quota.
// It lives in the function instance's memory: Fluid Compute reuses instances, so it holds under real
// traffic, but it is a speed bump, not a guarantee. Put a firewall rate-limit rule in front for that.
const WINDOW_MS = 10 * 60 * 1000;
const PER_WINDOW = 8;
const recent = new Map<string, number[]>();

function allow(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (hits.length >= PER_WINDOW) {
    recent.set(ip, hits);
    return Math.ceil((WINDOW_MS - (now - hits[0])) / 60_000);
  }
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.delete(recent.keys().next().value!);
  return 0;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: "Live dubbing is switched off on this deployment: it has no GEMINI_API_KEY." },
      { status: 503 },
    );
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const wait = allow(ip);
  if (wait) {
    return Response.json(
      { error: `You've dubbed a lot of pages! Give Gemma ${wait} minute${wait > 1 ? "s" : ""} and try again.` },
      { status: 429, headers: { "Retry-After": String(wait * 60) } },
    );
  }

  const { image, cast } = (await request.json().catch(() => ({}))) as { image?: string; cast?: string };
  const match = DATA_URL.exec(image ?? "");
  if (!match) {
    return Response.json({ error: "Send the page as a PNG, JPEG or WebP image." }, { status: 400 });
  }
  try {
    return Response.json(await dubPage({ mimeType: match[1], data: match[2] }, cast));
  } catch (error) {
    console.error("dub failed", error);
    if (error instanceof ApiError && error.status === 429) {
      return Response.json(
        { error: "So many people are dubbing right now that Gemma's free quota ran out. Try again in a minute." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
    return Response.json({ error: "Gemma is busy right now. Give it a few seconds and try again." }, { status: 502 });
  }
}
