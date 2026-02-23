import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canManageGroups } from '@/lib/permissions';

type Params = { groupId: string; userId: string };

/**
 * DELETE /api/v1/groups/:groupId/members/:userId
 * グループからメンバーを削除する
 * 権限: Admin
 */
export async function DELETE(
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

  const { groupId, userId } = await params;

  try {
    // グループの存在チェック
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }

    // メンバーシップの存在チェック
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId, groupId } },
    });
    if (!membership) {
      return apiError(
        '指定されたユーザーはこのグループのメンバーではありません',
        'NOT_FOUND',
        404
      );
    }

    await prisma.groupMember.delete({
      where: { userId_groupId: { userId, groupId } },
    });

    return apiSuccess({ message: 'メンバーを削除しました' });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return apiError(
        '指定されたユーザーはこのグループのメンバーではありません',
        'NOT_FOUND',
        404
      );
    }
    return apiError('メンバーの削除に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
