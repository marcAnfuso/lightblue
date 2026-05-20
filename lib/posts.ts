import { del, list, put } from "@vercel/blob";

export type Author = "marc" | "cele";
export type ReactionName = "heart" | "joy" | "melt" | "wow";
export const REACTION_NAMES: ReactionName[] = ["heart", "joy", "melt", "wow"];
export type Reactions = Partial<Record<ReactionName, Author[]>>;

export type Post = {
  id: string;
  createdAt: number;
  author: Author;
  text?: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  reactions?: Reactions;
};

const PREFIX = "posts/";
const REACT_PREFIX = "reactions/";

function jsonKey(timestamp: number): string {
  return `${PREFIX}${timestamp}.json`;
}

function imageKey(timestamp: number, ext: string): string {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 5) || "bin";
  return `${PREFIX}img-${timestamp}.${safeExt}`;
}

export async function listPosts(): Promise<Post[]> {
  const [postBlobs, reactions] = await Promise.all([
    list({ prefix: PREFIX, limit: 500 }),
    listReactions(),
  ]);
  const jsons = postBlobs.blobs.filter((b) => b.pathname.endsWith(".json"));

  const posts = await Promise.all(
    jsons.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as Omit<Post, "id">;
        const reaction = reactions[String(data.createdAt)];
        return {
          id: b.pathname,
          ...data,
          ...(reaction ? { reactions: reaction } : {}),
        } satisfies Post;
      } catch {
        return null;
      }
    })
  );

  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── Reacciones (corazoncitos) ─────────────────────────────────────────
// Modelo append-only: cada (post, autor, reacción) es su propio blob.
// Así no hay overwrite ni condiciones de carrera.

function reactionKey(ts: string, author: Author, name: ReactionName): string {
  return `${REACT_PREFIX}${ts}__${author}__${name}`;
}

export async function listReactions(): Promise<Record<string, Reactions>> {
  const { blobs } = await list({ prefix: REACT_PREFIX, limit: 1000 });
  const map: Record<string, Reactions> = {};
  for (const b of blobs) {
    const rest = b.pathname.slice(REACT_PREFIX.length);
    const [ts, author, name] = rest.split("__");
    if (!ts || !author || !name) continue;
    if (!REACTION_NAMES.includes(name as ReactionName)) continue;
    const bucket = (map[ts] ??= {});
    const arr = (bucket[name as ReactionName] ??= []);
    if (!arr.includes(author as Author)) arr.push(author as Author);
  }
  return map;
}

export async function setReaction({
  ts,
  author,
  name,
  on,
}: {
  ts: string;
  author: Author;
  name: ReactionName;
  on: boolean;
}): Promise<void> {
  const key = reactionKey(ts, author, name);
  if (on) {
    await put(key, "1", {
      access: "public",
      addRandomSuffix: false,
      contentType: "text/plain",
    });
  } else {
    const { blobs } = await list({ prefix: key, limit: 5 });
    await Promise.all(blobs.map((b) => del(b.url)));
  }
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
