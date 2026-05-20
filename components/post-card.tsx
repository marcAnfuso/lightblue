"use client";

import { motion } from "motion/react";
import type { Post } from "@/lib/posts";

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  const date = new Date(ts);
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default function PostCard({ post, index }: { post: Post; index: number }) {
  const isImage = !!post.imageUrl;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.7,
        delay: Math.min(index * 0.06, 0.6),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -3 }}
      className="group break-inside-avoid mb-4 sm:mb-5"
    >
      <div className="relative rounded-2xl bg-white/70 backdrop-blur-md border border-cele-200/60 overflow-hidden shadow-[0_12px_30px_-18px_rgba(54,131,191,0.35)] transition-shadow group-hover:shadow-[0_20px_45px_-22px_rgba(54,131,191,0.5)]">
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl!}
            alt=""
            loading="lazy"
            className="w-full h-auto block"
          />
        ) : (
          <div className="px-5 py-6 sm:px-6 sm:py-7">
            <p className="font-serif text-[17px] sm:text-[19px] text-ink leading-snug whitespace-pre-wrap">
              {post.text}
            </p>
          </div>
        )}

        <div
          className={[
            "flex items-center justify-between px-4 py-2.5 text-[11px] uppercase tracking-[0.18em]",
            isImage
              ? "absolute inset-x-0 bottom-0 text-white bg-gradient-to-t from-black/45 to-transparent pt-12"
              : "border-t border-cele-100/80 text-cele-700/80 bg-cele-50/40",
          ].join(" ")}
        >
          <span className="font-medium">
            de {post.author === "cele" ? "Cele" : "Marc"}
          </span>
          <span className="opacity-80">{relativeTime(post.createdAt)}</span>
        </div>
      </div>
    </motion.article>
  );
}
