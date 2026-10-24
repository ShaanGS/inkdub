import type { Metadata } from "next";
import Image from "next/image";
import { CARD_LINE } from "@/lib/showcase";
import rooftop from "@/public/art/rooftop-reader.jpg";

export const metadata: Metadata = { title: "Inkdub share card", robots: { index: false } };

/**
 * The social share card, laid out at exactly 1200×630. `pnpm card` screenshots it into
 * app/opengraph-image.png, so the card uses the real fonts and real Gemma output.
 */
export default function Card() {
  return (
    <div className="relative h-[630px] w-[1200px] overflow-hidden bg-ink">
      <div className="absolute inset-y-0 right-0 w-[760px]">
        <Image src={rooftop} alt="" fill priority sizes="760px" className="object-cover object-[46%_50%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/20 to-transparent" />
      </div>
      <div className="halftone absolute inset-0 [mask-image:linear-gradient(to_right,black,transparent_45%)]" />

      <div className="absolute top-[118px] left-[700px] -rotate-6">
        <div className="relative rounded-[999px] border-[3px] border-ink bg-paper px-9 py-5 shadow-[6px_6px_0_0_var(--accent)]">
          <span className="font-bubble text-5xl leading-none font-extrabold text-ink">{CARD_LINE}</span>
          <span className="absolute -bottom-[18px] left-16 h-0 w-0 border-x-[14px] border-t-[20px] border-x-transparent border-t-ink" />
        </div>
      </div>

      <div className="relative flex h-full w-[640px] flex-col justify-center pl-16">
        <p className="font-display text-3xl tracking-tight">
          Ink<span className="text-accent">dub</span>
        </p>
        <h1 className="mt-6 font-display text-[64px] leading-[0.98] tracking-tight">
          Anime gets dubs.
          <br />
          <span className="text-accent">Manga never did.</span>
        </h1>
        <p className="mt-6 max-w-[500px] text-[22px] leading-snug text-paper/75">
          Any comic page, lettered in Tamil, Tanglish or Madras Bashai.
        </p>
        <p className="mt-8 flex gap-2 text-sm font-semibold text-paper/80">
          <span className="rounded-full border border-white/15 px-3 py-1">Gemma 4</span>
          <span className="rounded-full border border-white/15 px-3 py-1">Open source</span>
          <span className="rounded-full border border-white/15 px-3 py-1">inkdub-app.vercel.app</span>
        </p>
      </div>
    </div>
  );
}
