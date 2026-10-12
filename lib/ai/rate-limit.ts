const WINDOW_MS = 60 * 60 * 1000;
const hits = new Map<string, number[]>();

/** In-memory per-user limit. Resets on restart, which is fine for one instance. */
export function rateLimit(key: string, max = 20) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return { ok: false as const, retryInMin: Math.ceil((WINDOW_MS - (now - recent[0]!)) / 60000) };
  }
  recent.push(now);
  hits.set(key, recent);
  return { ok: true as const, remaining: max - recent.length };
}
