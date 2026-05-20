"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Author, Post } from "@/lib/posts";

const AUTHOR_KEY = "lb_author";

export default function UploadDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: Post) => void;
}) {
  const [author, setAuthor] = useState<Author>("marc");
  const [tab, setTab] = useState<"text" | "image">("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(AUTHOR_KEY) : null;
    if (stored === "marc" || stored === "cele") setAuthor(stored);
  }, []);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function reset() {
    setText("");
    setFile(null);
    setError(null);
    setSubmitting(false);
  }

  function handleAuthor(a: Author) {
    setAuthor(a);
    try {
      localStorage.setItem(AUTHOR_KEY, a);
    } catch {}
  }

  async function submit() {
    setError(null);
    if (tab === "text" && !text.trim()) {
      setError("escribime algo");
      return;
    }
    if (tab === "image" && !file) {
      setError("elegí una imagen");
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.set("author", author);
    if (tab === "text") form.set("text", text);
    if (tab === "image" && file) form.set("file", file);

    try {
      const res = await fetch("/api/posts", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "no se pudo subir");
        setSubmitting(false);
        return;
      }
      onCreated(data.post as Post);
      reset();
      onClose();
    } catch {
      setError("se cayó la red");
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-cele-900/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white border border-cele-200 shadow-2xl overflow-hidden"
          >
            <div className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl text-ink">
                  dejá algo lindo
                </h2>
                <button
                  onClick={onClose}
                  className="text-cele-700 hover:text-cele-900 transition text-sm"
                  aria-label="cerrar"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-cele-700/80 mt-1">
                queda guardado acá para que lo encuentre quien venga después.
              </p>
            </div>

            <div className="px-6 mt-4 flex gap-2">
              <AuthorChip current={author} value="marc" onClick={handleAuthor} />
              <AuthorChip current={author} value="cele" onClick={handleAuthor} />
            </div>

            <div className="px-6 mt-5 flex gap-1 border-b border-cele-100">
              <TabBtn current={tab} value="text" onClick={setTab} label="mensajito" />
              <TabBtn current={tab} value="image" onClick={setTab} label="foto" />
            </div>

            <div className="p-6">
              {tab === "text" ? (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
                  maxLength={1200}
                  placeholder="lo que se te ocurra…"
                  className="w-full px-4 py-3 rounded-2xl border border-cele-200 bg-cele-50/30 outline-none focus:border-cele-400 focus:ring-4 focus:ring-cele-100 transition resize-none font-serif text-[16px] text-ink"
                />
              ) : (
                <div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                  {preview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt="preview"
                        className="w-full rounded-2xl border border-cele-200"
                      />
                      <button
                        onClick={() => setFile(null)}
                        className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur text-xs text-cele-800 border border-cele-200"
                      >
                        cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => inputRef.current?.click()}
                      className="w-full py-10 rounded-2xl border-2 border-dashed border-cele-200 text-cele-700 hover:border-cele-400 hover:bg-cele-50/40 transition"
                    >
                      elegí una foto
                      <div className="text-xs text-cele-600/70 mt-1">
                        hasta 4MB
                      </div>
                    </button>
                  )}
                </div>
              )}

              {error && (
                <p className="mt-3 text-sm text-rose-500">{error}</p>
              )}

              <motion.button
                onClick={submit}
                disabled={submitting}
                whileTap={{ scale: 0.97 }}
                className="mt-5 w-full py-3 rounded-2xl bg-cele-500 text-white font-medium hover:bg-cele-600 transition disabled:opacity-50 shadow-[0_8px_24px_-8px_rgba(77,159,216,0.55)]"
              >
                {submitting ? "subiendo…" : "dejarlo acá"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
        "px-3 py-1.5 rounded-full text-xs uppercase tracking-[0.18em] border transition",
        active
          ? "bg-cele-500 text-white border-cele-500"
          : "bg-white text-cele-700 border-cele-200 hover:bg-cele-50",
      ].join(" ")}
    >
      de {value === "cele" ? "Cele" : "Marc"}
    </button>
  );
}

function TabBtn({
  current,
  value,
  onClick,
  label,
}: {
  current: "text" | "image";
  value: "text" | "image";
  onClick: (v: "text" | "image") => void;
  label: string;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value)}
      className={[
        "px-4 py-2 text-sm border-b-2 -mb-px transition",
        active
          ? "border-cele-500 text-cele-800"
          : "border-transparent text-cele-600 hover:text-cele-800",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
