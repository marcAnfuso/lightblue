import { list, put } from "@vercel/blob";

export type Author = "marc" | "cele";
export type Post = {
  id: string;
  createdAt: number;
  author: Author;
  text?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
};

const PREFIX = "posts/";

function jsonKey(timestamp: number): string {
  return `${PREFIX}${timestamp}.json`;
}

function imageKey(timestamp: number, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "bin";
  return `${PREFIX}img-${timestamp}.${safeExt}`;
}

export async function listPosts(): Promise<Post[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 500 });
  const jsons = blobs.filter((b) => b.pathname.endsWith(".json"));

  const posts = await Promise.all(
    jsons.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as Omit<Post, "id">;
        return { id: b.pathname, ...data } satisfies Post;
      } catch {
        return null;
      }
    })
  );

  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function createTextPost({
  text,
  author,
}: {
  text: string;
  author: Author;
}): Promise<Post> {
  const createdAt = Date.now();
  const payload = { author, createdAt, text };
  await put(jsonKey(createdAt), JSON.stringify(payload), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return { id: jsonKey(createdAt), ...payload };
}

export async function createImagePost({
  file,
  author,
  text,
}: {
  file: File;
  author: Author;
  text?: string;
}): Promise<Post> {
  const createdAt = Date.now();
  const ext = file.name.split(".").pop() ?? "jpg";
  const imageBlob = await put(imageKey(createdAt, ext), file, {
    access: "public",
    contentType: file.type || "application/octet-stream",
    addRandomSuffix: false,
  });
  const payload: Omit<Post, "id"> = {
    author,
    createdAt,
    imageUrl: imageBlob.url,
    ...(text ? { text } : {}),
  };
  await put(jsonKey(createdAt), JSON.stringify(payload), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return { id: jsonKey(createdAt), ...payload };
}
