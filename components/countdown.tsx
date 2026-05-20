"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// 26 de noviembre 2026, 00:00 horario Argentina (UTC-3)
const TARGET = new Date("2026-11-26T00:00:00-03:00").getTime();

type Parts = { d: number; h: number; m: number; s: number };

function diffParts(now: number): Parts {
  const ms = Math.max(0, TARGET - now);
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

const pad = (n: number, w = 2) => n.toString().padStart(w, "0");

export default function Countdown() {
  const [p, setP] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setP(diffParts(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -1.2 }}
      transition={{ duration: 1, delay: 3.9, ease: [0.22, 1, 0.36, 1] }}
      className="mt-12 mb-4 max-w-md mx-auto"
    >
      <div className="hand-box bg-[#fcfdff] px-6 py-5 text-center font-hand text-[var(--ink)]">
        <p className="text-2xl sm:text-3xl mb-3">faltan para tu cumple…</p>

        <div className="flex items-end justify-center gap-3 sm:gap-4">
          <Unit value={p ? pad(p.d, 3) : "···"} label="días" big />
          <Sep />
          <Unit value={p ? pad(p.h) : "··"} label="hs" />
          <Sep />
          <Unit value={p ? pad(p.m) : "··"} label="min" />
          <Sep />
          <Unit value={p ? pad(p.s) : "··"} label="seg" />
        </div>

        <p className="text-xl sm:text-2xl mt-4 text-[var(--ink-soft)]">
          (y contando, eh)
        </p>
      </div>
    </motion.div>
  );
}

function Sep() {
  return <span className="font-hand text-3xl sm:text-4xl text-[var(--ink-soft)] pb-5">:</span>;
}

function Unit({
  value,
  label,
  big = false,
}: {
  value: string;
  label: string;
  big?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden h-12 sm:h-16 flex items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={[
              "block font-hand tabular-nums text-[var(--ink)] leading-none",
              big ? "text-5xl sm:text-7xl" : "text-4xl sm:text-6xl",
            ].join(" ")}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="font-note text-sm text-[var(--ink-soft)] mt-1">{label}</span>
    </div>
  );
}
