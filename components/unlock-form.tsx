"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UnlockForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("ups, no es esa. fijate la pista 👇");
        setLoading(false);
        return;
      }
      router.replace(nextPath || "/");
      router.refresh();
    } catch {
      setError("algo se rompió, probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-md sheet px-8 sm:px-10 py-12"
    >
      <span className="tape left-10 -top-3 rotate-[-5deg]" />
      <span className="tape right-10 -top-3 rotate-[4deg]" />

      <div className="text-center mb-8 font-hand text-[var(--ink)]">
        <p className="text-2xl text-[var(--ink-soft)]">ey, pará…</p>
        <h1 className="text-4xl sm:text-5xl mt-1 leading-tight">
          esto es solo para <span className="ink-underline inline-block">Cele</span>
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="password"
          autoFocus
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="la clave…"
          className="w-full px-4 py-3 bg-transparent border-b-2 border-[var(--rule)] outline-none focus:border-[var(--ink)] transition font-hand text-2xl text-[var(--ink)] text-center placeholder:text-[#a9cbe2]"
        />

        <motion.button
          type="submit"
          disabled={loading || !password}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 font-note bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)] transition disabled:opacity-40 rounded-sm shadow-md"
        >
          {loading ? "abriendo…" : "entrar"}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center font-hand text-xl text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </form>

      <p className="mt-8 text-center font-hand text-xl text-[var(--ink-soft)] leading-snug">
        pista: es lo que compramos esa vez en el Jumbo.
        <br />
        <span className="text-[var(--ink)]">todo en minúscula.</span>
      </p>
    </motion.div>
  );
}
