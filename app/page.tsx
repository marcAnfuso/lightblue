import Hero from "@/components/hero";
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
    <main className="min-h-screen">
      <Hero />
      <Countdown />
      <PostsGrid initialPosts={posts} />
      <footer className="py-10 text-center text-xs text-cele-700/60 tracking-wide">
        hecha con cariñito · mayo 2026
      </footer>
    </main>
  );
}
