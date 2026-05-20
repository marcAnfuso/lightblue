import { del, list, put } from "@vercel/blob";
import type { Author } from "./posts";

const KEY = "game/pinturillo.json";
const IMG_PREFIX = "game/draw-";

export type RoundStatus = "awaiting_guess" | "done";

type Round = {
  drawer: Author;
  word: string; // secreto
  imageUrl: string;
  createdAt: number;
  status: RoundStatus;
  result?: { guessed: boolean; guesser: Author; at: number };
};

export type PublicRound = {
  status: "empty" | RoundStatus;
  drawer?: Author;
  guesser?: Author;
  imageUrl?: string;
  createdAt?: number;
  result?: Round["result"];
  word?: string; // sólo cuando status === "done"
};

function other(a: Author): Author {
  return a === "marc" ? "cele" : "marc";
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function readRound(): Promise<Round | null> {
  const { blobs } = await list({ prefix: KEY, limit: 1 });
  const b = blobs.find((x) => x.pathname === KEY);
  if (!b) return null;
  try {
    const res = await fetch(b.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Round;
  } catch {
    return null;
  }
}

async function writeRound(r: Round): Promise<void> {
  await put(KEY, JSON.stringify(r), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function getPublicRound(): Promise<PublicRound> {
  const r = await readRound();
  if (!r) return { status: "empty" };
  const guesser = other(r.drawer);
  const pub: PublicRound = {
    status: r.status,
    drawer: r.drawer,
    guesser,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
    result: r.result,
  };
  if (r.status === "done") pub.word = r.word;
  return pub;
}

export async function submitDrawing({
  author,
  word,
  dataUrl,
}: {
  author: Author;
  word: string;
  dataUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const current = await readRound();
  // sólo se puede empezar un juego nuevo si no hay uno esperando que adivinen
  if (current && current.status === "awaiting_guess") {
    return { ok: false, error: "ya hay un juego en curso, esperá a que adivinen" };
  }

  const match = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl.trim());
  if (!match) return { ok: false, error: "dibujo inválido" };
  const buf = Buffer.from(match[1], "base64");
  if (buf.byteLength > 3 * 1024 * 1024) return { ok: false, error: "dibujo muy pesado" };

  const blob = await put(`${IMG_PREFIX}${Date.now()}.png`, buf, {
    access: "public",
    contentType: "image/png",
    addRandomSuffix: false,
  });

  await writeRound({
    drawer: author,
    word: word.trim().slice(0, 60),
    imageUrl: blob.url,
    createdAt: Date.now(),
    status: "awaiting_guess",
  });

  // limpieza best-effort del dibujo anterior
  if (current?.imageUrl) {
    del(current.imageUrl).catch(() => {});
  }

  return { ok: true };
}

export async function tryGuess({
  author,
  guess,
}: {
  author: Author;
  guess: string;
}): Promise<{ correct: boolean; word?: string }> {
  const r = await readRound();
  if (!r || r.status !== "awaiting_guess") return { correct: false };
  if (author !== other(r.drawer)) return { correct: false };

  if (normalize(guess) === normalize(r.word)) {
    r.status = "done";
    r.result = { guessed: true, guesser: author, at: Date.now() };
    await writeRound(r);
    return { correct: true, word: r.word };
  }
  return { correct: false };
}

export async function revealRound({
  author,
}: {
  author: Author;
}): Promise<{ word?: string }> {
  const r = await readRound();
  if (!r || r.status !== "awaiting_guess") return {};
  if (author !== other(r.drawer)) return {};
  r.status = "done";
  r.result = { guessed: false, guesser: author, at: Date.now() };
  await writeRound(r);
  return { word: r.word };
}
