import type { Metadata } from "next";
import Image from "next/image";
import { BannerLine } from "@/components/Comic";
import banner from "@/public/art/kollywood-banner.jpg";

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
        <BannerLine at={[10.6, 10.6, 23, 22.6]} size={2.25} className="font-letter font-extrabold uppercase">
          Anime gets dubs!
        </BannerLine>
        <BannerLine at={[19.2, 30.8, 25.4, 36.4]} size={1.05} className="font-letter font-extrabold uppercase">
          …manga?
        </BannerLine>
        <BannerLine at={[77.2, 10.4, 89.6, 23.2]} size={1.62} className="font-tamil-display font-extrabold">
          இனி மங்காவுக்கும் டப்பிங்!
        </BannerLine>
        <BannerLine at={[80.8, 30.2, 85.8, 35.2]} size={1.1} className="font-tamil-display font-extrabold">
          செம்ம!
        </BannerLine>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[230px] bg-gradient-to-t from-ink via-ink/75 to-transparent" />
      <div className="absolute inset-x-0 bottom-7 text-center">
        <p className="font-display text-[120px] leading-[0.9] tracking-tight text-sun [-webkit-text-stroke:4px_var(--ink)] [paint-order:stroke_fill] [text-shadow:7px_7px_0_var(--accent)]">
          INKDUB
        </p>
        <p className="mt-2 font-poster text-[28px] tracking-[0.16em] text-paper-hi uppercase">
          Anime × Tamil · Now dubbing · Gemma 4
        </p>
      </div>
    </div>
  );
}
