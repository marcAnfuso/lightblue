"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// 26 de noviembre 2026, 00:00 zona horaria Argentina (UTC-3)
const TARGET = new Date("2026-11-26T00:00:00-03:00").getTime();

type Parts = { d: number; h: number; m: number; s: number };

function diffParts(now: number): Parts {
  const ms = Math.max(0, TARGET - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { d, h, m, s };
}

function pad(n: number, w = 2) {
  return n.toString().padStart(w, "0");
}

export default function Countdown() {
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    const tick = () => setParts(diffParts(Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="px-6 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.1, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-2xl"
      >
        <div className="relative rounded-[2rem] border border-cele-200/70 bg-white/55 backdrop-blur-md p-8 sm:p-10 shadow-[0_30px_80px_-40px_rgba(54,131,191,0.4)]">
          <p className="text-center text-cele-700 text-xs uppercase tracking-[0.3em]">
            faltan para tu cumple
          </p>

          <div className="mt-6 grid grid-cols-4 gap-3 sm:gap-4">
            <Unit label="días" value={parts ? pad(parts.d, 3) : "···"} />
            <Unit label="horas" value={parts ? pad(parts.h) : "··"} />
            <Unit label="minutos" value={parts ? pad(parts.m) : "··"} />
            <Unit label="segundos" value={parts ? pad(parts.s) : "··"} />
          </div>

          <div className="mt-8 text-center text-sm sm:text-[15px] text-ink/70 leading-relaxed font-serif italic">
            “hay que ver si llegamos a seguir hablando para esa fecha”
          </div>
          <div className="mt-2 text-center text-sm text-cele-700">
            — y yo voy a poner todo para que sí.
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Unit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full rounded-2xl bg-gradient-to-b from-cele-50 to-cele-100 border border-cele-200/70 px-2 py-3 sm:py-4 overflow-hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="block font-serif text-2xl sm:text-4xl text-cele-800 tabular-nums text-center tracking-tight"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-cele-700/80">
        {label}
      </span>
    </div>
  );
}
