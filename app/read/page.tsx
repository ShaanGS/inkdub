import type { Metadata } from "next";
import { Reader } from "@/components/Reader";
import { episode } from "@/lib/episode";

export const metadata: Metadata = {
  title: `${episode.series}: ${episode.title} in Tamil · Inkdub`,
};

export default function ReadPage() {
  return <Reader episode={episode} />;
}
