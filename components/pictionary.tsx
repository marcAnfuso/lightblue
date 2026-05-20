"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Author } from "@/lib/posts";
import type { PublicRound, Scores } from "@/lib/game";
import { pickWords } from "@/lib/words";
import DrawCanvas, { type DrawCanvasHandle, type DrawStrokes } from "./draw-canvas";

const GUESS_SECONDS = 90;

const nameOf = (a?: Author) => (a === "cele" ? "Cele" : "Marc");
const otherName = (a: Author) => (a === "marc" ? "Cele" : "Marc");

export default function Pictionary() {
  const [author, setAuthor] = useState<Author | null>(null);
  const [round, setRound] = useState<PublicRound | null>(null);
  const [used, setUsed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("lb_author") : null;
    if (s === "marc" || s === "cele") setAuthor(s);
    load();
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/game", { cache: "no-store" });
      const data = await res.json();
      setRound(data.round ?? { status: "empty", scores: { marc: 0, cele: 0 } });
      setUsed(Array.isArray(data.used) ? data.used : []);
    } catch {
      setRound({ status: "empty", scores: { marc: 0, cele: 0 } });
    } finally {
      setLoading(false);
    }
  }

  async function resetMatch() {
    if (!confirm("¿Reiniciar el marcador y empezar de cero?")) return;
    try {
      await fetch("/api/game", { method: "DELETE" });
    } catch {
      /* noop */
    }
    load();
  }

  function pickIdentity(a: Author) {
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
      className="relative max-w-md mx-auto bg-[#fffef5] px-5 sm:px-7 py-7 shadow-[0_18px_40px_-18px_rgba(20,60,90,0.55)]"
    >
      <span
        className="tape left-1/2 -top-3"
        style={{ transform: "translateX(-50%) rotate(-2deg)" }}
      />

      {author === null ? (
        <IdentityGate onPick={pickIdentity} />
      ) : (
        <>
          {!creating && (
            <div className="mb-5">
              <h2 className="font-hand text-3xl text-[var(--ink)] text-center leading-none">
                dibujá y adiviná 🎨
              </h2>
              {round && <Scoreboard scores={round.scores} />}
            </div>
          )}

          {loading || !round ? (
            <p className="font-hand text-xl text-[var(--ink-soft)] text-center">cargando…</p>
          ) : (
            <Stage
              author={author}
              round={round}
              used={used}
              creating={creating}
              setCreating={setCreating}
              reload={load}
            />
          )}

          {!creating && (
            <div className="mt-6 flex items-center justify-center gap-3 font-note text-xs text-[var(--ink-soft)]/70">
              <span>sos {author === "cele" ? "Cele" : "Marc"}</span>
              <button onClick={() => setAuthor(null)} className="underline hover:text-[var(--ink)]">
                cambiar
              </button>
              <span>·</span>
              <button onClick={resetMatch} className="underline hover:text-[var(--ink)]">
                reiniciar marcador
              </button>
            </div>
          )}
        </>
      )}
    </motion.section>
  );
}

function IdentityGate({ onPick }: { onPick: (a: Author) => void }) {
  return (
    <div className="text-center py-4">
      <h2 className="font-hand text-4xl text-[var(--ink)]">dibujá y adiviná 🎨</h2>
      <p className="font-hand text-2xl text-[var(--ink-soft)] mt-4 mb-5">¿quién sos?</p>
      <div className="flex flex-col gap-3">
        <motion.button
          onClick={() => onPick("marc")}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 font-hand text-3xl text-white bg-[var(--ink)] hover:bg-[var(--ink-soft)] transition rounded-sm shadow-md"
        >
          soy Marc
        </motion.button>
        <motion.button
          onClick={() => onPick("cele")}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3.5 font-hand text-3xl text-[var(--ink)] bg-cele-50 border-2 border-[var(--ink-soft)] hover:bg-cele-100 transition rounded-sm"
        >
          soy Cele
        </motion.button>
      </div>
      <p className="font-note text-xs text-[var(--ink-soft)] mt-4">
        queda guardado en este celular.
      </p>
    </div>
  );
}

function Scoreboard({ scores }: { scores: Scores }) {
  const leader = scores.marc === scores.cele ? null : scores.marc > scores.cele ? "marc" : "cele";
  return (
    <div className="mt-3 flex items-center justify-center gap-4 font-hand text-[var(--ink)]">
      <span className={leader === "marc" ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"}>
        {leader === "marc" && "👑 "}Marc <b className="text-3xl">{scores.marc}</b>
      </span>
      <span className="text-[var(--ink-soft)]">·</span>
      <span className={leader === "cele" ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"}>
        <b className="text-3xl">{scores.cele}</b> Cele{leader === "cele" && " 👑"}
      </span>
    </div>
  );
}

function Stage({
  author,
  round,
  used,
  creating,
  setCreating,
  reload,
}: {
  author: Author;
  round: PublicRound;
  used: string[];
  creating: boolean;
  setCreating: (v: boolean) => void;
  reload: () => void;
}) {
  // alguien está adivinando
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

  // dibujando ahora
  if (creating) {
    return (
      <DrawView
        author={author}
        used={used}
        onCancel={() => setCreating(false)}
        onSent={() => {
          setCreating(false);
          reload();
        }}
      />
    );
  }

  // ronda terminada: dibuja quien adivinó/perdió
  if (round.status === "done") {
    const myTurn = author === round.nextDrawer;
    return (
      <div className="text-center">
        <div className="hand-box bg-white px-5 py-5 mb-5">
          <p className="font-hand text-2xl text-[var(--ink)]">
            {round.result?.guessed
              ? `¡${nameOf(round.result.guesser)} adivinó! +1 🎉`
              : `${nameOf(round.result?.guesser)} no la sacó 😅`}
          </p>
          <p className="font-hand text-xl text-[var(--ink-soft)] mt-1">era “{round.word}”</p>
        </div>
        {myTurn ? (
          <StartButton label="te toca dibujar 🎨" onStart={() => setCreating(true)} reload={reload} />
        ) : (
          <Waiting text={`le toca dibujar a ${nameOf(round.nextDrawer)} 🖍️`} reload={reload} />
        )}
      </div>
    );
  }

  // vacío: arranca cualquiera
  return <StartButton label="empezar juego nuevo 🎨" onStart={() => setCreating(true)} reload={reload} />;
}

function StartButton({
  label,
  onStart,
  reload,
}: {
  label: string;
  onStart: () => void;
  reload: () => void;
}) {
  return (
    <div className="text-center">
      <motion.button
        onClick={onStart}
        whileTap={{ scale: 0.96 }}
        className="w-full py-3.5 font-note bg-[var(--ink)] text-white text-lg hover:bg-[var(--ink-soft)] transition rounded-sm shadow-md"
      >
        {label}
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
  used,
  onCancel,
  onSent,
}: {
  author: Author;
  used: string[];
  onCancel: () => void;
  onSent: () => void;
}) {
  const canvasRef = useRef<DrawCanvasHandle>(null);
  const [options, setOptions] = useState<string[]>(() => pickWords(3, used));
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
      const strokes = canvasRef.current!.getStrokes();
      const res = await fetch("/api/game", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ author, word, dataUrl, strokes }),
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

  if (!word) {
    return (
      <div className="text-center">
        <p className="font-hand text-2xl text-[var(--ink)] mb-4">elegí qué dibujar 👇</p>
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
            onClick={() => setOptions(pickWords(3, used))}
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

  return (
    <div className="no-callout">
      <p className="font-hand text-2xl text-[var(--ink)] text-center">
        dibujá: <span className="text-[var(--ink-soft)]">“{word}”</span>
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
  const [placed, setPlaced] = useState<{ idx: number; ch: string }[]>([]);
  const [wrong, setWrong] = useState(false);
  const [revealWord, setRevealWord] = useState<string | null>(null);
  const checking = useRef(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const puzzle = round.puzzle;
  const total = useMemo(
    () => (puzzle ? puzzle.segments.reduce((a, b) => a + b, 0) : 0),
    [puzzle]
  );
  const usedIdx = useMemo(() => new Set(placed.map((p) => p.idx)), [placed]);
  const assembled = placed.map((p) => p.ch).join("");

  useEffect(() => {
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, []);

  function start() {
    setPhase("playing");
    setTimeLeft(GUESS_SECONDS);
    setPlaced([]);
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

  // auto-chequea cuando se completan todos los casilleros
  useEffect(() => {
    if (phase !== "playing" || total === 0 || placed.length !== total || checking.current) {
      return;
    }
    checking.current = true;
    (async () => {
      try {
        const res = await fetch("/api/game/guess", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ author, guess: assembled }),
        });
        const data = await res.json();
        if (data?.correct) {
          if (tick.current) clearInterval(tick.current);
          setRevealWord(data.word ?? assembled);
          setPhase("won");
        } else {
          setWrong(true);
          setTimeout(() => {
            setWrong(false);
            setPlaced([]);
            checking.current = false;
          }, 700);
          return;
        }
      } catch {
        /* noop */
      }
      checking.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placed, total, phase]);

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
          tenés <b>1:30</b> para adivinar con las letras.
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
      <ReplayCanvas strokesUrl={round.strokesUrl} imageUrl={round.imageUrl} />

      {phase === "playing" && puzzle && (
        <>
          {/* barra de tiempo */}
          <div className="mt-3 h-2.5 w-full rounded-full bg-cele-100 overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-[width] duration-1000 ease-linear",
                timeLeft <= 15 ? "bg-rose-400" : "bg-[var(--ink-soft)]",
              ].join(" ")}
              style={{ width: `${(timeLeft / GUESS_SECONDS) * 100}%` }}
            />
          </div>
          <p
            className={[
              "mt-1 text-center font-hand text-2xl tabular-nums",
              timeLeft <= 15 ? "text-rose-500" : "text-[var(--ink-soft)]",
            ].join(" ")}
          >
            {mmss}
          </p>

          {/* casilleros */}
          <motion.div
            animate={wrong ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-2"
          >
            {puzzle.segments.map((len, segIdx) => {
              const offset = puzzle.segments.slice(0, segIdx).reduce((a, b) => a + b, 0);
              return (
                <div key={segIdx} className="flex gap-1">
                  {Array.from({ length: len }).map((_, j) => {
                    const ch = placed[offset + j]?.ch ?? "";
                    return (
                      <span
                        key={j}
                        className={[
                          "w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center border-b-[3px] font-hand text-2xl",
                          wrong
                            ? "border-rose-400 text-rose-500"
                            : "border-[var(--ink-soft)] text-[var(--ink)]",
                        ].join(" ")}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>

          {/* banco de letras */}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {puzzle.letters.map((ch, i) => {
              const isUsed = usedIdx.has(i);
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.85 }}
                  disabled={isUsed || placed.length >= total}
                  onClick={() => setPlaced((p) => [...p, { idx: i, ch }])}
                  className={[
                    "w-10 h-11 rounded-md font-hand text-2xl border-2 transition",
                    isUsed
                      ? "opacity-25 border-[var(--rule)] bg-transparent"
                      : "bg-cele-50 border-[var(--ink-soft)] text-[var(--ink)] hover:bg-cele-100",
                  ].join(" ")}
                >
                  {ch}
                </motion.button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setPlaced((p) => p.slice(0, -1))}
              disabled={placed.length === 0}
              className="font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)] disabled:opacity-40"
            >
              ⌫ borrar
            </button>
            <button
              onClick={() => setPlaced([])}
              disabled={placed.length === 0}
              className="font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)] disabled:opacity-40"
            >
              limpiar
            </button>
          </div>
        </>
      )}

      {phase === "playing" && !puzzle && (
        <p className="mt-4 text-center font-hand text-xl text-rose-500">
          (este dibujo es viejo, empezá uno nuevo)
        </p>
      )}

      {phase === "won" && (
        <Result title="¡le pegaste! +1 🎉" subtitle={`era “${revealWord}”`} reload={reload} />
      )}
      {phase === "timeup" && (
        <Result
          title="se acabó el tiempo 😅"
          subtitle={revealWord ? `era “${revealWord}” — ahora dibujás vos` : "ahora dibujás vos"}
          reload={reload}
        />
      )}
    </div>
  );
}

function ReplayCanvas({
  strokesUrl,
  imageUrl,
}: {
  strokesUrl?: string;
  imageUrl?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<DrawStrokes | null>(null);
  const raf = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  function play() {
    const cv = ref.current;
    const data = dataRef.current;
    if (!cv || !data) return;
    if (raf.current) cancelAnimationFrame(raf.current);
    cv.width = data.w;
    cv.height = data.h;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, data.w, data.h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    type Seg = { c: string; lw: number; x0: number; y0: number; x1: number; y1: number; dot?: boolean };
    const segs: Seg[] = [];
    for (const s of data.strokes) {
      if (s.p.length === 2) {
        segs.push({ c: s.c, lw: s.lw, x0: s.p[0], y0: s.p[1], x1: s.p[0], y1: s.p[1], dot: true });
        continue;
      }
      for (let i = 0; i < s.p.length - 2; i += 2) {
        segs.push({ c: s.c, lw: s.lw, x0: s.p[i], y0: s.p[i + 1], x1: s.p[i + 2], y1: s.p[i + 3] });
      }
    }
    const perFrame = Math.max(2, Math.ceil(segs.length / 150)); // ~2-3s
    let idx = 0;
    const step = () => {
      for (let k = 0; k < perFrame && idx < segs.length; k++, idx++) {
        const g = segs[idx];
        if (g.dot) {
          ctx.fillStyle = g.c;
          ctx.beginPath();
          ctx.arc(g.x0, g.y0, g.lw / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = g.c;
          ctx.lineWidth = g.lw;
          ctx.beginPath();
          ctx.moveTo(g.x0, g.y0);
          ctx.lineTo(g.x1, g.y1);
          ctx.stroke();
        }
      }
      if (idx < segs.length) raf.current = requestAnimationFrame(step);
    };
    step();
  }

  useEffect(() => {
    let alive = true;
    if (!strokesUrl) return;
    fetch(strokesUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: DrawStrokes) => {
        if (!alive) return;
        dataRef.current = d;
        setReady(true);
        play();
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokesUrl]);

  if (!strokesUrl) {
    // ronda vieja sin trazos: imagen estática
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt="dibujo para adivinar"
        className="w-full rounded-md border-2 border-[var(--ink-soft)] bg-white"
      />
    );
  }

  return (
    <div>
      <canvas
        ref={ref}
        className="w-full rounded-md border-2 border-[var(--ink-soft)] bg-white aspect-square"
      />
      {ready && (
        <button
          onClick={play}
          className="mt-1 block mx-auto font-note text-sm text-[var(--ink-soft)] underline hover:text-[var(--ink)]"
        >
          ▶ ver de nuevo cómo lo dibujó
        </button>
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

