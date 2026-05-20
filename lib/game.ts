import { del, list, put } from "@vercel/blob";
import type { Author } from "./posts";
import { WORD_BANK } from "./words";

const KEY = "game/pinturillo.json";
const USED_KEY = "game/used.json";
const SCORE_KEY = "game/score.json";
const IMG_PREFIX = "game/draw-";

export type Scores = { marc: number; cele: number };

export type RoundStatus = "awaiting_guess" | "done";

export type Puzzle = { segments: number[]; letters: string[] };

type Round = {
  drawer: Author;
  word: string; // secreto
  imageUrl: string;
  createdAt: number;
  status: RoundStatus;
  puzzle?: Puzzle;
  result?: { guessed: boolean; guesser: Author; at: number };
};

export type PublicRound = {
  status: "empty" | RoundStatus;
  drawer?: Author;
  guesser?: Author;
  imageUrl?: string;
  createdAt?: number;
  puzzle?: Puzzle; // letras mezcladas + estructura (sin revelar el orden)
  result?: Round["result"];
  word?: string; // sólo cuando status === "done"
  scores: Scores;
  nextDrawer?: Author; // tras terminar, dibuja quien adivinó
};

function other(a: Author): Author {
  return a === "marc" ? "cele" : "marc";
}

// sólo letras a-z (acentos y ñ→n, ü→u), sin espacios — para comparar la palabra
function lettersOnly(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

function stripUpper(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FILLER = "AEIOUNRSTLCDMPBGFHV";

function buildPuzzle(word: string): Puzzle {
  const parts = stripUpper(word).split(/\s+/).filter(Boolean);
  const segments = parts.map((p) => p.length);
  const wordLetters = parts.join("").split("");
  const fillerCount = Math.min(6, Math.max(2, 12 - wordLetters.length));
  const fillers = Array.from(
    { length: fillerCount },
    () => FILLER[Math.floor(Math.random() * FILLER.length)]
  );
  return { segments, letters: shuffle([...wordLetters, ...fillers]) };
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

export async function getScores(): Promise<Scores> {
  const { blobs } = await list({ prefix: SCORE_KEY, limit: 1 });
  const b = blobs.find((x) => x.pathname === SCORE_KEY);
  if (!b) return { marc: 0, cele: 0 };
  try {
    const res = await fetch(b.url, { cache: "no-store" });
    if (!res.ok) return { marc: 0, cele: 0 };
    const d = (await res.json()) as Partial<Scores>;
    return { marc: Number(d.marc ?? 0), cele: Number(d.cele ?? 0) };
  } catch {
    return { marc: 0, cele: 0 };
  }
}

async function writeScores(s: Scores): Promise<void> {
  await put(SCORE_KEY, JSON.stringify(s), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function getUsedWords(): Promise<string[]> {
  const { blobs } = await list({ prefix: USED_KEY, limit: 1 });
  const b = blobs.find((x) => x.pathname === USED_KEY);
  if (!b) return [];
  try {
    const res = await fetch(b.url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as string[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function markUsed(word: string): Promise<void> {
  const used = await getUsedWords();
  const lower = word.toLowerCase().trim();
  const already = used.some((w) => w.toLowerCase().trim() === lower);
  let next = already ? used : [...used, word];
  // reciclar cuando quedan pocas sin usar
  if (next.length >= WORD_BANK.length - 3) next = [word];
  await put(USED_KEY, JSON.stringify(next), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function getPublicRound(): Promise<PublicRound> {
  const [r, scores] = await Promise.all([readRound(), getScores()]);
  if (!r) return { status: "empty", scores };
  const guesser = other(r.drawer);
  const pub: PublicRound = {
    status: r.status,
    drawer: r.drawer,
    guesser,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
    result: r.result,
    scores,
  };
  if (r.status === "awaiting_guess" && r.puzzle) pub.puzzle = r.puzzle;
  if (r.status === "done") {
    pub.word = r.word;
    pub.nextDrawer = r.result?.guesser; // dibuja quien adivinó/perdió
  }
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
  // no se puede dibujar mientras el otro está adivinando
  if (current && current.status === "awaiting_guess") {
    return { ok: false, error: "ya hay un juego en curso, esperá a que adivinen" };
  }
  // tras una ronda, dibuja quien adivinó/perdió (turno alternado)
  if (current && current.status === "done" && current.result) {
    if (author !== current.result.guesser) {
      return { ok: false, error: "no es tu turno de dibujar" };
    }
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

  const finalWord = word.trim().slice(0, 60);
  await writeRound({
    drawer: author,
    word: finalWord,
    imageUrl: blob.url,
    createdAt: Date.now(),
    status: "awaiting_guess",
    puzzle: buildPuzzle(finalWord),
  });

  await markUsed(finalWord);

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

  if (lettersOnly(guess) === lettersOnly(r.word)) {
    r.status = "done";
    r.result = { guessed: true, guesser: author, at: Date.now() };
    await writeRound(r);
    const scores = await getScores();
    scores[author] += 1; // +1 al que adivinó
    await writeScores(scores);
    return { correct: true, word: r.word };
  }
  return { correct: false };
}

export async function resetGame(): Promise<void> {
  const { blobs } = await list({ prefix: KEY, limit: 1 });
  const b = blobs.find((x) => x.pathname === KEY);
  if (b) await del(b.url).catch(() => {});
  await writeScores({ marc: 0, cele: 0 });
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
