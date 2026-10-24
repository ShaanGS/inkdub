# Inkdub

**Anime gets dubs. Manga never did.**

Inkdub letters comic and manga pages into Tamil, right inside the speech bubbles. Gemma 4 reads the page, finds every bubble, and localizes each line three ways: natural Tamil, casual Tanglish, and Chennai's Madras Bashai. Inkdub then traces each bubble's shape in the browser and sets the Tamil back into the art.

Built in one day at Otaku.dev'26, the Hacktoberfest Hack Day in Chennai hosted by Commit Culture.

- **Read a full episode in Tamil:** `/read` (Pepper&Carrot episode 6, all 10 pages)
- **Dub your own page live:** `/dub` (upload, drop or paste any page)

## How it works

1. **One Gemma 4 call per page** ([`lib/gemma.ts`](lib/gemma.ts)). The page image goes to Gemma 4 through the Gemini API. It returns every bubble as JSON: a bounding box (`box_2d`, normalized 0–1000), the original text, the speaker, the tone, and the three localizations. The prompt asks for localization, not word-for-word translation, so honorifics and jokes land for Tamil readers.
2. **Bubble tracing in the browser** ([`components/DubbedPage.tsx`](components/DubbedPage.tsx)). For each box, Inkdub samples the bubble's paper colour, flood-fills the interior outward from Gemma's box until it meets the outline, and paints a patch the exact shape of the bubble. If the fill escapes (an open bubble, or two bubbles joined by a connector) it falls back to a padded patch.
3. **Lettering** ([`components/FitText.tsx`](components/FitText.tsx)). The Tamil is set in Baloo Thambi 2 and binary-searched to the largest size that fits. Shouts get a heavier weight and a pop-in.

The bundled episode was dubbed ahead of time and cached as JSON ([`public/comics/pepper-carrot/ep06/gemma`](public/comics/pepper-carrot/ep06/gemma)), so the reader is instant. `/dub` calls Gemma live for any page you bring.

## Model

- **Gemma 4 26B A4B instruction-tuned (`gemma-4-26b-a4b-it`)**, an open-weight mixture-of-experts model released under the [Apache 2.0 license](https://opensource.googleblog.com/2026/03/gemma-4-expanding-the-gemmaverse-with-apache-20.html). Model docs: [ai.google.dev/gemma](https://ai.google.dev/gemma/docs/core).
- Called through the **Gemini API** with the official [`@google/genai`](https://www.npmjs.com/package/@google/genai) SDK. `gemma-4-31b-it` is the fallback when the 26B endpoint is busy.
- Thinking is set to `MINIMAL`. In our tests that cut a full page from about 50 seconds to about 15, with no visible loss in quality.

### What we measured while building

| Test | Result |
| --- | --- |
| Bubble detection on a test page (26B) | 5/5 bubbles, text read exactly, mean box overlap (IoU) 0.89 |
| Same test on 31B | 5/5 bubbles, mean IoU 0.70, about twice as slow |
| Full page, find + read + localize, one call (26B, minimal thinking) | 15–40 s per page depending on bubble count |
| Free-tier reliability | Intermittent HTTP 500s, so the API route retries and falls back to 31B |

## Why open matters here

- Comic translation is volunteer work. Pepper&Carrot is translated into 69 languages by its community, and its Tamil edition is 21% done. Inkdub drafts every bubble so a Tamil reader only has to review, not start from a blank page.
- Gemma 4 is Apache 2.0, so fan translators can run the same model on their own machines with no per-page bill, and a community can fine-tune it for Tamil comics and share the result.

## Run it locally

```bash
pnpm install
echo "GEMINI_API_KEY=your-key" > .env.local   # a free key from https://aistudio.google.com/apikey
pnpm dev
```

Open http://localhost:3000. To re-dub the bundled episode with the same pipeline the live route uses (pages that already have JSON are skipped):

```bash
pnpm dub:episode public/comics/pepper-carrot/ep06
```

## Key dependencies

Next.js 16 (App Router), React 19, Tailwind CSS 4, [Motion](https://motion.dev) for animation, and `@google/genai` for the Gemini API.

## Credits and licenses

- **Code:** Apache-2.0, see [LICENSE](LICENSE).
- **Comic:** [Pepper&Carrot](https://www.peppercarrot.com) episode 6, "The Potion Contest", art and story by David Revoy, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The English pages are unmodified; Inkdub draws its lettering on top at display time. The pages in `public/comics/pepper-carrot/ep06/ta` are the Pepper&Carrot community's Tamil translation, kept for comparison.
- **Model:** Gemma 4 by Google, Apache 2.0.
