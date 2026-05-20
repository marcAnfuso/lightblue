"use client";

import { useEffect, useRef, useState } from "react";
import type { DrawStrokes } from "./draw-canvas";

export default function ReplayCanvas({
  strokesUrl,
  imageUrl,
  autoplay = true,
}: {
  strokesUrl?: string;
  imageUrl?: string;
  autoplay?: boolean;
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
    const perFrame = Math.max(2, Math.ceil(segs.length / 150));
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
        if (autoplay) play();
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokesUrl]);

  if (!strokesUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt="dibujo"
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
