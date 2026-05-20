"use client";

import { motion } from "motion/react";
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
      <motion.h2
        initial={{ opacity: 0, rotate: -3, y: 10 }}
        whileInView={{ opacity: 1, rotate: -2, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="font-hand text-4xl sm:text-5xl text-white text-center mb-8 leading-tight drop-shadow-[0_2px_4px_rgba(20,60,90,0.4)]"
      >
        dejá algún recuerdito acá
        <br />
        para los 2
      </motion.h2>

      <Cta onOpen={() => setOpen(true)} />

      {posts.length === 0 ? (
        <p className="text-center font-hand text-2xl text-white/85 mt-10 drop-shadow-[0_1px_3px_rgba(20,60,90,0.4)]">
          todavía no hay nada acá… arrancá vos.
        </p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6 mt-10">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      )}

      <UploadDialog open={open} onClose={() => setOpen(false)} onCreated={handleCreated} />
    </section>
  );
}

function Cta({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, y: 14, rotate: -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      whileHover={{ rotate: 0, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="relative block mx-auto bg-[#fffef5] px-10 py-5 text-center shadow-[0_14px_30px_-14px_rgba(20,60,90,0.5)]"
    >
      <span
        className="tape left-1/2 -top-3"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />
      <span className="font-hand text-3xl text-[var(--ink)]">dejar algo</span>
    </motion.button>
  );
}
