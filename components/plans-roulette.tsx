"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Author } from "@/lib/posts";
import type { Plan } from "@/lib/plans";

export default function PlansRoulette() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<Author>("marc");
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("lb_author") : null;
    if (s === "marc" || s === "cele") setAuthor(s);
    load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/plans", { cache: "no-store" });
      const data = await res.json();
      setPlans(data.plans ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAuthor(a: Author) {
    setAuthor(a);
    try {
      localStorage.setItem("lb_author", a);
    } catch {}
  }

  async function add() {
    const t = text.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: t, author }),
      });
      const data = await res.json();
      if (res.ok && data.plan) {
        setPlans((prev) => [...prev, data.plan as Plan]);
        setText("");
      }
    } catch {
      /* noop */
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    setPlans((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      /* noop */
    }
  }

  function spin() {
    if (spinning || plans.length === 0) return;
    setSpinning(true);
    setLanded(false);
    const winner = plans[Math.floor(Math.random() * plans.length)];
    const total = 16 + Math.floor(Math.random() * 8);
    let i = 0;
    const step = () => {
      setDisplay(plans[i % plans.length].text);
      i++;
      if (i < total) {
        const delay = Math.min(40 + i * i * 1.1, 360);
        timer.current = setTimeout(step, delay);
      } else {
        setDisplay(winner.text);
        setLanded(true);
        setSpinning(false);
      }
    };
    step();
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, rotate: -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative max-w-md mx-auto bg-[#fffef5] px-7 py-8 shadow-[0_18px_40px_-18px_rgba(20,60,90,0.55)]"
    >
      <span
        className="tape left-1/2 -top-3"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <h2 className="font-hand text-4xl text-[var(--ink)] text-center">
        ¿qué hacemos?
      </h2>
      <p className="font-hand text-xl text-[var(--ink-soft)] text-center mt-1">
        cargá ideas los dos y, cuando no sepan qué hacer, girá.
      </p>

      {/* Pantalla de resultado */}
      <div className="mt-5 hand-box bg-white min-h-[88px] flex items-center justify-center px-5 py-4 text-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={display ?? "idle"}
            initial={{ opacity: 0, y: spinning ? 8 : 0, scale: landed ? 0.9 : 1 }}
            animate={{ opacity: 1, y: 0, scale: landed ? 1 : 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: spinning ? 0.12 : 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={[
              "font-hand text-[var(--ink)] leading-tight",
              landed ? "text-3xl" : "text-2xl",
            ].join(" ")}
          >
            {display ?? (plans.length ? "dale, girá 👇" : "todavía no hay ideas…")}
          </motion.p>
        </AnimatePresence>
      </div>

      <motion.button
        onClick={spin}
        disabled={spinning || plans.length === 0}
        whileTap={{ scale: 0.96 }}
        className="mt-4 w-full py-3 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition disabled:opacity-40 rounded-sm shadow-md"
      >
        {spinning ? "girando…" : "girar la ruleta 🎡"}
      </motion.button>

      {/* Cargar idea */}
      <div className="mt-6 flex gap-2 mb-3">
        <AuthorChip current={author} value="marc" onClick={handleAuthor} />
        <AuthorChip current={author} value="cele" onClick={handleAuthor} />
      </div>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={140}
          placeholder="una idea de plan…"
          className="flex-1 px-3 py-2 bg-transparent border-2 border-[var(--rule)] focus:border-[var(--ink)] outline-none transition font-hand text-2xl text-[var(--ink)] rounded-sm"
        />
        <button
          onClick={add}
          disabled={adding || !text.trim()}
          className="px-4 font-note bg-cele-100 text-[var(--ink)] border-2 border-[var(--ink-soft)] rounded-sm disabled:opacity-40 hover:bg-cele-200 transition"
        >
          sumar
        </button>
      </div>

      {/* Lista de ideas */}
      {loading ? (
        <p className="font-hand text-lg text-[var(--ink-soft)] mt-4 text-center">cargando…</p>
      ) : (
        plans.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {plans.map((p) => (
              <li
                key={p.id}
                className="group flex items-center gap-1.5 bg-cele-50 border border-[var(--rule)] rounded-full pl-3 pr-2 py-1"
              >
                <span className="font-hand text-lg text-[var(--ink)] leading-none">
                  {p.text}
                </span>
                <button
                  onClick={() => remove(p.id)}
                  aria-label="borrar idea"
                  className="text-[var(--ink-soft)] hover:text-rose-500 transition text-xs leading-none"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </motion.section>
  );
}

function AuthorChip({
  current,
  value,
  onClick,
}: {
  current: Author;
  value: Author;
  onClick: (v: Author) => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={[
        "font-hand text-xl px-4 py-1 rounded-sm border-2 transition",
        active
          ? "bg-[var(--ink)] text-white border-[var(--ink)]"
          : "bg-transparent text-[var(--ink-soft)] border-[var(--rule)] hover:border-[var(--ink-soft)]",
      ].join(" ")}
    >
      de {value === "cele" ? "Cele" : "Marc"}
    </button>
  );
}
