import { ApiError, GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { Bubble, DubResult, Tone } from "./types";

// Gemma 4 is an open-weight model (Apache 2.0). We call it through the Gemini API with the reader's own
// key, straight from their browser (scripts pass one from the environment); the same weights also run
// locally with Ollama, llama.cpp or MLX.
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

const RETRYABLE = new Set([429, 500, 502, 503, 504]);

/** One Gemma 4 call per page: find every bubble, read it, and localize it three ways. */
export async function dubPage(
  image: { mimeType: string; data: string },
  { apiKey, cast }: { apiKey: string; cast?: string },
): Promise<DubResult> {
  const ai = new GoogleGenAI({ apiKey });
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
        // A bad key fails the same way on every model, so stop at once.
        if (error instanceof ApiError && badKey(error)) throw error;
        if (error instanceof ApiError && !RETRYABLE.has(error.status)) break;
        await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

/** A cheap call that tells a working key from a mistyped one before a whole page is sent. */
export async function checkKey(apiKey: string) {
  await new GoogleGenAI({ apiKey }).models.get({ model: MODELS[0] });
}

const badKey = (error: ApiError) =>
  error.status === 401 || error.status === 403 || (error.status === 400 && /api key/i.test(error.message));

/** True when the failure means the key itself is wrong, so the reader should be asked for another. */
export const isKeyError = (error: unknown) => error instanceof ApiError && badKey(error);

/** What to tell a reader when their call fails, in plain words. */
export function explain(error: unknown) {
  const status = error instanceof ApiError ? error.status : 0;
  const message = error instanceof Error ? error.message : String(error);
  if (isKeyError(error)) return "That Gemini key didn't work. Check it, or make a new one in Google AI Studio.";
  if (status === 429) return "Your key's free quota is used up for the moment. Wait a minute and try again.";
  if (status >= 500) return "Gemma is busy right now. Give it a few seconds and try again.";
  if (/bubble list|JSON/i.test(message)) return "Gemma's answer came back garbled. Try the page again.";
  return "Couldn't reach Gemma. Check your connection and try again.";
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
