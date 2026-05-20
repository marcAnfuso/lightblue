"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const W = 720;
const H = 720;
const COLORS = [
  "#1a2230", // negro
  "#1f4f74", // azul tinta
  "#2d6cdf", // azul
  "#3aa5d8", // celeste
  "#2a9d8f", // turquesa
  "#3aa564", // verde
  "#8bc34a", // verde claro
  "#f2c94c", // amarillo
  "#e8a13b", // mostaza
  "#e8732b", // naranja
  "#c0392b", // rojo
  "#e0507a", // rosa
  "#b06ab3", // violeta
  "#7b5bd6", // púrpura
  "#8d5a3b", // marrón
  "#f1b6a0", // piel
  "#7a7f87", // gris
  "#ffffff", // blanco
];
const SIZES = [3, 7, 14, 26];

export type Stroke = { c: string; lw: number; p: number[] };
export type DrawStrokes = { w: number; h: number; strokes: Stroke[] };

export type DrawCanvasHandle = {
  toDataURL: () => string;
  getStrokes: () => DrawStrokes;
  isBlank: () => boolean;
  clear: () => void;
};

const DrawCanvas = forwardRef<DrawCanvasHandle>(function DrawCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const dirty = useRef(false);
  const strokes = useRef<Stroke[]>([]);
  const cur = useRef<Stroke | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);
  const isCustom = !eraser && !COLORS.includes(color);

  function getCtx() {
    return canvasRef.current!.getContext("2d")!;
  }
  function fillWhite() {
    const c = getCtx();
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, W, H);
  }

  useEffect(() => {
    fillWhite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current!.toDataURL("image/png"),
    getStrokes: () => ({ w: W, h: H, strokes: strokes.current }),
    isBlank: () => !dirty.current,
    clear: () => {
      fillWhite();
      dirty.current = false;
      strokes.current = [];
      cur.current = null;
    },
  }));

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height),
    };
  }
  function paintDot(p: { x: number; y: number }) {
    const c = getCtx();
    c.fillStyle = eraser ? "#ffffff" : color;
    c.beginPath();
    c.arc(p.x, p.y, (eraser ? size * 2.4 : size) / 2, 0, Math.PI * 2);
    c.fill();
    dirty.current = true;
  }
  function paintLine(a: { x: number; y: number }, b: { x: number; y: number }) {
    const c = getCtx();
    c.strokeStyle = eraser ? "#ffffff" : color;
    c.lineWidth = eraser ? size * 2.4 : size;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.stroke();
    dirty.current = true;
  }

  function redrawAll() {
    fillWhite();
    const c = getCtx();
    c.lineCap = "round";
    c.lineJoin = "round";
    for (const s of strokes.current) {
      if (s.p.length === 2) {
        c.fillStyle = s.c;
        c.beginPath();
        c.arc(s.p[0], s.p[1], s.lw / 2, 0, Math.PI * 2);
        c.fill();
        continue;
      }
      c.strokeStyle = s.c;
      c.lineWidth = s.lw;
      c.beginPath();
      c.moveTo(s.p[0], s.p[1]);
      for (let i = 2; i < s.p.length; i += 2) c.lineTo(s.p[i], s.p[i + 1]);
      c.stroke();
    }
  }

  function undo() {
    if (strokes.current.length === 0) return;
    strokes.current.pop();
    redrawAll();
    dirty.current = strokes.current.length > 0;
  }

  function down(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    last.current = p;
    cur.current = {
      c: eraser ? "#ffffff" : color,
      lw: eraser ? size * 2.4 : size,
      p: [Math.round(p.x), Math.round(p.y)],
    };
    strokes.current.push(cur.current);
    paintDot(p);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = pos(e);
    if (last.current) paintLine(last.current, p);
    cur.current?.p.push(Math.round(p.x), Math.round(p.y));
    last.current = p;
  }
  function up() {
    cur.current = null;
    drawing.current = false;
    last.current = null;
  }

  return (
    <div className="no-callout">
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full block rounded-md border-2 border-[var(--ink-soft)] bg-white touch-none select-none cursor-crosshair aspect-square"
        style={{ WebkitUserSelect: "none", userSelect: "none", WebkitTouchCallout: "none" }}
      />

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setColor(c);
              setEraser(false);
            }}
            aria-label={`color ${c}`}
            className={[
              "w-7 h-7 rounded-full border-2 transition",
              color === c && !eraser
                ? "border-[var(--ink)] scale-110 ring-2 ring-cele-200"
                : "border-[var(--rule)]",
            ].join(" ")}
            style={{ background: c }}
          />
        ))}

        {/* selector de tono exacto */}
        <label
          aria-label="elegir tono exacto"
          className={[
            "relative w-7 h-7 rounded-full border-2 overflow-hidden cursor-pointer transition flex items-center justify-center",
            isCustom
              ? "border-[var(--ink)] scale-110 ring-2 ring-cele-200"
              : "border-[var(--rule)]",
          ].join(" ")}
          style={{
            background: isCustom
              ? color
              : "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
          }}
        >
          {!isCustom && <span className="text-white text-xs drop-shadow font-bold">+</span>}
          <input
            type="color"
            value={isCustom ? color : "#1f4f74"}
            onChange={(e) => {
              setColor(e.target.value);
              setEraser(false);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>

        <span className="mx-1 w-px h-6 bg-[var(--rule)]" />

        {SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            aria-label={`grosor ${s}`}
            className={[
              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition",
              size === s ? "border-[var(--ink)] bg-cele-100" : "border-[var(--rule)]",
            ].join(" ")}
          >
            <span
              className="rounded-full bg-[var(--ink)] block"
              style={{ width: s, height: s }}
            />
          </button>
        ))}

        <span className="mx-1 w-px h-6 bg-[var(--rule)]" />

        <button
          onClick={undo}
          aria-label="deshacer"
          className="font-note text-sm px-3 py-1.5 rounded-sm border-2 border-[var(--rule)] text-[var(--ink-soft)] hover:border-[var(--ink-soft)] hover:text-[var(--ink)] transition"
        >
          ↶ deshacer
        </button>
        <button
          onClick={() => setEraser((e) => !e)}
          className={[
            "font-note text-sm px-3 py-1.5 rounded-sm border-2 transition",
            eraser
              ? "bg-[var(--ink)] text-white border-[var(--ink)]"
              : "border-[var(--rule)] text-[var(--ink-soft)]",
          ].join(" ")}
        >
          goma
        </button>
        <button
          onClick={() => {
            fillWhite();
            dirty.current = false;
            strokes.current = [];
            cur.current = null;
          }}
          className="font-note text-sm px-3 py-1.5 rounded-sm border-2 border-[var(--rule)] text-[var(--ink-soft)] hover:border-rose-400 hover:text-rose-500 transition"
        >
          limpiar
        </button>
      </div>
    </div>
  );
});

export default DrawCanvas;
