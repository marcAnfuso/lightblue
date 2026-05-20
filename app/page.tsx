import Letter from "@/components/hero";
import Countdown from "@/components/countdown";
import PostsGrid from "@/components/posts-grid";
import Link from "next/link";
import PlansRoulette from "@/components/plans-roulette";
import { listPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  try {
    posts = await listPosts();
  } catch {
    // si todavía no está configurado el blob store, dejamos vacío
  }

  return (
    <main className="min-h-screen py-10 sm:py-16">
      <div className="px-4 sm:px-6">
        <div className="sheet mx-auto max-w-2xl px-7 sm:px-14 py-12 sm:py-16 rotate-[-0.6deg]">
          <Letter />
          <Countdown />
        </div>
      </div>

      <div className="mt-16 sm:mt-24 px-4 sm:px-6">
        <PlansRoulette />
      </div>

      <div className="mt-12 sm:mt-16 px-4 sm:px-6">
        <Link href="/jugar" className="group block max-w-md mx-auto">
          <div className="relative bg-[#fffef5] px-7 py-6 text-center shadow-[0_18px_40px_-18px_rgba(20,60,90,0.55)] rotate-[0.6deg] group-hover:rotate-0 transition-transform">
            <span
              className="tape left-1/2 -top-3"
              style={{ transform: "translateX(-50%) rotate(-3deg)" }}
            />
            <p className="font-hand text-4xl text-[var(--ink)]">dibujá y adiviná 🎨</p>
            <p className="font-hand text-xl text-[var(--ink-soft)] mt-1">
              uno dibuja una palabra, el otro adivina. tocá para jugar →
            </p>
          </div>
        </Link>
      </div>

      <div className="mt-16 sm:mt-24">
        <PostsGrid initialPosts={posts} />
      </div>

      <footer className="pb-12 text-center font-hand text-2xl text-white/85 drop-shadow-[0_1px_3px_rgba(20,60,90,0.4)]">
        hecha con cariño · mayo 2026
      </footer>
    </main>
  );
}
