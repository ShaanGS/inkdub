import { ApiError, GoogleGenAI } from "@google/genai";
import type { Bubble, Style, Tone } from "./types";

// Gemini's speech models voice a dubbed line on the same free key that lettered it. The free tier allows
// about ten lines a day per model, so each one is tried in turn.
export const VOICE_MODELS = [
  "gemini-3.8-flash-tts",
  "gemini-3.8-flash-lite-tts",
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
] as const;

// A director's note on its own line, then the words. Tags in square brackets get read aloud as words.
const DELIVERY: Record<Tone, string> = {
  calm: "Say this naturally",
  excited: "Say this excitedly",
  shout: "Shout this",
  whisper: "Whisper this",
  sad: "Say this sadly",
  thinking: "Say this softly, thinking aloud",
};
const ACCENT: Record<Style, string> = {
  tamil: "like a native Tamil speaker",
  tanglish: "like a native Chennai Tamil speaker talking to a friend",
  madras: "like a native Chennai Tamil speaker, in Madras Bashai",
};

// Speakers keep one voice across a page: a name always hashes to the same one.
const VOICES = ["Leda", "Puck", "Kore", "Fenrir", "Aoede", "Charon", "Zephyr", "Orus"];
export const voiceFor = (speaker: string) =>
  VOICES[[...speaker.toLowerCase()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % VOICES.length];

export const direction = (bubble: Pick<Bubble, "tone" | "kind">, style: Style) =>
  `${bubble.kind === "narration" ? "Narrate this like a storyteller" : DELIVERY[bubble.tone]} ${ACCENT[style]}:`;

/** One bubble's line, spoken. Returns a WAV the browser (or ffmpeg) can play as-is. */
export async function speak(
  bubble: Bubble,
  style: Style,
  { apiKey, voice = voiceFor(bubble.speaker || bubble.kind) }: { apiKey: string; voice?: string },
): Promise<Uint8Array<ArrayBuffer>> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;
  for (const model of VOICE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `${direction(bubble, style)}\n${bubble[style].replace(/\s*\n\s*/g, " ")}`,
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: { languageCode: "ta-IN", voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      });
      const audio = response.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;
      if (!audio?.data) throw new Error("Gemini returned no audio");
      const bytes = Uint8Array.from(atob(audio.data), (c) => c.charCodeAt(0));
      return audio.mimeType?.includes("wav")
        ? bytes
        : wav(bytes, Number(/rate=(\d+)/.exec(audio.mimeType ?? "")?.[1] ?? 24000));
    } catch (error) {
      lastError = error;
      if (error instanceof ApiError && [400, 401, 403].includes(error.status)) break;
    }
  }
  throw lastError;
}

/** Raw 16-bit mono PCM, wrapped in a WAV header. */
function wav(pcm: Uint8Array, rate: number) {
  const out = new Uint8Array(44 + pcm.length);
  const view = new DataView(out.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  text(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, "data");
  view.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}
