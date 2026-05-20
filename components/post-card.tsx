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
  return new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// rotación pseudo-aleatoria pero estable por id
function tiltFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return ((h / 1000) * 6 - 3); // entre -3 y +3 grados
}

export default function PostCard({ post, index }: { post: Post; index: number }) {
  const isImage = !!post.imageUrl;
  const tilt = tiltFor(post.id);
  const who = post.author === "cele" ? "Cele" : "Marc";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24, rotate: tilt - 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.05, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ rotate: 0, scale: 1.03, zIndex: 10 }}
      className="relative break-inside-avoid mb-6"
    >
      {/* cinta arriba */}
      <span
        className="tape left-1/2 -translate-x-1/2 -top-3"
        style={{ transform: `translateX(-50%) rotate(${tilt > 0 ? -4 : 4}deg)` }}
      />

      {isImage ? (
        <figure className="bg-white p-2.5 pb-10 shadow-[0_10px_25px_-12px_rgba(20,60,90,0.5)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imageUrl!} alt="" loading="lazy" className="w-full block" />
          <figcaption className="font-hand text-xl text-[var(--ink)] text-center mt-2 px-1 leading-tight">
            de {who} · {relativeTime(post.createdAt)}
          </figcaption>
        </figure>
      ) : (
        <div className="bg-[#fffef5] px-5 py-5 shadow-[0_10px_25px_-12px_rgba(20,60,90,0.5)]">
          <p className="font-hand text-2xl text-[var(--ink)] leading-snug whitespace-pre-wrap">
            {post.text}
          </p>
          <p className="font-note text-xs text-[var(--ink-soft)] mt-3 text-right">
            — {who}, {relativeTime(post.createdAt)}
          </p>
        </div>
      )}
    </motion.article>
  );
}
