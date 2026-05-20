"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Author } from "@/lib/posts";
import type { PublicRound } from "@/lib/game";
import { pickWords } from "@/lib/words";
import DrawCanvas, { type DrawCanvasHandle } from "./draw-canvas";

const GUESS_SECONDS = 90;

const nameOf = (a?: Author) => (a === "cele" ? "Cele" : "Marc");
const otherName = (a: Author) => (a === "marc" ? "Cele" : "Marc");

export default function Pictionary() {
  const [author, setAuthor] = useState<Author>("marc");
  const [round, setRound] = useState<PublicRound | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("lb_author") : null;
    if (s === "marc" || s === "cele") setAuthor(s);
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/game", { cache: "no-store" });
      const data = await res.json();
      setRound(data.round ?? { status: "empty" });
    } catch {
      setRound({ status: "empty" });
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 18, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.6 }}
      className="relative max-w-md mx-auto bg-[#fffef5] px-6 sm:px-7 py-8 shadow-[0_18px_40px_-18px_rgba(20,60,90,0.55)]"
    >
      <span
        className="tape left-1/2 -top-3"
        style={{ transform: "translateX(-50%) rotate(-2deg)" }}
      />

      <h2 className="font-hand text-4xl text-[var(--ink)] text-center">
        dibujá y adiviná 🎨
      </h2>
      <p className="font-hand text-xl text-[var(--ink-soft)] text-center mt-1">
        uno dibuja, el otro tiene 1:30 para adivinar.
      </p>

      <div className="flex gap-2 justify-center mt-4">
        <AuthorChip current={author} value="marc" onClick={handleAuthor} />
        <AuthorChip current={author} value="cele" onClick={handleAuthor} />
      </div>

      <div className="mt-6">
        {loading || !round ? (
          <p className="font-hand text-xl text-[var(--ink-soft)] text-center">cargando…</p>
        ) : (
          <Stage author={author} round={round} reload={load} />
        )}
      </div>
    </motion.section>
  );
}

function Stage({
  author,
  round,
  reload,
}: {
  author: Author;
  round: PublicRound;
  reload: () => void;
}) {
  const [creating, setCreating] = useState(false);

  if (round.status === "awaiting_guess") {
    if (author === round.guesser) {
      return <GuessView author={author} round={round} reload={reload} />;
    }
    return (
      <Waiting
        text={`ya enviaste tu dibujo ✏️ — esperando que ${nameOf(round.guesser)} lo adivine.`}
        reload={reload}
      />
    );
  }

  if (creating) {
    return (
      <DrawView
        author={author}
        onCancel={() => setCreating(false)}
        onSent={() => {
          setCreating(false);
          reload();
        }}
      />
    );
  }

  return <Idle round={round} onStart={() => setCreating(true)} reload={reload} />;
}

function Idle({
  round,
  onStart,
  reload,
}: {
  round: PublicRound;
  onStart: () => void;
  reload: () => void;
}) {
  return (
    <div className="text-center">
      {round.status === "done" && round.result && (
        <div className="hand-box bg-white px-5 py-5 mb-5">
          <p className="font-hand text-2xl text-[var(--ink)]">
            {round.result.guessed
              ? `¡${nameOf(round.result.guesser)} adivinó! 🎉`
              : `${nameOf(round.result.guesser)} no la sacó 😅`}
          </p>
          <p className="font-hand text-xl text-[var(--ink-soft)] mt-1">
            era “{round.word}”
          </p>
        </div>
      )}

      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.96 }}
        className="w-full py-3.5 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition rounded-sm shadow-md"
      >
        empezar juego nuevo 🎨
      </motion.button>
      <button
        onClick={reload}
        className="mt-3 font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
      >
        actualizar
      </button>
    </div>
  );
}

function Waiting({ text, reload }: { text: string; reload: () => void }) {
  return (
    <div className="hand-box bg-white px-5 py-6 text-center">
      <p className="font-hand text-2xl text-[var(--ink)]">{text}</p>
      <button
        onClick={reload}
        className="mt-3 font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
      >
        actualizar
      </button>
    </div>
  );
}

function DrawView({
  author,
  onCancel,
  onSent,
}: {
  author: Author;
  onCancel: () => void;
  onSent: () => void;
}) {
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const [options, setOptions] = useState<string[]>(() => pickWords(3));
  const [word, setWord] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    if (canvasRef.current?.isBlank()) {
      setError("dibujá algo primero 🙂");
      return;
    }
    setSending(true);
    try {
      const dataUrl = canvasRef.current!.toDataURL();
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author, word, dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "no se pudo enviar");
        setSending(false);
        return;
      }
      onSent();
    } catch {
      setError("se cortó la conexión");
      setSending(false);
    }
  }

  // Paso 1: elegir una de 3 palabras
  if (!word) {
    return (
      <div className="text-center">
        <p className="font-hand text-2xl text-[var(--ink)] mb-4">
          elegí qué dibujar 👇
        </p>
        <div className="flex flex-col gap-3">
          {options.map((w) => (
            <motion.button
              key={w}
              onClick={() => setWord(w)}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 font-hand text-3xl text-[var(--ink)] bg-cele-50 border-2 border-[var(--rule)] hover:border-[var(--ink)] hover:bg-cele-100 transition rounded-sm"
            >
              {w}
            </motion.button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() => setOptions(pickWords(3))}
            className="font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
          >
            otras 3
          </button>
          <button
            onClick={onCancel}
            className="font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
          >
            cancelar
          </button>
        </div>
      </div>
    );
  }

  // Paso 2: dibujar
  return (
    <div>
      <p className="font-hand text-2xl text-[var(--ink)] text-center">
        dibujá:{" "}
        <span className="text-[var(--ink-soft)]">“{word}”</span>
      </p>
      <p className="font-note text-xs text-[var(--ink-soft)] text-center mb-3">
        sin apuro, tomate el tiempo. {otherName(author)} lo va a adivinar 🙈
      </p>

      <DrawCanvas ref={canvasRef} />

      {error && <p className="mt-3 font-hand text-xl text-rose-500 text-center">{error}</p>}

      <motion.button
        onClick={send}
        disabled={sending}
        whileTap={{ scale: 0.97 }}
        className="mt-4 w-full py-3 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition disabled:opacity-40 rounded-sm shadow-md"
      >
        {sending ? "enviando…" : "enviar dibujo →"}
      </motion.button>
      <button
        onClick={() => setWord(null)}
        className="mt-3 w-full font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
      >
        ← cambiar palabra
      </button>
    </div>
  );
}

function GuessView({
  author,
  round,
  reload,
}: {
  author: Author;
  round: PublicRound;
  reload: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "playing" | "won" | "timeup">("intro");
  const [timeLeft, setTimeLeft] = useState(GUESS_SECONDS);
  const [guess, setGuess] = useState("");
  const [wrong, setWrong] = useState<string[]>([]);
  const [revealWord, setRevealWord] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  function start() {
    setPhase("playing");
    setTimeLeft(GUESS_SECONDS);
    tick.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (tick.current) clearInterval(tick.current);
          timeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  async function timeUp() {
    if (tick.current) clearInterval(tick.current);
    setPhase("timeup");
    try {
      const res = await fetch("/api/game/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author }),
      });
      const data = await res.json();
      setRevealWord(data?.word ?? null);
    } catch {
      /* noop */
    }
  }

  async function submitGuess() {
    const g = guess.trim();
    if (!g || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/game/guess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author, guess: g }),
      });
      const data = await res.json();
      if (data?.correct) {
        if (tick.current) clearInterval(tick.current);
        setRevealWord(data.word ?? g);
        setPhase("won");
      } else {
        setWrong((w) => [g, ...w].slice(0, 8));
        setGuess("");
      }
    } catch {
      /* noop */
    } finally {
      setChecking(false);
    }
  }

  const mmss = useMemo(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  if (phase === "intro") {
    return (
      <div className="hand-box bg-white px-5 py-6 text-center">
        <p className="font-hand text-2xl text-[var(--ink)]">
          {nameOf(round.drawer)} te dejó un dibujo 🎨
        </p>
        <p className="font-hand text-xl text-[var(--ink-soft)] mt-1">
          cuando empieces, tenés <b>1:30</b> para adivinar.
        </p>
        <motion.button
          onClick={start}
          whileTap={{ scale: 0.96 }}
          className="mt-4 w-full py-3 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition rounded-sm shadow-md"
        >
          ¡empezar! ⏱️
        </motion.button>
      </div>
    );
  }

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={round.imageUrl}
        alt="dibujo para adivinar"
        className="w-full rounded-md border-2 border-[var(--ink-soft)] bg-white"
      />

      {phase === "playing" && (
        <>
          <div className="mt-3 flex items-center justify-center">
            <span
              className={[
                "font-hand text-4xl tabular-nums",
                timeLeft <= 15 ? "text-rose-500" : "text-[var(--ink)]",
              ].join(" ")}
            >
              ⏱️ {mmss}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitGuess()}
              autoFocus
              placeholder="¿qué es?"
              className="min-w-0 flex-1 px-3 py-2 bg-transparent border-2 border-[var(--rule)] focus:border-[var(--ink)] outline-none transition font-hand text-2xl text-[var(--ink)] rounded-sm"
            />
            <button
              onClick={submitGuess}
              disabled={checking || !guess.trim()}
              className="shrink-0 px-4 font-note bg-[var(--ink)] text-white rounded-sm disabled:opacity-40 hover:bg-[var(--ink-soft)] transition"
            >
              adivinar
            </button>
          </div>
          {wrong.length > 0 && (
            <p className="mt-3 font-hand text-lg text-[var(--ink-soft)]">
              frío frío: <span className="line-through">{wrong.join(", ")}</span>
            </p>
          )}
        </>
      )}

      {phase === "won" && (
        <Result title="¡le pegaste! 🎉" subtitle={`era “${revealWord}”`} reload={reload} />
      )}
      {phase === "timeup" && (
        <Result
          title="se acabó el tiempo 😅"
          subtitle={revealWord ? `era “${revealWord}”` : ""}
          reload={reload}
        />
      )}
    </div>
  );
}

function Result({
  title,
  subtitle,
  reload,
}: {
  title: string;
  subtitle: string;
  reload: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 16 }}
      className="mt-4 text-center"
    >
      <p className="font-hand text-3xl text-[var(--ink)]">{title}</p>
      {subtitle && <p className="font-hand text-2xl text-[var(--ink-soft)] mt-1">{subtitle}</p>}
      <motion.button
        onClick={reload}
        whileTap={{ scale: 0.96 }}
        className="mt-4 w-full py-3 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition rounded-sm shadow-md"
      >
        seguir →
      </motion.button>
    </motion.div>
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
      soy {value === "cele" ? "Cele" : "Marc"}
    </button>
  );
}
