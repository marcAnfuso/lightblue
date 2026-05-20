"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

const W = 680;
const H = 520;
const COLORS = ["#1f4f74", "#e0507a", "#e8a13b", "#3aa564", "#1a2230"];
const SIZES = [4, 9, 18];

export type DrawCanvasHandle = {
  toDataURL: () => string;
  isBlank: () => boolean;
  clear: () => void;
};

const DrawCanvas = forwardRef<DrawCanvasHandle>(function DrawCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const dirty = useRef(false);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(SIZES[1]);
  const [eraser, setEraser] = useState(false);

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
    isBlank: () => !dirty.current,
    clear: () => {
      fillWhite();
      dirty.current = false;
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

  function down(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    last.current = p;
    paintDot(p);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = pos(e);
    if (last.current) paintLine(last.current, p);
    last.current = p;
  }
  function up() {
    drawing.current = false;
    last.current = null;
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        className="w-full block rounded-md border-2 border-[var(--ink-soft)] bg-white touch-none cursor-crosshair"
        style={{ aspectRatio: `${W} / ${H}` }}
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
              color === c && !eraser ? "border-[var(--ink)] scale-110" : "border-white",
            ].join(" ")}
            style={{ background: c }}
          />
        ))}

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
