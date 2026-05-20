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
        setError("ups, no es esa.");
        setLoading(false);
        return;
      }
      router.replace(nextPath || "/");
      router.refresh();
    } catch {
      setError("algo falló, probá de nuevo.");
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-10">
        <p className="text-cele-700 text-xs uppercase tracking-[0.25em] mb-3">
          una puerta chiquita
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink leading-tight">
          esta paginita
          <br />
          es solo para <span className="italic text-cele-600">Cele</span>.
        </h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="pw"
            className="block text-sm text-cele-800 mb-2 font-medium"
          >
            contraseña
          </label>
          <input
            id="pw"
            type="password"
            autoFocus
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-cele-200 bg-white/70 backdrop-blur-sm outline-none focus:border-cele-400 focus:ring-4 focus:ring-cele-100 transition shadow-sm"
            placeholder="…"
          />
        </div>

        <motion.button
          type="submit"
          disabled={loading || !password}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-2xl bg-cele-500 text-white font-medium tracking-wide hover:bg-cele-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_rgba(77,159,216,0.55)]"
        >
          {loading ? "abriendo…" : "entrar"}
        </motion.button>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-sm text-rose-500"
          >
            {error}
          </motion.p>
        )}
      </form>

      <div className="mt-10 text-center">
        <p className="text-sm text-cele-700/80 leading-relaxed">
          <span className="italic">pista:</span> es lo que compramos esa vez en el Jumbo.
          <br />
          <span className="text-cele-600/70">todo en minúsculas.</span>
        </p>
      </div>
    </motion.div>
  );
}
