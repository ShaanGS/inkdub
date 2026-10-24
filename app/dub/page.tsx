import type { Metadata } from "next";
import Link from "next/link";
import { LiveDub } from "@/components/LiveDub";

export const metadata: Metadata = { title: "Dub a page live · Inkdub" };

export default function DubPage() {
  return (
    <main className="min-h-dvh">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="font-display text-2xl tracking-tight">
          Ink<span className="text-accent">dub</span>
        </Link>
        <Link href="/read" className="text-sm text-paper/60 hover:text-paper">
          Read an episode
        </Link>
      </nav>
      <LiveDub />
    </main>
  );
}
