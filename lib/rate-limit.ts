const RATE_LIMIT = 100;
const WINDOW_MS = 60 * 1000;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

/**
 * ユーザーIDに基づくレート制限チェック
 * インメモリMap（1分間に100リクエスト）
 */
export function checkRateLimit(userId: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    store.set(userId, { count: 1, resetAt });
    return {
      allowed: true,
      limit: RATE_LIMIT,
      remaining: RATE_LIMIT - 1,
      resetAt: Math.floor(resetAt / 1000),
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, RATE_LIMIT - entry.count);
  const allowed = entry.count <= RATE_LIMIT;

  return {
    allowed,
    limit: RATE_LIMIT,
    remaining,
    resetAt: Math.floor(entry.resetAt / 1000),
  };
}
