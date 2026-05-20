"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Author, ReactionName, Reactions } from "@/lib/posts";

const EMOJI: Record<ReactionName, string> = {
  heart: "❤️",
  joy: "😂",
  melt: "🥹",
  wow: "😍",
};
const ORDER: ReactionName[] = ["heart", "joy", "melt", "wow"];

export default function ReactionsBar({
  ts,
  initial,
}: {
  ts: string;
  initial?: Reactions;
}) {
  const [reactions, setReactions] = useState<Reactions>(initial ?? {});
  const [author, setAuthor] = useState<Author>("marc");

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("lb_author") : null;
    if (s === "marc" || s === "cele") setAuthor(s);
  }, []);

  function toggle(name: ReactionName) {
    const arr = reactions[name] ?? [];
    const mine = arr.includes(author);
    const next = mine ? arr.filter((a) => a !== author) : [...arr, author];
    setReactions((prev) => ({ ...prev, [name]: next }));
    fetch("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ts, author, name, on: !mine }),
    }).catch(() => {});
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {ORDER.map((name) => {
        const arr = reactions[name] ?? [];
        const count = arr.length;
        const mine = arr.includes(author);
        return (
          <motion.button
            key={name}
            whileTap={{ scale: 0.75 }}
            onClick={() => toggle(name)}
            aria-label={name}
            className={[
              "flex items-center gap-1 px-2 py-0.5 rounded-full border transition text-base leading-none",
              mine
                ? "bg-cele-100 border-[var(--ink-soft)]"
                : "bg-transparent border-transparent hover:border-[var(--rule)]",
              count === 0 ? "opacity-40 hover:opacity-100" : "opacity-100",
            ].join(" ")}
          >
            <span>{EMOJI[name]}</span>
            {count > 0 && (
              <span className="font-note text-xs text-[var(--ink-soft)]">{count}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
