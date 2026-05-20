"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Author } from "@/lib/posts";
import type { Plan } from "@/lib/plans";

const BURST_EMOJIS = ["🩵", "✨", "💙", "🎉", "🥹"];

export default function PlansRoulette() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [author, setAuthor] = useState<Author>("marc");
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [display, setDisplay] = useState<string | null>(null);
  const [landed, setLanded] = useState(false);
  const [burst, setBurst] = useState(0);
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
      const list: Plan[] = data.plans ?? [];
      setPlans(list);
      setSelected(new Set(list.map((p) => p.id))); // arrancan todas activas
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
        const plan = data.plan as Plan;
        setPlans((prev) => [...prev, plan]);
        setSelected((prev) => new Set(prev).add(plan.id));
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
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    try {
      await fetch(`/api/plans?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    } catch {
      /* noop */
    }
  }

  const pool = plans.filter((p) => selected.has(p.id));

  function spin() {
    if (spinning || pool.length === 0) return;
    setSpinning(true);
    setLanded(false);
    const winner = pool[Math.floor(Math.random() * pool.length)];
    const total = 18 + Math.floor(Math.random() * 8);
    let i = 0;
    const step = () => {
      setDisplay(pool[i % pool.length].text);
      i++;
      if (i < total) {
        // arranca rápido y va frenando (efecto tómbola)
        const delay = Math.min(38 + i * i * 1.15, 380);
        timer.current = setTimeout(step, delay);
      } else {
        setDisplay(winner.text);
        setLanded(true);
        setSpinning(false);
        setBurst(Date.now());
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
      className="relative max-w-md mx-auto bg-[#fffef5] px-6 sm:px-7 py-8 shadow-[0_18px_40px_-18px_rgba(20,60,90,0.55)]"
    >
      <span
        className="tape left-1/2 -top-3"
        style={{ transform: "translateX(-50%) rotate(-3deg)" }}
      />

      <h2 className="font-hand text-4xl text-[var(--ink)] text-center">¿qué hacemos?</h2>
      <p className="font-hand text-xl text-[var(--ink-soft)] text-center mt-1">
        tocá las ideas para dejar solo las que pintan hoy, y girá.
      </p>

      {/* Pantalla de resultado */}
      <div className="relative mt-5">
        <motion.div
          animate={
            spinning
              ? { rotate: [-1.4, 1.4, -1.4], x: [-2.5, 2.5, -2.5] }
              : { rotate: 0, x: 0 }
          }
          transition={
            spinning
              ? { duration: 0.16, repeat: Infinity, ease: "linear" }
              : { duration: 0.3 }
          }
          className="hand-box bg-white min-h-[92px] flex items-center justify-center px-5 py-4 text-center"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={display ?? "idle"}
              initial={{ opacity: 0, y: spinning ? 10 : 6, scale: landed ? 0.55 : 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              transition={
                landed
                  ? { type: "spring", stiffness: 460, damping: 13 }
                  : { duration: spinning ? 0.1 : 0.4, ease: [0.22, 1, 0.36, 1] }
              }
              className={[
                "font-hand text-[var(--ink)] leading-tight",
                landed ? "text-3xl sm:text-4xl" : "text-2xl",
              ].join(" ")}
            >
              {display ??
                (plans.length === 0
                  ? "todavía no hay ideas…"
                  : pool.length === 0
                    ? "elegí alguna idea 👇"
                    : "dale, girá 👇")}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        {burst > 0 && <Burst key={burst} />}
      </div>

      <motion.button
        onClick={spin}
        disabled={spinning || pool.length === 0}
        whileTap={{ scale: 0.96 }}
        animate={spinning ? { scale: [1, 1.015, 1] } : { scale: 1 }}
        transition={spinning ? { duration: 0.4, repeat: Infinity } : { duration: 0.2 }}
        className="mt-4 w-full py-3 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition disabled:opacity-40 rounded-sm shadow-md"
      >
        {spinning ? "girando…" : "girar la ruleta 🎡"}
      </motion.button>
      {plans.length > 0 && !spinning && (
        <p className="mt-2 text-center font-hand text-base text-[var(--ink-soft)]">
          {pool.length} de {plans.length} en la ronda
        </p>
      )}

      {/* Cargar idea */}
      <div className="mt-6 flex gap-2 mb-3">
        <AuthorChip current={author} value="marc" onClick={handleAuthor} />
        <AuthorChip current={author} value="cele" onClick={handleAuthor} />
      </div>
      <div className="flex gap-2 items-stretch">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={140}
          placeholder="una idea de plan…"
          className="min-w-0 flex-1 px-3 py-2 bg-transparent border-2 border-[var(--rule)] focus:border-[var(--ink)] outline-none transition font-hand text-2xl text-[var(--ink)] rounded-sm"
        />
        <button
          onClick={add}
          disabled={adding || !text.trim()}
          className="shrink-0 px-4 font-note bg-cele-100 text-[var(--ink)] border-2 border-[var(--ink-soft)] rounded-sm disabled:opacity-40 hover:bg-cele-200 transition"
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
            {plans.map((p) => {
              const on = selected.has(p.id);
              return (
                <li
                  key={p.id}
                  className={[
                    "flex items-center gap-1.5 rounded-full pl-3 pr-2 py-1 border transition",
                    on
                      ? "bg-cele-100 border-[var(--ink-soft)]"
                      : "bg-transparent border-dashed border-[var(--rule)] opacity-50",
                  ].join(" ")}
                >
                  <button
                    onClick={() => toggleSelected(p.id)}
                    aria-pressed={on}
                    className={[
                      "font-hand text-lg leading-none transition",
                      on ? "text-[var(--ink)]" : "text-[var(--ink-soft)] line-through",
                    ].join(" ")}
                  >
                    {p.text}
                  </button>
                  <button
                    onClick={() => remove(p.id)}
                    aria-label="borrar idea"
                    className="text-[var(--ink-soft)] hover:text-rose-500 transition text-xs leading-none"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )
      )}
    </motion.section>
  );
}

function Burst() {
  const parts = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: (Math.random() * 2 - 1) * 150,
        y: (Math.random() * -1 - 0.15) * 130,
        rot: (Math.random() * 2 - 1) * 240,
        emoji: BURST_EMOJIS[i % BURST_EMOJIS.length],
        delay: Math.random() * 0.08,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {parts.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.4, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.15, rotate: p.rot }}
          transition={{ duration: 0.95, delay: p.delay, ease: "easeOut" }}
          className="absolute text-xl"
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
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
