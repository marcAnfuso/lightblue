import { NextResponse } from "next/server";
import { createPlan, deletePlan, listPlans } from "@/lib/plans";
import type { Author } from "@/lib/posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTHORS: Author[] = ["marc", "cele"];
const MAX_LEN = 140;

export async function GET() {
  try {
    const plans = await listPlans();
    return NextResponse.json({ plans });
  } catch (err) {
    return NextResponse.json({ plans: [], error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: { text?: string; author?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body inválido" }, { status: 400 });
  }

  const author = String(body.author ?? "").toLowerCase() as Author;
  const text = String(body.text ?? "").trim();

  if (!AUTHORS.includes(author)) {
    return NextResponse.json({ error: "decime de parte de quién" }, { status: 400 });
  }
  if (!text) return NextResponse.json({ error: "escribí una idea" }, { status: 400 });
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: `máximo ${MAX_LEN} caracteres` }, { status: 400 });
  }

  try {
    const plan = await createPlan({ text, author });
    return NextResponse.json({ plan });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") ?? "";
  if (!id) return NextResponse.json({ error: "falta id" }, { status: 400 });
  try {
    await deletePlan(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
