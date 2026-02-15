import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuthUser } from '@/lib/auth';

/**
 * APIエラーレスポンスを生成する
 */
export function apiError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

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
 * APIキーでリクエストを認証し、ユーザー情報を返す
 *
 * @returns 認証済みユーザー情報、または401エラーレスポンス
 */
export async function authenticateApiKey(
  request: NextRequest
): Promise<AuthUser | NextResponse> {
  const key = extractApiKey(request);

  if (!key) {
    return apiError('APIキーが必要です', 401);
  }

  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    select: {
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
    return apiError('無効なAPIキーです', 401);
  }

  return {
    id: apiKey.user.id,
    email: apiKey.user.email,
    name: apiKey.user.name,
    role: apiKey.user.role,
  };
}
