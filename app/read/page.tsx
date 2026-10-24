import type { Metadata } from "next";
import { Suspense } from "react";
import { Reader } from "@/components/Reader";
import { VIEWS } from "@/lib/views";
import { episode } from "@/lib/episode";
import type { View } from "@/lib/types";

export const metadata: Metadata = {
  title: `${episode.series}: ${episode.title} in Tamil · Inkdub`,
  description: `Read ${episode.series} episode ${episode.number} lettered in Tamil, Tanglish and Madras Bashai by Gemma 4.`,
};

export default function ReadPage({ searchParams }: PageProps<"/read">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-ink" />}>
      <DeepLinkedReader searchParams={searchParams} />
    </Suspense>
  );
}

/** /read?page=4&view=madras opens straight onto that page and style, so posts can link to a moment. */
async function DeepLinkedReader({ searchParams }: { searchParams: PageProps<"/read">["searchParams"] }) {
  const { page, view } = await searchParams;
  const number = Number(Array.isArray(page) ? page[0] : page);
  const initialPage = Number.isInteger(number) ? Math.min(Math.max(number, 1), episode.pages.length) - 1 : 0;
  const initialView = VIEWS.find((v) => v.id === view)?.id ?? ("tamil" satisfies View);
  return <Reader episode={episode} initialPage={initialPage} initialView={initialView} />;
}
