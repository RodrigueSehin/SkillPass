import { AppError } from "@/lib/errors";

export class RateLimitError extends AppError {
  constructor() {
    super("Trop de requêtes. Réessayez dans un instant.", 429, "RATE_LIMITED");
  }
}

const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter, per server instance. Good enough to blunt abuse of a single node;
 * swap for a shared store (Redis/Upstash) before running several instances.
 */
export function rateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    throw new RateLimitError();
  }
  recent.push(now);
  hits.set(key, recent);
}

export function resetRateLimits() {
  hits.clear();
}
