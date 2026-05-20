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
    if (!text.trim() && !file) {
      setError("escribime algo o sumá una foto");
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.set("author", author);
    if (text.trim()) form.set("text", text);
    if (file) form.set("file", file);

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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#1f4f74]/40 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, rotate: -2, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, rotate: -1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md sheet px-7 py-9 my-auto"
          >
            <span
              className="tape left-1/2 -top-3"
              style={{ transform: "translateX(-50%) rotate(-3deg)" }}
            />

            <div className="flex items-center justify-between mb-1">
              <h2 className="font-hand text-3xl text-[var(--ink)]">dejá un recuerdito</h2>
              <button
                onClick={onClose}
                className="font-note text-[var(--ink-soft)] hover:text-[var(--ink)] transition"
                aria-label="cerrar"
              >
                ✕
              </button>
            </div>
            <p className="font-hand text-xl text-[var(--ink-soft)] mb-4">
              escribí algo, sumá una foto, o las dos cosas.
            </p>

            <div className="flex gap-2 mb-4">
              <AuthorChip current={author} value="marc" onClick={handleAuthor} />
              <AuthorChip current={author} value="cele" onClick={handleAuthor} />
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1200}
              placeholder="lo que se te cante…"
              className="w-full px-3 py-2 bg-transparent border-2 border-[var(--rule)] focus:border-[var(--ink)] outline-none transition resize-none font-hand text-2xl text-[var(--ink)] rounded-sm"
            />

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            {preview ? (
              <div className="relative bg-white p-2 shadow-md mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="preview" className="w-full block" />
                <button
                  onClick={() => setFile(null)}
                  className="absolute top-3 right-3 font-note px-2 py-1 bg-white/90 text-xs text-[var(--ink)] border border-[var(--rule)] rounded-sm"
                >
                  sacar foto
                </button>
              </div>
            ) : (
              <button
                onClick={() => inputRef.current?.click()}
                className="mt-3 w-full py-4 border-2 border-dashed border-[var(--rule)] hover:border-[var(--ink)] transition font-hand text-2xl text-[var(--ink-soft)] rounded-sm"
              >
                + sumar una foto
                <span className="block font-note text-xs mt-1">opcional · hasta 4MB</span>
              </button>
            )}

            {error && <p className="mt-3 font-hand text-xl text-rose-500">{error}</p>}

            <motion.button
              onClick={submit}
              disabled={submitting}
              whileTap={{ scale: 0.97 }}
              className="mt-5 w-full py-3 font-note bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)] transition disabled:opacity-40 rounded-sm shadow-md"
            >
              {submitting ? "guardando…" : "dejarlo acá"}
            </motion.button>
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
