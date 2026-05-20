"use client";

import { motion } from "motion/react";

const fadeUp = {
  hidden: { opacity: 0, y: 14, filter: "blur(10px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, delay: 0.2 + i * 0.18, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Hero() {
  return (
    <section className="pt-24 sm:pt-32 pb-12 px-6 text-center">
      <motion.p
        custom={0}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="text-cele-700 text-[11px] sm:text-xs uppercase tracking-[0.35em] mb-8"
      >
        19 de mayo, 2026 · una paginita
      </motion.p>

      <motion.h1
        custom={1}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="font-serif text-ink leading-[1.05] text-[clamp(2.6rem,7vw,5.4rem)] tracking-tight"
      >
        una paginita para{" "}
        <span className="italic text-cele-600 signature-underline">Cele</span>
      </motion.h1>

      <motion.p
        custom={2}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="mt-8 text-base sm:text-lg text-ink/70 max-w-xl mx-auto leading-relaxed"
      >
        de parte de Marc.{" "}
        <span className="italic text-cele-700">hecha con cariñito.</span>
      </motion.p>

      <motion.div
        custom={3}
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="mt-10 flex items-center justify-center gap-3"
      >
        <span className="h-px w-12 bg-cele-300/70" />
        <span className="text-cele-600 text-xs tracking-[0.25em] uppercase">
          celeste, como vos
        </span>
        <span className="h-px w-12 bg-cele-300/70" />
      </motion.div>
    </section>
  );
}
