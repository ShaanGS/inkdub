import Image from "next/image";
import Link from "next/link";
import { BannerLine, Caption, GitHubMark, Logo, Panel, Sfx, Tag } from "@/components/Comic";
import { HeroDemo } from "@/components/HeroDemo";
import { PanelCrop } from "@/components/PanelCrop";
import { episode } from "@/lib/episode";
import banner from "@/public/art/kollywood-banner.jpg";
import rooftop from "@/public/art/rooftop-reader.jpg";
import wordmark from "@/public/brand/inkdub-wordmark.webp";

const REPO = "https://github.com/ShaanGS/inkdub";

// Page 7's last panel: the Mayor yelling "Run, idiot!". Real Gemma output, never edited.
const STRIP_PAGE = episode.pages[6];
const STRIP_CROP: [number, number, number, number] = [776, 612, 994, 978];
const SCRIPT_LINE = STRIP_PAGE.bubbles[3];

const VOICES = [
  { view: "original", label: "EN · original", points: "0,0 100,0 98,100 0,100" },
  { view: "tamil", label: "தமிழ்", points: "1.5,0 100,0 100,100 0,100" },
  { view: "tanglish", label: "Tanglish", points: "0,0 98.5,0 100,100 0,100" },
  { view: "madras", label: "Madras Bashai", points: "1.5,0 100,0 100,100 0,100" },
] as const;

export default function Home() {
  return (
    <main className="overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-5 font-mono text-xs font-semibold tracking-[0.12em] whitespace-nowrap uppercase">
          <Link href="/read" className="hidden underline-offset-4 hover:underline sm:block">
            Read
          </Link>
          <Link href="/dub" className="hidden underline-offset-4 hover:underline sm:block">
            Dub a page
          </Link>
          <a href={REPO} className="stamp stamp-paper !gap-1.5 !px-3 !py-1.5 !text-[11px]">
            <GitHubMark className="size-3.5" />
            GitHub
          </a>
        </nav>
      </header>

      {/* The banner: a hand-painted Kollywood hoarding whose own empty bubbles Inkdub has lettered. */}
      <section className="mx-auto max-w-6xl px-5">
        <Panel className="bg-ink">
          <div className="@container relative" style={{ aspectRatio: "16 / 9" }}>
            <Image
              src={banner}
              alt="Hand-painted Kollywood banner: an anime hero and a Tamil hero side by side under a blazing sun, their speech bubbles lettered by Inkdub"
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
            <BannerLine at={[9.2, 10.6, 24.4, 25.7]} delay={0.5} className="font-letter font-extrabold uppercase" text="Anime gets dubs!" />
            <BannerLine at={[18.3, 30.6, 26.3, 38]} delay={0.9} className="font-letter font-extrabold uppercase" text="…manga?" />
            <BannerLine at={[75.5, 9.5, 91.4, 24.5]} delay={1.3} className="font-tamil-display font-extrabold" text="இனி மங்காவுக்கும் டப்பிங்!" />
            <BannerLine at={[79.7, 29.7, 86.8, 36.6]} delay={1.7} className="font-tamil-display font-extrabold" text="செம்ம!" />
          </div>
        </Panel>
        <div className="relative z-10 -mt-[3.2rem] text-center sm:-mt-[5.5rem]">
          <h1>
            <Image
              src={wordmark}
              alt="Inkdub"
              priority
              sizes="(min-width: 640px) 720px, 88vw"
              className="mx-auto h-auto w-[min(88vw,720px)] -rotate-1"
            />
          </h1>
          <p className="mt-3 font-poster text-2xl tracking-[0.16em] uppercase sm:text-4xl">Anime × Tamil · Now dubbing</p>
          <p className="mx-auto mt-4 max-w-3xl font-poster text-[12px] leading-snug tracking-[0.12em] text-ink-soft uppercase sm:text-[14px]">
            Gemma 4 presents · an open-source production · lettering in Tamil, Tanglish and Madras Bashai · starring
            Pepper &amp; Carrot by David Revoy
          </p>
        </div>
      </section>

      {/* The live specimen beside the narrator. */}
      <section className="mx-auto grid max-w-6xl gap-3 px-5 pt-14 pb-20 lg:grid-cols-[1fr_1.05fr]">
        <Panel points="0,0 100,0 97.5,100 0,100" className="bg-paper-hi">
          <div className="flex h-full flex-col justify-center gap-6 p-6 sm:p-9">
            <div>
              <Tag>Ch. 01 · The dub</Tag>
            </div>
            <p className="font-letter text-xl leading-snug sm:text-2xl">
              Inkdub reads every speech bubble on a comic page and letters it back in natural <b>Tamil</b>, casual{" "}
              <b>Tanglish</b> or full <b>Madras Bashai</b>, right where the English was.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/read" className="stamp stamp-ink">
                Read chapter 6 →
              </Link>
              <Link href="/dub" className="stamp stamp-paper">
                Dub your own page
              </Link>
            </div>
            <p className="font-mono text-[11px] tracking-[0.12em] text-ink-soft uppercase">
              Gemma 4 · open weights · Apache 2.0 · open source
            </p>
            <Sfx className="self-end text-5xl sm:text-6xl" delay={0.4}>
              டமால்!
            </Sfx>
          </div>
        </Panel>
        <Panel points="2.5,0 100,0 100,100 0,100" className="bg-paper-hi" delay={0.15}>
          <HeroDemo page={episode.pages[1]} width={episode.width} height={episode.height} />
        </Panel>
      </section>

      {/* A four-panel strip: one real panel, lettered four ways. */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-4xl leading-[0.95] sm:text-6xl">
            Same panel.
            <br />
            <span className="text-accent">Four voices.</span>
          </h2>
          <Caption className="max-w-sm font-mono text-xs leading-relaxed">
            Pepper&amp;Carrot, episode 6, page 7. Every line lettered by Gemma 4 and left exactly as it came back.
          </Caption>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {VOICES.map((voice, i) => (
            <Panel key={voice.view} points={voice.points} className="bg-paper-hi" delay={i * 0.12}>
              <PanelCrop
                page={STRIP_PAGE}
                width={episode.width}
                height={episode.height}
                crop={STRIP_CROP}
                view={voice.view}
                delay={0.2 + i * 0.45}
              />
              <Tag
                className={`absolute top-1.5 left-1.5 !px-1.5 !text-[9px] sm:top-2 sm:left-2 sm:!px-2 sm:!text-[11px] ${
                  voice.view === "madras" ? "!bg-accent !text-paper-hi" : ""
                }`}
              >
                {voice.label}
              </Tag>
            </Panel>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <Link href="/read?page=7&view=madras" className="stamp stamp-paper">
            Read page 7 in Madras Bashai →
          </Link>
        </div>
      </section>

      {/* How a page gets dubbed, drawn as a three-panel strip. */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="mb-8 font-display text-4xl leading-[0.95] sm:text-6xl">How a page gets dubbed</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <Panel className="bg-paper-hi">
            <div className="flex h-full flex-col">
              <div className="p-4">
                <Tag>① Gemma 4 reads it</Tag>
              </div>
              <PanelCrop
                page={STRIP_PAGE}
                width={episode.width}
                height={episode.height}
                crop={STRIP_CROP}
                view="original"
                boxes
                delay={0.3}
              />
              <p className="p-4 font-letter leading-snug">
                One call to <code className="font-mono text-sm">gemma-4-26b-a4b-it</code> finds every bubble, who is
                talking and how loud.
              </p>
            </div>
          </Panel>
          <Panel points="2,0 100,0 98,100 0,100" className="bg-paper-hi" delay={0.12}>
            <div className="flex h-full flex-col">
              <div className="p-4">
                <Tag>② It localizes</Tag>
              </div>
              <dl className="mx-4 flex-1 divide-y-2 divide-dashed divide-ink/25 border-y-2 border-ink font-mono text-[13px]">
                {[
                  ["Speaker", `${SCRIPT_LINE.speaker} · ${SCRIPT_LINE.tone}`],
                  ["EN", SCRIPT_LINE.text],
                  ["Tamil", SCRIPT_LINE.tamil],
                  ["Tanglish", SCRIPT_LINE.tanglish],
                  ["Madras", SCRIPT_LINE.madras],
                ].map(([label, line]) => (
                  <div key={label} className="grid grid-cols-[5.5rem_1fr] gap-2 py-2.5">
                    <dt className="text-ink-soft uppercase">{label}</dt>
                    <dd className={label === "Madras" ? "font-bubble text-base font-bold text-accent" : "font-bubble text-[15px]"}>
                      {line}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="p-4 font-letter leading-snug">
                Not word for word: honorifics, jokes and attitude are rewritten for Tamil readers.
              </p>
            </div>
          </Panel>
          <Panel className="bg-paper-hi" delay={0.24}>
            <div className="flex h-full flex-col">
              <div className="p-4">
                <Tag>③ Inkdub letters it</Tag>
              </div>
              <PanelCrop
                page={STRIP_PAGE}
                width={episode.width}
                height={episode.height}
                crop={STRIP_CROP}
                view="madras"
                delay={0.6}
              />
              <p className="p-4 font-letter leading-snug">
                The browser traces each bubble, repaints it with the bubble&apos;s own paper, and fits the Tamil inside.
              </p>
            </div>
          </Panel>
        </div>
      </section>

      {/* The afterword, the way a manga volume ends with a note from its makers. */}
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-24 lg:grid-cols-[1fr_1.15fr] lg:items-center">
        <div>
          <h2 className="font-display text-4xl leading-[0.95] sm:text-6xl">Afterword</h2>
          <div className="mt-7 space-y-4 font-letter text-lg leading-relaxed">
            <p>
              Pepper&amp;Carrot has been translated into 69 languages, every one of them by volunteers. Its Tamil
              edition is{" "}
              <span className="bg-[linear-gradient(transparent_58%,rgba(228,50,27,0.35)_58%)] font-bold">21% done</span>.
            </p>
            <p>Inkdub drafts every bubble, so a Tamil reader only has to review instead of starting from a blank page.</p>
            <p>
              It runs on Gemma 4, an open-weight model under Apache 2.0, so any fan translator can run it on their own
              machine for free. Inkdub is open source too. Bring your language, your slang, your favourite series.
            </p>
            <p className="font-bold">— the Inkdub crew, Chennai</p>
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <a href={REPO} className="stamp stamp-ink">
              <GitHubMark className="size-4" />
              Star it on GitHub
            </a>
            <span className="-rotate-[8deg] border-[3px] border-accent px-3 py-1 font-display text-lg text-accent opacity-90">
              OPEN SOURCE
            </span>
          </div>
        </div>
        <Panel points="2,0 100,0 98,100 0,100" className="bg-paper-hi">
          <Image
            src={rooftop}
            alt="Manga-style illustration of a girl reading a comic on a Chennai rooftop while red speech bubbles rise from the page"
            placeholder="blur"
            sizes="(min-width: 1024px) 600px, 100vw"
            className="h-auto w-full"
          />
          <Caption className="absolute bottom-3 left-3 max-w-[16rem] font-mono text-[11px] leading-relaxed">
            Made in Chennai, for everyone who grew up reading manga in somebody else&apos;s language.
          </Caption>
        </Panel>
      </section>

      <footer className="border-t-[3px] border-ink">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-16 text-center">
          <p className="font-tamil-display text-6xl leading-none font-extrabold sm:text-8xl">தொடரும்…</p>
          <p className="font-mono text-xs font-semibold tracking-[0.35em] uppercase">To be continued</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/read" className="stamp stamp-ink">
              Read chapter 6
            </Link>
            <Link href="/dub" className="stamp stamp-paper">
              Dub a page
            </Link>
          </div>
          <p className="max-w-2xl font-mono text-[11px] leading-relaxed text-ink-soft">
            Comic: {episode.series} by{" "}
            <a href={episode.sourceUrl} className="underline underline-offset-2">
              {episode.author}
            </a>
            , {episode.license} · Lettering: {episode.model} via the Gemini API · Illustration made
            with Magnific
          </p>
        </div>
      </footer>
    </main>
  );
}
