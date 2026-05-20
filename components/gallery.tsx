"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { GalleryItem } from "@/lib/game";
import ReplayCanvas from "./replay-canvas";

const nameOf = (a: string) => (a === "cele" ? "Cele" : "Marc");

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<GalleryItem | null>(null);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="font-hand text-2xl text-white/85 text-center">cargando…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-sm mx-auto bg-[#fffef5] px-7 py-9 text-center shadow-[0_14px_30px_-14px_rgba(20,60,90,0.5)]">
        <p className="font-hand text-2xl text-[var(--ink)]">todavía no hay dibujos…</p>
        <p className="font-hand text-xl text-[var(--ink-soft)] mt-1">
          jueguen una partida y se van guardando acá 🎨
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="columns-2 sm:columns-3 gap-3 sm:gap-4 max-w-3xl mx-auto">
        {items.map((it, i) => (
          <motion.button
            key={it.id + "-" + i}
            onClick={() => setOpen(it)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.4) }}
            className="block w-full break-inside-avoid mb-3 sm:mb-4 bg-white p-2 pb-3 shadow-[0_10px_25px_-12px_rgba(20,60,90,0.5)] text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.imageUrl} alt={it.word} loading="lazy" className="w-full block" />
            <p className="font-hand text-xl text-[var(--ink)] mt-1.5 leading-none">{it.word}</p>
            <p className="font-note text-[10px] text-[var(--ink-soft)] mt-1 uppercase tracking-wide">
              {it.guessed ? `la sacó ${nameOf(it.guesser)} 🎉` : `no la sacó ${nameOf(it.guesser)}`}
            </p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f4f74]/45 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-[#fffef5] p-5 shadow-2xl rounded-sm"
            >
              <ReplayCanvas strokesUrl={open.strokesUrl} imageUrl={open.imageUrl} />
              <p className="font-hand text-3xl text-[var(--ink)] text-center mt-2">{open.word}</p>
              <p className="font-hand text-xl text-[var(--ink-soft)] text-center">
                la dibujó {nameOf(open.drawer)} ·{" "}
                {open.guessed ? `la sacó ${nameOf(open.guesser)} 🎉` : `${nameOf(open.guesser)} no la sacó`}
              </p>
              <button
                onClick={() => setOpen(null)}
                className="mt-3 w-full py-2.5 font-note bg-[var(--ink)] text-white rounded-sm hover:bg-[var(--ink-soft)] transition"
              >
                cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
