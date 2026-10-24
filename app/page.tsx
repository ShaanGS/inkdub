import Image from "next/image";
import Link from "next/link";
import { HeroDemo } from "@/components/HeroDemo";
import { HeroTitle } from "@/components/HeroTitle";
import { Ribbon } from "@/components/Ribbon";
import { episode } from "@/lib/episode";
import { RIBBON_MADRAS, RIBBON_TAMIL, VOICES } from "@/lib/showcase";
import rooftop from "@/public/art/rooftop-reader.jpg";

const REPO = "https://github.com/ShaanGS/inkdub";

const STEPS = [
  {
    title: "Gemma 4 reads the page",
    body: "One multimodal call finds every speech bubble, thought bubble and caption, with a box, the speaker and the tone.",
  },
  {
    title: "It localizes, not translates",
    body: "Each line keeps the character's voice: clean Tamil, casual Tanglish, or full Madras Bashai with the attitude intact.",
  },
  {
    title: "Inkdub letters it back",
    body: "The browser traces each bubble's real shape, paints it with the bubble's own paper colour, and fits the Tamil inside.",
  },
];

export default function Home() {
  const specimen = episode.pages[1];
  return (
    <main className="relative overflow-hidden">
      <div className="halftone pointer-events-none absolute inset-x-0 top-0 h-[900px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_65%)]" />

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Ink<span className="text-accent">dub</span>
        </Link>
        <div className="flex items-center gap-1 text-sm whitespace-nowrap sm:gap-2">
          <Link href="/read" className="hidden rounded-full px-3 py-1.5 text-paper/70 transition hover:text-paper sm:block">
            Read
          </Link>
          <Link href="/dub" className="hidden rounded-full px-3 py-1.5 text-paper/70 transition hover:text-paper sm:block">
            Dub a page
          </Link>
          <a
            href={REPO}
            className="rounded-full border border-white/15 px-4 py-1.5 text-paper/80 transition hover:border-white/35 hover:text-paper"
          >
            ★ GitHub
          </a>
        </div>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 px-6 pt-6 pb-24 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-paper/70">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" /> Powered by Gemma 4 · open weights ·
            Apache 2.0
          </p>
          <HeroTitle />
          <p className="mt-6 max-w-xl text-lg text-paper/70">
            Inkdub reads every speech bubble on a comic page and letters it back in natural Tamil, casual Tanglish
            or full Madras Bashai, right where the English used to be.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/read"
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white shadow-[0_10px_40px_-10px_rgba(255,77,46,0.9)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Read {episode.series} in Tamil →
            </Link>
            <Link
              href="/dub"
              className="rounded-full border border-white/15 px-6 py-3 font-semibold text-paper/85 transition hover:-translate-y-0.5 hover:border-white/35 hover:text-paper"
            >
              Dub your own page
            </Link>
          </div>
        </div>
        <HeroDemo page={specimen} width={episode.width} height={episode.height} />
      </section>

      <section className="relative z-10 -mx-4 space-y-2 pb-24">
        <Ribbon lines={RIBBON_MADRAS} tilt={-1.5} />
        <Ribbon lines={RIBBON_TAMIL} reverse tilt={-1.5} />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-3xl sm:text-4xl">
          One line, <span className="text-accent">three voices.</span>
        </h2>
        <p className="mt-3 max-w-2xl text-paper/60">
          Straight from Gemma 4, unedited. Pick how your characters talk: clean enough for school, casual like a
          WhatsApp group, or pure Chennai.
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {VOICES.map((voice) => (
            <Link
              key={voice.text}
              href={`/read?page=${voice.page}&view=madras`}
              className="group flex flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-accent/50"
            >
              <p className="text-sm text-paper/45">“{voice.text}”</p>
              <dl className="mt-5 flex-1 space-y-4">
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-paper/40 uppercase">Tamil</dt>
                  <dd className="mt-1 font-tamil text-[17px] leading-snug">{voice.tamil}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-paper/40 uppercase">Tanglish</dt>
                  <dd className="mt-1 text-[17px] leading-snug">{voice.tanglish}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold tracking-wider text-accent uppercase">Madras Bashai</dt>
                  <dd className="mt-1 font-bubble text-2xl leading-snug font-bold">{voice.madras}</dd>
                </div>
              </dl>
              <span className="mt-6 text-sm text-paper/45 transition group-hover:text-accent">
                See it on page {voice.page} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <h2 className="font-display text-3xl sm:text-4xl">How it works</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
              <span className="font-display text-3xl text-accent">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/60">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <figure>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-paper">
            <Image
              src={rooftop}
              alt="Manga-style illustration of a girl reading a comic on a Chennai rooftop while red speech bubbles rise from the page"
              placeholder="blur"
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="h-auto w-full"
            />
          </div>
          <figcaption className="mt-4 flex flex-wrap justify-between gap-2 text-sm text-paper/50">
            <span>Made in Chennai, for everyone who grew up reading manga in somebody else&apos;s language.</span>
            <span className="text-paper/35">Illustration made with Magnific</span>
          </figcaption>
        </figure>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-8 sm:p-12">
          <h2 className="font-display text-3xl sm:text-4xl">Why it has to be open</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div>
              <p className="font-display text-4xl text-accent">21%</p>
              <p className="mt-2 text-sm text-paper/60">
                of Pepper&amp;Carrot exists in Tamil. It is translated into 69 languages, all by volunteers. Inkdub
                drafts the rest so a Tamil reader only has to review.
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
              <p className="font-display text-4xl text-accent">Yours</p>
              <p className="mt-2 text-sm text-paper/60">
                Inkdub itself is Apache-2.0 on GitHub. Add your language, your slang, your favourite series.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-accent px-8 py-14 text-center text-white sm:px-16">
          <div className="halftone absolute inset-0 opacity-50" />
          <h2 className="relative font-display text-4xl leading-tight sm:text-5xl">
            Your favourite manga,
            <br />
            in your mother tongue.
          </h2>
          <div className="relative mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/read" className="rounded-full bg-ink px-6 py-3 font-semibold text-paper transition hover:-translate-y-0.5">
              Read the episode
            </Link>
            <Link href="/dub" className="rounded-full bg-white/15 px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-white/25">
              Dub a page
            </Link>
            <a href={REPO} className="rounded-full bg-white/15 px-6 py-3 font-semibold transition hover:-translate-y-0.5 hover:bg-white/25">
              ★ Star on GitHub
            </a>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-6 pb-10 text-xs text-paper/40">
        <span>
          Comic: {episode.series} by{" "}
          <a href={episode.sourceUrl} className="underline decoration-white/20 underline-offset-2 hover:text-paper">
            {episode.author}
          </a>
          , {episode.license}. Lettering by {episode.model} through the Gemini API.
        </span>
        <span>Built at Otaku.dev&apos;26 · Hacktoberfest Hack Day Chennai</span>
      </footer>
    </main>
  );
}
