import { NextResponse } from "next/server";
import { REACTION_NAMES, setReaction, type Author, type ReactionName } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTHORS: Author[] = ["marc", "cele"];

export async function POST(req: Request) {
  let body: { ts?: string; author?: string; name?: string; on?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const ts = String(body.ts ?? "").replace(/[^0-9]/g, "");
  const author = String(body.author ?? "").toLowerCase() as Author;
  const name = String(body.name ?? "").toLowerCase() as ReactionName;
  const on = body.on !== false;

  if (!ts) return NextResponse.json({ error: "falta ts" }, { status: 400 });
  if (!AUTHORS.includes(author)) {
    return NextResponse.json({ error: "autor inválido" }, { status: 400 });
  }
  if (!REACTION_NAMES.includes(name)) {
    return NextResponse.json({ error: "reacción inválida" }, { status: 400 });
  }

  try {
    await setReaction({ ts, author, name, on });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
