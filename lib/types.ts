export type Style = "tamil" | "tanglish" | "madras";
export type View = Style | "original";
export type Tone = "calm" | "excited" | "shout" | "whisper" | "sad" | "thinking";

export type Bubble = {
  /** [ymin, xmin, ymax, xmax] normalized to 0–1000, exactly as Gemma 4 returns it. */
  box_2d: [number, number, number, number];
  text: string;
  kind: "speech" | "thought" | "narration";
  speaker: string;
  tone: Tone;
  tamil: string;
  tanglish: string;
  madras: string;
};

export type DubResult = { model: string; bubbles: Bubble[]; ms: number };
