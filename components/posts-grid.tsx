"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Post } from "@/lib/posts";
import UploadDialog from "./upload-dialog";
import PostLightbox from "./post-lightbox";

type View = "collage" | "mosaico" | "historia";
const VIEWS: { id: View; label: string }[] = [
  { id: "collage", label: "collage" },
  { id: "mosaico", label: "mosaico" },
  { id: "historia", label: "historia" },
];

function tiltFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000;
  return (h / 1000) * 6 - 3;
}
function relTime(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86_400_000);
  if (d < 1) return "hoy";
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  return new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}
const whoName = (a: Post["author"]) => (a === "cele" ? "Cele" : "Marc");

export default function PostsGrid({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("mosaico");
  const [lightbox, setLightbox] = useState<number | null>(null);

  useEffect(() => {
    const v = typeof window !== "undefined" ? localStorage.getItem("lb_galview") : null;
    if (v === "collage" || v === "mosaico" || v === "historia") setView(v);
  }, []);

  function pickView(v: View) {
    setView(v);
    try {
      localStorage.setItem("lb_galview", v);
    } catch {}
  }

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
        <>
          <Switcher view={view} onPick={pickView} />
          <div className="mt-8">
            {view === "collage" && <CollageView posts={posts} onOpen={setLightbox} />}
            {view === "mosaico" && <MosaicView posts={posts} onOpen={setLightbox} />}
            {view === "historia" && <StoryView posts={posts} onOpen={setLightbox} />}
          </div>
        </>
      )}

      <UploadDialog open={open} onClose={() => setOpen(false)} onCreated={handleCreated} />
      <PostLightbox
        posts={posts}
        index={lightbox}
        onClose={() => setLightbox(null)}
        setIndex={setLightbox}
      />
    </section>
  );
}

function Switcher({ view, onPick }: { view: View; onPick: (v: View) => void }) {
  return (
    <div className="flex justify-center">
      <div className="inline-flex gap-1 p-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/50">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => onPick(v.id)}
            className={[
              "font-hand text-xl px-4 py-1 rounded-full transition",
              view === v.id
                ? "bg-[var(--ink)] text-white shadow"
                : "text-[var(--ink)] hover:bg-white/60",
            ].join(" ")}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Collage: polaroids y papelitos torcidos que se acomodan ── */
function CollageView({ posts, onOpen }: { posts: Post[]; onOpen: (i: number) => void }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 sm:gap-6">
      {posts.map((p, i) => {
        const tilt = tiltFor(p.id);
        return (
          <motion.button
            key={p.id}
            onClick={() => onOpen(i)}
            initial={{ opacity: 0, y: 26, rotate: tilt - 5, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, rotate: tilt, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            whileHover={{ rotate: 0, scale: 1.04, zIndex: 10 }}
            className="relative block w-full break-inside-avoid mb-6 text-left"
          >
            <span
              className="tape left-1/2 -top-3"
              style={{ transform: `translateX(-50%) rotate(${tilt > 0 ? -4 : 4}deg)` }}
            />
            {p.imageUrl ? (
              <div className="bg-white p-2.5 pb-4 shadow-[0_10px_25px_-12px_rgba(20,60,90,0.5)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt="" loading="lazy" className="w-full block" />
                {p.text && (
                  <p className="font-hand text-xl text-[var(--ink)] mt-2 px-1 leading-tight">
                    {p.text}
                  </p>
                )}
                <p className="font-hand text-base text-[var(--ink-soft)] text-center mt-1">
                  de {whoName(p.author)} · {relTime(p.createdAt)}
                </p>
              </div>
            ) : (
              <div className="bg-[#fffef5] px-5 py-5 shadow-[0_10px_25px_-12px_rgba(20,60,90,0.5)]">
                <p className="font-hand text-2xl text-[var(--ink)] leading-snug whitespace-pre-wrap">
                  {p.text}
                </p>
                <p className="font-note text-xs text-[var(--ink-soft)] mt-3 text-right">
                  — {whoName(p.author)}, {relTime(p.createdAt)}
                </p>
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Mosaico: masonry limpio, blur-up al aparecer, Ken Burns suave ── */
function MosaicView({ posts, onOpen }: { posts: Post[]; onOpen: (i: number) => void }) {
  return (
    <div className="columns-2 lg:columns-3 gap-3 sm:gap-4">
      {posts.map((p, i) => (
        <motion.button
          key={p.id}
          onClick={() => onOpen(i)}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="block w-full break-inside-avoid mb-3 sm:mb-4 overflow-hidden rounded-xl shadow-[0_10px_25px_-14px_rgba(20,60,90,0.55)] group"
        >
          {p.imageUrl ? (
            <div className="relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                src={p.imageUrl}
                alt=""
                loading="lazy"
                className="w-full block"
                animate={{ scale: [1, 1.07, 1] }}
                transition={{ duration: 14 + (i % 5) * 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {p.text && (
                <span className="absolute inset-x-0 bottom-0 p-2 pt-6 bg-gradient-to-t from-black/55 to-transparent font-hand text-lg text-white leading-tight">
                  {p.text}
                </span>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-cele-200 to-cele-400 px-4 py-7 text-left">
              <p className="font-hand text-2xl text-[var(--ink)] leading-snug whitespace-pre-wrap">
                {p.text}
              </p>
              <p className="font-note text-[11px] text-[var(--ink)]/70 mt-3">
                — {whoName(p.author)}
              </p>
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
}

/* ── Historia: franjas grandes con parallax ── */
function StoryView({ posts, onOpen }: { posts: Post[]; onOpen: (i: number) => void }) {
  return (
    <div className="max-w-xl mx-auto space-y-6">
      {posts.map((p, i) => (
        <StoryItem key={p.id} post={p} onOpen={() => onOpen(i)} />
      ))}
    </div>
  );
}

function StoryItem({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <motion.button
      ref={ref}
      onClick={onOpen}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="block w-full text-left"
    >
      {post.imageUrl ? (
        <div className="relative overflow-hidden rounded-2xl shadow-[0_20px_50px_-22px_rgba(20,60,90,0.6)] h-[58vh] bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={post.imageUrl}
            alt=""
            loading="lazy"
            style={{ y }}
            className="absolute inset-0 w-full h-[124%] object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 p-5 pt-16 bg-gradient-to-t from-black/65 to-transparent">
            {post.text && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="font-hand text-2xl text-white leading-snug"
              >
                {post.text}
              </motion.p>
            )}
            <p className="font-hand text-lg text-white/80 mt-1">
              de {whoName(post.author)} · {relTime(post.createdAt)}
            </p>
          </div>
        </div>
      ) : (
        <div className="relative bg-[#fffef5] rounded-2xl px-7 py-10 shadow-[0_20px_50px_-22px_rgba(20,60,90,0.6)]">
          <span className="tape left-1/2 -top-3" style={{ transform: "translateX(-50%) rotate(-3deg)" }} />
          <p className="font-hand text-3xl text-[var(--ink)] leading-snug whitespace-pre-wrap">
            {post.text}
          </p>
          <p className="font-note text-xs text-[var(--ink-soft)] mt-4 text-right">
            — {whoName(post.author)}, {relTime(post.createdAt)}
          </p>
        </div>
      )}
    </motion.button>
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
