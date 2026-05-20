import { NextResponse } from "next/server";
import { getPublicRound, getUsedWords, resetGame, submitDrawing } from "@/lib/game";
import type { Author } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTHORS: Author[] = ["marc", "cele"];

export async function GET() {
  try {
    const [round, used] = await Promise.all([getPublicRound(), getUsedWords()]);
    return NextResponse.json({ round, used });
  } catch (err) {
    return NextResponse.json(
      { round: null, used: [], error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let body: { author?: string; word?: string; dataUrl?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const author = String(body.author ?? "").toLowerCase() as Author;
  const word = String(body.word ?? "").trim();
  const dataUrl = String(body.dataUrl ?? "");

  if (!AUTHORS.includes(author)) {
    return NextResponse.json({ error: "decime quién sos" }, { status: 400 });
  }
  if (word.length < 2) {
    return NextResponse.json({ error: "escribí la palabra a dibujar" }, { status: 400 });
  }
  if (!dataUrl.startsWith("data:image/png")) {
    return NextResponse.json({ error: "falta el dibujo" }, { status: 400 });
  }

  try {
    const res = await submitDrawing({ author, word, dataUrl });
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await resetGame();
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
