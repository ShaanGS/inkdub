import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { Bubble, DubResult, Tone } from "./types";

// Gemma 4 is an open-weight model (Apache 2.0). We call it through the Gemini API;
// the same weights also run locally with Ollama, llama.cpp or MLX.
export const MODELS = ["gemma-4-26b-a4b-it", "gemma-4-31b-it"] as const;

export const SYSTEM_PROMPT = `You are Inkdub, a manga letterer and localizer for Tamil readers in Chennai.
Localize, never translate word-for-word: keep each character's emotion and voice, adapt honorifics,
and keep the story meaning exact. Keep character names unchanged, written in Tamil script inside Tamil-script fields.`;

export const PAGE_PROMPT = `Find every speech bubble, thought bubble and narration box on this comic page, in reading order.
Skip sound effects drawn outside bubbles. For each one return:
"box_2d": [ymin, xmin, ymax, xmax] integers normalized 0-1000 over the whole image, tight around the text,
"text": the exact original text,
"kind": "speech" | "thought" | "narration",
"speaker": character name or best guess,
"tone": "calm" | "excited" | "shout" | "whisper" | "sad" | "thinking",
"tamil": natural Tamil in Tamil script,
"tanglish": casual spoken Tamil written in English letters,
"madras": Chennai Madras Bashai slang in Tamil script, like "சாரிப்பா... ஒரு பிரியாணி அமுக்கிட்டு வந்தேன்" (never English letters).
Return ONLY a JSON array.`;

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/** One Gemma 4 call per page: find every bubble, read it, and localize it three ways. */
export async function dubPage(image: { mimeType: string; data: string }, cast?: string): Promise<DubResult> {
  const started = Date.now();
  let lastError: unknown;
  for (const model of MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: "user", parts: [{ inlineData: image }, { text: PAGE_PROMPT }] }],
          config: {
            systemInstruction: cast ? `${SYSTEM_PROMPT}\nCast on this page: ${cast}` : SYSTEM_PROMPT,
            temperature: 0.4,
            maxOutputTokens: 16384,
            // Minimal thinking cut a page from ~50s to ~15s in our tests with no visible quality loss.
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
          },
        });
        return { model, bubbles: parseBubbles(response.text ?? ""), ms: Date.now() - started };
      } catch (error) {
        lastError = error;
        // The free tier throws intermittent 500s under load; malformed JSON is worth a second roll too.
        if (error instanceof ApiError && !RETRYABLE.has(error.status)) break;
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export function parseBubbles(text: string): Bubble[] {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("[");
  const end = body.lastIndexOf("]");
  if (start === -1 || end <= start) throw new Error("Gemma returned no bubble list");
  const json = body.slice(start, end + 1);
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    raw = JSON.parse(json.replace(/,\s*([}\]])/g, "$1")); // trailing commas show up now and then
  }
  if (!Array.isArray(raw)) throw new Error("Gemma returned no bubble list");
  return (raw as Record<string, unknown>[]).flatMap(toBubble);
}

const TONES: Tone[] = ["calm", "excited", "shout", "whisper", "sad", "thinking"];

function toBubble(item: Record<string, unknown>): Bubble[] {
  const box = item.box_2d;
  if (!Array.isArray(box) || box.length !== 4 || !box.every((n) => typeof n === "number")) return [];
  const [y0, x0, y1, x1] = box.map((n: number) => Math.min(1000, Math.max(0, n)));
  if (y1 <= y0 || x1 <= x0) return [];
  const text = String(item.text ?? "");
  const tamil = String(item.tamil ?? text);
  return [
    {
      box_2d: [y0, x0, y1, x1],
      text,
      kind: item.kind === "thought" || item.kind === "narration" ? item.kind : "speech",
      speaker: String(item.speaker ?? ""),
      tone: TONES.includes(item.tone as Tone) ? (item.tone as Tone) : "calm",
      tamil,
      tanglish: String(item.tanglish ?? tamil),
      madras: String(item.madras ?? tamil),
    },
  ];
}
