import { NextResponse, after } from "next/server";
import { createImagePost, createTextPost, listPosts, type Author } from "@/lib/posts";
import { notifyNewPost } from "@/lib/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TEXT_LEN = 1200;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB (límite de body en Vercel functions)
const ALLOWED_AUTHORS: Author[] = ["marc", "cele"];

export async function GET() {
  try {
    const posts = await listPosts();
    return NextResponse.json({ posts });
  } catch (err) {
    return NextResponse.json(
      { posts: [], error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "form inválido" }, { status: 400 });
  }

  const author = String(form.get("author") ?? "").toLowerCase() as Author;
  if (!ALLOWED_AUTHORS.includes(author)) {
    return NextResponse.json({ error: "decime de parte de quién" }, { status: 400 });
  }

  const text = String(form.get("text") ?? "").trim();
  const file = form.get("file") as File | null;

  if (file && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "solo imágenes por ahora" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "imagen muy grande (máx 4MB)" },
        { status: 413 }
      );
    }
    if (text.length > MAX_TEXT_LEN) {
      return NextResponse.json(
        { error: `el texto se pasa de ${MAX_TEXT_LEN} caracteres` },
        { status: 400 }
      );
    }
    try {
      const post = await createImagePost({ file, author, text: text || undefined });
      after(() => notifyNewPost({ author, hasImage: true, text }).catch(() => {}));
      return NextResponse.json({ post });
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  }

  if (text.length === 0) {
    return NextResponse.json({ error: "dejame algo, eh" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LEN) {
    return NextResponse.json(
      { error: `máximo ${MAX_TEXT_LEN} caracteres` },
      { status: 400 }
    );
  }

  try {
    const post = await createTextPost({ text, author });
    after(() => notifyNewPost({ author, hasImage: false, text }).catch(() => {}));
    return NextResponse.json({ post });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
