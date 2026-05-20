import { NextResponse } from "next/server";
import { getGallery } from "@/lib/game";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await getGallery();
    return NextResponse.json({ items });
  } catch (err) {
    return NextResponse.json({ items: [], error: (err as Error).message }, { status: 500 });
  }
}
