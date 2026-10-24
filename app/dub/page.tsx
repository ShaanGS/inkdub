import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Comic";
import { LiveDub } from "@/components/LiveDub";

export const metadata: Metadata = { title: "Dub a page live · Inkdub" };

export default function DubPage() {
  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Link
          href="/read"
          className="font-mono text-xs font-semibold tracking-[0.12em] uppercase underline-offset-4 hover:underline"
        >
          Read an episode
        </Link>
      </header>
      <LiveDub />
    </main>
  );
}
