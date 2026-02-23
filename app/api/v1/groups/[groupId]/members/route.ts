import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canManageGroups } from '@/lib/permissions';

type Params = { groupId: string };

/**
 * GET /api/v1/groups/:groupId/members
 * グループのメンバー一覧を取得する
 * 権限: 認証済み
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;

  const { groupId } = await params;

  try {
    // グループの存在チェック
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
        createdAt: true,
      },
    });

    // { user: {...}, createdAt } をフラット化して返す
    const result = members.map((m) => ({
      ...m.user,
      joinedAt: m.createdAt,
    }));

    return apiSuccess(result);
  } catch {
    return apiError('メンバー一覧の取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/v1/groups/:groupId/members
 * グループにメンバーを追加する
 * 権限: Admin
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  // Admin権限チェック
  if (!canManageGroups(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

  const { groupId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('リクエストボディが不正です', 'BAD_REQUEST', 400);
  }

  const { userIds } = body as { userIds?: unknown };

  // バリデーション
  if (
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    !userIds.every((id) => typeof id === 'string')
  ) {
    return apiError(
      'userIdsは1件以上の文字列配列で指定してください',
      'VALIDATION_ERROR',
      422
    );
  }

  try {
    // グループの存在チェック
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }

    // 既存メンバーをチェックして重複をスキップ
    const existingMembers = await prisma.groupMember.findMany({
      where: { groupId, userId: { in: userIds as string[] } },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingMembers.map((m) => m.userId));
    const newUserIds = (userIds as string[]).filter(
      (id) => !existingUserIds.has(id)
    );

    if (newUserIds.length === 0) {
      return apiError(
        '指定されたユーザーは既にすべてメンバーです',
        'BAD_REQUEST',
        400
      );
    }

    // トランザクションで一括追加
    await prisma.$transaction(
      newUserIds.map((userId) =>
        prisma.groupMember.create({ data: { userId, groupId } })
      )
    );

    return apiSuccess(
      {
        addedCount: newUserIds.length,
        skippedCount: existingUserIds.size,
      },
      201
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      // 外部キー制約違反: 存在しないuserId
      return apiError('指定されたユーザーが存在しません', 'BAD_REQUEST', 400);
    }
    return apiError('メンバーの追加に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
