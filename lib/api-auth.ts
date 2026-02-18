import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import type { AuthUser } from '@/lib/auth';

/**
 * リクエストヘッダーからAPIキーを抽出する
 *
 * 対応形式:
 * - Authorization: Bearer mk_xxx
 * - X-API-Key: mk_xxx
 */
function extractApiKey(request: NextRequest): string | null {
  const authorization = request.headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7);
  }

  return request.headers.get('X-API-Key');
}

/**
 * APIキーをSHA-256でハッシュ化する
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * APIキーでリクエストを認証し、ユーザー情報を返す
 *
 * - SHA-256ハッシュでキー照合
 * - 有効期限チェック
 * - レート制限チェック
 * - lastUsedAt更新（fire-and-forget）
 *
 * @returns 認証済みユーザー情報、または401/429エラーレスポンス
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthUser | NextResponse> {
  const rawKey = extractApiKey(request);

  if (!rawKey) {
    return apiError('APIキーが必要です', 'UNAUTHORIZED', 401);
  }

  const hashedKey = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { key: hashedKey },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!apiKey) {
    return apiError('無効なAPIキーです', 'UNAUTHORIZED', 401);
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return apiError('APIキーの有効期限が切れています', 'UNAUTHORIZED', 401);
  }

  const user: AuthUser = {
    id: apiKey.user.id,
    email: apiKey.user.email,
    name: apiKey.user.name,
    role: apiKey.user.role,
  };

  const rateLimit = checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    const response = apiError(
      'レート制限を超えました',
      'RATE_LIMIT_EXCEEDED',
      429
    );
    response.headers.set('X-RateLimit-Limit', String(rateLimit.limit));
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', String(rateLimit.resetAt));
    return response;
  }

  // lastUsedAt更新（レスポンスをブロックしない）
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return user;
}
