import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canManageUsers } from '@/lib/permissions';

/**
 * GET /api/v1/users/[userId]
 * ユーザー詳細を取得する
 * 権限: 自身またはAdmin
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { userId } = await params;

  // 権限チェック: 自身またはAdmin
  if (user.id !== userId && !canManageUsers(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!targetUser) {
      return apiError('ユーザーが見つかりません', 'NOT_FOUND', 404);
    }

    return apiSuccess(targetUser);
  } catch {
    return apiError('ユーザーの取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PATCH /api/v1/users/[userId]
 * ユーザー情報を部分更新する
 * 権限: 自身またはAdmin
 * ※ パスワードはこのエンドポイントで変更不可（セキュリティ考慮）
 * ※ ロール変更はAdminのみ
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { userId } = await params;

  // 権限チェック: 自身またはAdmin
  if (user.id !== userId && !canManageUsers(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('リクエストボディが不正です', 'BAD_REQUEST', 400);
  }

  const { name, email, role } = body as {
    name?: unknown;
    email?: unknown;
    role?: unknown;
  };

  // バリデーション
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return apiError('nameは空にできません', 'VALIDATION_ERROR', 422);
    }
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || !email.includes('@')) {
      return apiError('有効なemailを入力してください', 'VALIDATION_ERROR', 422);
    }
  }
  if (role !== undefined) {
    if (!['ADMIN', 'DEVELOPER', 'MEMBER'].includes(role as string)) {
      return apiError(
        'roleはADMIN、DEVELOPER、MEMBERのいずれかを指定してください',
        'VALIDATION_ERROR',
        422
      );
    }
    // ロール変更はAdminのみ
    if (!canManageUsers(user.role)) {
      return apiError('ロールの変更にはAdmin権限が必要です', 'FORBIDDEN', 403);
    }
    // 自分自身のロールは変更不可
    if (user.id === userId) {
      return apiError('自分自身のロールは変更できません', 'BAD_REQUEST', 400);
    }
  }

  // 更新フィールドが何もない場合
  if (name === undefined && email === undefined && role === undefined) {
    return apiError('更新するフィールドがありません', 'BAD_REQUEST', 400);
  }

  try {
    // ユーザーの存在チェック
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return apiError('ユーザーが見つかりません', 'NOT_FOUND', 404);
    }

    // メールアドレスの重複チェック
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } },
      });
      if (existingUser) {
        return apiError(
          'このメールアドレスは既に使用されています',
          'BAD_REQUEST',
          400
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: (name as string).trim() }),
        ...(email !== undefined && { email: email as string }),
        ...(role !== undefined && {
          role: role as 'ADMIN' | 'DEVELOPER' | 'MEMBER',
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return apiSuccess(updatedUser);
  } catch (error) {
    // TOCTOU競合などによるPrismaエラーを個別ハンドリング
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: メールアドレスの一意制約違反（並行リクエストによる競合）
      if (error.code === 'P2002') {
        return apiError(
          'このメールアドレスは既に使用されています',
          'BAD_REQUEST',
          400
        );
      }
      // P2025: 存在チェック後に対象ユーザーが削除された場合
      if (error.code === 'P2025') {
        return apiError('ユーザーが見つかりません', 'NOT_FOUND', 404);
      }
    }
    return apiError('ユーザーの更新に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/users/[userId]
 * ユーザーを削除する
 * 権限: Adminのみ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  // Admin権限チェック
  if (!canManageUsers(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

  const { userId } = await params;

  // 自分自身は削除不可
  if (user.id === userId) {
    return apiError('自分自身を削除することはできません', 'BAD_REQUEST', 400);
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return apiError('ユーザーが見つかりません', 'NOT_FOUND', 404);
    }

    await prisma.user.delete({ where: { id: userId } });

    return apiSuccess({ message: 'ユーザーを削除しました' });
  } catch (error) {
    // P2025: 存在チェック後に対象ユーザーが削除された場合
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return apiError('ユーザーが見つかりません', 'NOT_FOUND', 404);
    }
    return apiError('ユーザーの削除に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
