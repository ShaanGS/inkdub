# Contributing to Inkdub

Thanks for helping more people read comics in their own language.

## Set up

```bash
pnpm install
cp .env.example .env.local   # add a free Gemini API key from https://aistudio.google.com/apikey
pnpm dev
```

Before you open a pull request, run `pnpm lint` and `pnpm build`.

## Good first contributions

- **Review a Tamil line.** Open `/read`, tap a bubble, and if a line reads wrong, fix it in `public/comics/pepper-carrot/ep06/gemma/PXX.json` and say why in the PR. Native-speaker review is the most valuable thing you can add.
- **Add a language or slang.** A style is a field in the prompt ([`lib/gemma.ts`](lib/gemma.ts)), the `Style` type ([`lib/types.ts`](lib/types.ts)) and an entry in [`lib/views.ts`](lib/views.ts). Re-dub the bundled episode with `pnpm dub:episode` to fill it in.
- **Add an episode.** Put openly licensed pages in `public/comics/<series>/<episode>/en/P01.jpg`…, run `pnpm dub:episode <that folder>`, and wire it up in [`lib/episode.ts`](lib/episode.ts). Only add comics whose license allows redistribution, and credit them.
- **Improve bubble tracing.** Pages where English letters still peek out are great bug reports. Attach the page and the bubble.

## Ground rules

- Keep the model open. Inkdub is built on open-weight models, so new features should not depend on a closed model.
- Be kind in reviews. See the [MLH Code of Conduct](https://mlh.io/code-of-conduct) for the spirit we follow.

By contributing you agree that your work is released under the [Apache-2.0 license](LICENSE).
