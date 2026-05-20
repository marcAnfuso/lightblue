"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import type { Post } from "@/lib/posts";
import PostCard from "./post-card";
import UploadDialog from "./upload-dialog";

export default function PostsGrid({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [open, setOpen] = useState(false);

  const handleCreated = useCallback((p: Post) => {
    setPosts((prev) => [p, ...prev]);
  }, []);

  return (
    <section className="px-4 sm:px-6 pb-32 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-6 px-2">
        <span className="h-px flex-1 bg-cele-200" />
        <span className="text-xs uppercase tracking-[0.3em] text-cele-700">
          lo que nos dejamos
        </span>
        <span className="h-px flex-1 bg-cele-200" />
      </div>

      {posts.length === 0 ? (
        <Empty onOpen={() => setOpen(true)} />
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 sm:gap-5">
          <AnimatePresence initial={false}>
            {posts.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <FloatingButton onClick={() => setOpen(true)} />
      <UploadDialog open={open} onClose={() => setOpen(false)} onCreated={handleCreated} />
    </section>
  );
}

function Empty({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="text-center py-16"
    >
      <p className="font-serif italic text-cele-700 text-lg">
        todavía no hay nada acá.
      </p>
      <p className="text-sm text-cele-600/80 mt-2">
        dejá la primera cosita, lo que sea.
      </p>
      <button
        onClick={onOpen}
        className="mt-6 px-5 py-2.5 rounded-full bg-cele-500 text-white text-sm hover:bg-cele-600 transition shadow-[0_8px_24px_-8px_rgba(77,159,216,0.55)]"
      >
        dejar algo
      </button>
    </motion.div>
  );
}

function FloatingButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 px-5 py-3 rounded-full bg-cele-500 text-white text-sm font-medium shadow-[0_12px_36px_-8px_rgba(54,131,191,0.6)] hover:bg-cele-600 transition flex items-center gap-2"
    >
      <span className="text-lg leading-none">+</span> dejá algo
    </motion.button>
  );
}
