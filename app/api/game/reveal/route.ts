import { NextResponse } from "next/server";
import { revealRound } from "@/lib/game";
import type { Author } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTHORS: Author[] = ["marc", "cele"];

export async function POST(req: Request) {
  let body: { author?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const author = String(body.author ?? "").toLowerCase() as Author;
  if (!AUTHORS.includes(author)) {
    return NextResponse.json({ error: "autor inválido" }, { status: 400 });
  }

  try {
    const res = await revealRound({ author });
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
