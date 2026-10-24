import Link from "next/link";
import { HeroDemo } from "@/components/HeroDemo";
import { episode } from "@/lib/episode";

const STEPS = [
  {
    title: "Gemma 4 reads the page",
    body: "One multimodal call finds every speech bubble, thought bubble and caption, with exact boxes and who is speaking.",
  },
  {
    title: "It localizes, not translates",
    body: "Each line keeps the character's voice and mood, in clean Tamil, casual Tanglish or full Madras Bashai.",
  },
  {
    title: "Inkdub letters it back",
    body: "The Tamil is set inside the original bubble, matched to the paper colour and sized to fit. Tap any bubble to compare.",
  },
];

export default function Home() {
  const specimen = episode.pages[1];
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-2xl tracking-tight">
          Ink<span className="text-accent">dub</span>
        </span>
        <a
          href="https://github.com/ShaanGS/inkdub"
          className="rounded-full border border-white/10 px-4 py-1.5 text-sm text-paper/70 transition hover:border-white/30 hover:text-paper"
        >
          GitHub
        </a>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 pt-6 pb-28 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-paper/70">
            <span className="size-1.5 rounded-full bg-accent" /> Powered by Gemma 4 · open weights · Apache 2.0
          </p>
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl">
            Anime gets dubs.
            <br />
            <span className="text-accent">Manga never did.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-paper/70">
            Inkdub reads every speech bubble on a comic page and letters it back in natural Tamil, casual Tanglish
            or full Madras Bashai, right where the English used to be.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/read"
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white shadow-[0_10px_40px_-10px_rgba(255,77,46,0.9)] transition hover:brightness-110"
            >
              Read {episode.series} in Tamil →
            </Link>
            <Link
              href="/dub"
              className="rounded-full border border-white/15 px-6 py-3 font-semibold text-paper/85 transition hover:border-white/35 hover:text-paper"
            >
              Dub your own page
            </Link>
          </div>
        </div>
        <HeroDemo page={specimen} width={episode.width} height={episode.height} />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <span className="font-display text-3xl text-accent">0{i + 1}</span>
              <h2 className="mt-3 text-lg font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-8 sm:p-12">
          <h2 className="font-display text-3xl sm:text-4xl">Why it has to be open</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-4xl text-accent">69</p>
              <p className="mt-2 text-sm text-paper/60">
                languages Pepper&amp;Carrot is translated into, all by volunteers. The Tamil edition is only 21% done.
              </p>
            </div>
            <div>
              <p className="font-display text-4xl text-accent">Apache 2.0</p>
              <p className="mt-2 text-sm text-paper/60">
                Gemma 4 is open-weight, so fan translators can run the same model on their own machines, free, with no
                per-page bill.
              </p>
            </div>
            <div>
              <p className="font-display text-4xl text-accent">Human in the loop</p>
              <p className="mt-2 text-sm text-paper/60">
                Inkdub drafts every bubble; Tamil readers review and fix it, then contribute it back to the comic.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-6xl px-6 pb-10 text-xs text-paper/40">
        Comic: {episode.series} by{" "}
        <a href={episode.sourceUrl} className="underline decoration-white/20 underline-offset-2 hover:text-paper">
          {episode.author}
        </a>
        , {episode.license}. Tamil lettering generated by {episode.model} through the Gemini API.
      </footer>
    </main>
  );
}
