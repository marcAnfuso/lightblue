import { del, list, put } from "@vercel/blob";
import type { Author } from "@/lib/posts";

export type Plan = {
  id: string; // pathname del blob
  url: string;
  createdAt: number;
  author: Author;
  text: string;
};

const PREFIX = "plans/";

export async function listPlans(): Promise<Plan[]> {
  const { blobs } = await list({ prefix: PREFIX, limit: 500 });
  const jsons = blobs.filter((b) => b.pathname.endsWith(".json"));

  const plans = await Promise.all(
    jsons.map(async (b) => {
      try {
        const res = await fetch(b.url, { cache: "no-store" });
        if (!res.ok) return null;
        const data = (await res.json()) as Omit<Plan, "id" | "url">;
        return { id: b.pathname, url: b.url, ...data } satisfies Plan;
      } catch {
        return null;
      }
    })
  );

  return plans
    .filter((p): p is Plan => p !== null)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function createPlan({
  text,
  author,
}: {
  text: string;
  author: Author;
}): Promise<Plan> {
  const createdAt = Date.now();
  const id = `${PREFIX}${createdAt}.json`;
  const payload = { author, createdAt, text };
  const blob = await put(id, JSON.stringify(payload), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return { id, url: blob.url, ...payload };
}

export async function deletePlan(id: string): Promise<void> {
  const safeId = id.startsWith(PREFIX) ? id : `${PREFIX}${id}`;
  const { blobs } = await list({ prefix: safeId, limit: 1 });
  await Promise.all(blobs.map((b) => del(b.url)));
}
