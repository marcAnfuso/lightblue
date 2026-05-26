"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import type { Post } from "@/lib/posts";
import ReactionsBar from "./reactions";

function fechita(ts: number): string {
  return new Date(ts).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PostLightbox({
  posts,
  index,
  onClose,
  setIndex,
}: {
  posts: Post[];
  index: number | null;
  onClose: () => void;
  setIndex: (i: number) => void;
}) {
  const open = index !== null;
  const post = open ? posts[index!] : null;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex(Math.min((index ?? 0) + 1, posts.length - 1));
      if (e.key === "ArrowLeft") setIndex(Math.max((index ?? 0) - 1, 0));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, index, posts.length, onClose, setIndex]);

  const who = post?.author === "cele" ? "Cele" : "Marc";

  return (
    <AnimatePresence>
      {open && post && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-[#143a57]/70 backdrop-blur-md no-callout"
        >
          {/* flechas */}
          {index! > 0 && (
            <Arrow side="left" onClick={() => setIndex(index! - 1)} />
          )}
          {index! < posts.length - 1 && (
            <Arrow side="right" onClick={() => setIndex(index! + 1)} />
          )}

          <motion.div
            key={post.id}
            initial={{ scale: 0.9, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70 && index! < posts.length - 1) setIndex(index! + 1);
              else if (info.offset.x > 70 && index! > 0) setIndex(index! - 1);
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-[#fffef5] p-3 sm:p-4 shadow-2xl rounded-sm max-h-[88vh] overflow-y-auto"
          >
            {post.imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.imageUrl}
                  alt=""
                  className="w-full max-h-[62vh] object-contain rounded-sm bg-white"
                  draggable={false}
                />
                {post.text && (
                  <p className="font-hand text-2xl text-[var(--ink)] mt-3 px-1 leading-snug whitespace-pre-wrap">
                    {post.text}
                  </p>
                )}
              </>
            ) : (
              <p className="font-hand text-3xl text-[var(--ink)] px-2 py-6 leading-snug whitespace-pre-wrap text-center">
                {post.text}
              </p>
            )}

            <div className="flex items-center justify-between mt-3 px-1">
              <span className="font-hand text-xl text-[var(--ink-soft)]">
                de {who} · {fechita(post.createdAt)}
              </span>
            </div>
            <div className="mt-2 px-1 pb-1">
              <ReactionsBar ts={String(post.createdAt)} initial={post.reactions} />
            </div>
          </motion.div>

          <button
            onClick={onClose}
            aria-label="cerrar"
            className="mt-4 font-note text-sm text-white/90 underline hover:text-white"
          >
            cerrar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "anterior" : "siguiente"}
      className={[
        "absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 text-[var(--ink)] text-2xl flex items-center justify-center shadow-lg hover:bg-white transition",
        side === "left" ? "left-2 sm:left-4" : "right-2 sm:right-4",
      ].join(" ")}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
