/**
 * Rate Limiting — in-memory (لا يحتاج Redis)
 * استخدام: import { rateLimit } from "@/lib/rateLimit";
 *
 * مثال:
 *   const ok = rateLimit(ip, { max: 20, windowMs: 60_000 });
 *   if (!ok) return Response.json({ error: "too_many_requests" }, { status: 429 });
 */

type RateLimitEntry = number[]; // timestamps of requests

const store = new Map<string, RateLimitEntry>();

// تنظيف تلقائي كل 5 دقائق
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((hits, key) => {
      if (hits.length === 0 || now - hits[hits.length - 1] > 60 * 60 * 1000) {
        store.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export function rateLimit(
  key: string,
  opts: { max?: number; windowMs?: number } = {}
): boolean {
  const max = opts.max ?? 20;
  const windowMs = opts.windowMs ?? 60_000;
  const now = Date.now();

  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;

  hits.push(now);
  store.set(key, hits);
  return true;
}

/** استخراج الـ IP من الـ Request headers */
export function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
