import Letter from "@/components/hero";
import Countdown from "@/components/countdown";
import PostsGrid from "@/components/posts-grid";
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

      <div className="mt-16 sm:mt-24">
        <PostsGrid initialPosts={posts} />
      </div>

      <footer className="pb-12 text-center font-hand text-2xl text-white/85 drop-shadow-[0_1px_3px_rgba(20,60,90,0.4)]">
        hecha con cariño · mayo 2026
      </footer>
    </main>
  );
}
