import { NextResponse } from "next/server";
import { tryGuess } from "@/lib/game";
import type { Author } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTHORS: Author[] = ["marc", "cele"];

export async function POST(req: Request) {
  let body: { author?: string; guess?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const author = String(body.author ?? "").toLowerCase() as Author;
  const guess = String(body.guess ?? "").trim();

  if (!AUTHORS.includes(author)) {
    return NextResponse.json({ error: "autor inválido" }, { status: 400 });
  }
  if (!guess) return NextResponse.json({ correct: false });

  try {
    const res = await tryGuess({ author, guess });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ correct: false, error: (err as Error).message }, { status: 500 });
  }
}
