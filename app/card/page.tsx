import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { Bubble, Logo } from "@/components/Comic";
import { CARD_LINE } from "@/lib/showcase";
import rooftop from "@/public/art/rooftop-reader.jpg";

export const metadata: Metadata = { title: "Inkdub share card", robots: { index: false } };

/**
 * The social share card, laid out at exactly 1200×630. `pnpm shoot` screenshots it into
 * app/opengraph-image.png, so the card uses the real fonts and real Gemma output.
 */
export default function Card() {
  return (
    <div className="paper relative h-[630px] w-[1200px] overflow-hidden">
      <div className="focus-lines absolute inset-0 opacity-[0.12]" style={{ "--fx": "26%", "--fy": "52%" } as CSSProperties} />

      <div className="absolute top-[38px] right-[40px] bottom-[38px] w-[600px] rotate-[1.5deg] border-[4px] border-ink bg-paper-hi shadow-[10px_10px_0_var(--ink)]">
        <Image src={rooftop} alt="" fill priority sizes="600px" className="object-cover object-[40%_50%]" />
        <Bubble className="absolute top-[34px] left-[190px] w-[230px]" rotate={-5}>
          <span className="font-bubble text-[44px] leading-none font-extrabold">{CARD_LINE}</span>
        </Bubble>
      </div>

      <div className="relative flex h-full w-[560px] flex-col justify-center gap-7 pl-14">
        <Logo />
        <div>
          <Bubble className="w-[500px]">
            <p className="font-letter text-[50px] leading-[0.95] font-extrabold tracking-tight uppercase">Anime gets dubs.</p>
          </Bubble>
          <Bubble burst fill="var(--accent)" className="-mt-4 ml-14 w-[440px]" rotate={-4}>
            <p className="font-letter text-[40px] leading-[0.95] font-extrabold tracking-tight text-paper-hi uppercase">
              Manga never did!
            </p>
          </Bubble>
        </div>
        <p className="font-mono text-[15px] font-semibold tracking-[0.08em] uppercase">
          Tamil · Tanglish · Madras Bashai · Gemma 4
        </p>
      </div>
    </div>
  );
}
