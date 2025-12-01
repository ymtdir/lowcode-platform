import type { UserRole } from '@prisma/client';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

/**
 * 認証済みユーザー情報
 */
export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

/**
 * 認証エラー
 */
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * 権限エラー
 */
export class PermissionError extends Error {
  constructor(message: string = 'この操作を行う権限がありません') {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * 現在のログインユーザーを取得
 * @returns ユーザー情報、未認証の場合はnull
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { id: true, name: true, role: true },
    });

    if (!dbUser) {
      return null;
    }

    return {
      id: dbUser.id,
      email: user.email,
      name: dbUser.name,
      role: dbUser.role,
    };
  } catch {
    return null;
  }
}

/**
 * 認証を必須とし、ユーザー情報を取得
 * @throws AuthError 認証されていない場合
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('認証が必要です');
  }
  return user;
}

/**
 * 認証と権限チェックを行い、ユーザー情報を取得
 * @param permissionCheck - 権限チェック関数
 * @throws AuthError 認証されていない場合
 * @throws PermissionError 権限がない場合
 */
export async function requireRole(
  permissionCheck: (role: UserRole) => boolean
): Promise<AuthUser> {
  const user = await requireAuth();
  if (!permissionCheck(user.role)) {
    throw new PermissionError();
  }
  return user;
}
