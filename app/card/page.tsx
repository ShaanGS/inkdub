import type { Metadata } from "next";
import Image from "next/image";
import { BannerLine } from "@/components/Comic";
import banner from "@/public/art/kollywood-banner.jpg";
import wordmark from "@/public/brand/inkdub-wordmark.webp";

export const metadata: Metadata = { title: "Inkdub share card", robots: { index: false } };

/**
 * The social share card, laid out at exactly 1200×630. `pnpm shoot` screenshots it into
 * app/opengraph-image.png: the hero banner with its bubbles lettered, under a movie-poster title.
 */
export default function Card() {
  return (
    <div className="relative h-[630px] w-[1200px] overflow-hidden bg-ink">
      <div className="@container absolute inset-x-0 top-[-14px] aspect-[16/9]">
        <Image src={banner} alt="" fill priority sizes="1200px" className="object-cover" />
        <BannerLine at={[9.2, 10.6, 24.4, 25.7]} className="font-letter font-extrabold uppercase" text="Anime gets dubs!" />
        <BannerLine at={[18.3, 30.6, 26.3, 38]} className="font-letter font-extrabold uppercase" text="…manga?" />
        <BannerLine at={[75.5, 9.5, 91.4, 24.5]} className="font-tamil-display font-extrabold" text="இனி மங்காவுக்கும் டப்பிங்!" />
        <BannerLine at={[79.7, 29.7, 86.8, 36.6]} className="font-tamil-display font-extrabold" text="செம்ம!" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[230px] bg-gradient-to-t from-ink via-ink/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-7 text-center">
        <Image src={wordmark} alt="Inkdub" priority sizes="560px" className="mx-auto h-auto w-[560px] -rotate-1" />
        <p className="mt-2 font-poster text-[28px] tracking-[0.16em] text-paper-hi uppercase">
          Anime × Tamil · Now dubbing · Gemma 4
        </p>
      </div>
    </div>
  );
}
