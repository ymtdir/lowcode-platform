import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canManageGroups } from '@/lib/permissions';

type Params = { groupId: string };

/**
 * グループ取得時の共通select
 */
const groupSelect = {
  id: true,
  name: true,
  description: true,
  parentId: true,
  parent: {
    select: { id: true, name: true },
  },
  _count: {
    select: { members: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 循環参照をチェックするヘルパー関数
 */
async function checkCircularReference(
  groupId: string,
  newParentId: string
): Promise<boolean> {
  const visited = new Set<string>();
  let currentId = newParentId;

  while (currentId) {
    if (visited.has(currentId)) return true;
    if (currentId === groupId) return true;

    visited.add(currentId);

    const parent = await prisma.group.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!parent || !parent.parentId) return false;
    currentId = parent.parentId;
  }

  return false;
}

/**
 * GET /api/v1/groups/:groupId
 * グループ詳細を取得する
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
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: groupSelect,
    });

    if (!group) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }

    return apiSuccess(group);
  } catch {
    return apiError('グループの取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PATCH /api/v1/groups/:groupId
 * グループ情報を部分更新する
 * 権限: Admin
 */
export async function PATCH(
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

  const { name, description, parentId } = body as {
    name?: unknown;
    description?: unknown;
    parentId?: unknown;
  };

  // バリデーション
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return apiError('nameは空にできません', 'VALIDATION_ERROR', 422);
    }
  }
  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    return apiError(
      'descriptionは文字列で入力してください',
      'VALIDATION_ERROR',
      422
    );
  }
  if (
    parentId !== undefined &&
    parentId !== null &&
    typeof parentId !== 'string'
  ) {
    return apiError(
      'parentIdは文字列で入力してください',
      'VALIDATION_ERROR',
      422
    );
  }

  // 更新フィールドが何もない場合
  if (
    name === undefined &&
    description === undefined &&
    parentId === undefined
  ) {
    return apiError('更新するフィールドがありません', 'BAD_REQUEST', 400);
  }

  // 空文字列のparentIdはnullとして扱う
  const normalizedParentId =
    parentId === undefined
      ? undefined
      : typeof parentId === 'string'
        ? parentId.trim() || null
        : null;

  try {
    // グループの存在チェック
    const targetGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!targetGroup) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }

    // parentId指定時のバリデーション
    if (normalizedParentId) {
      // 自分自身を親にしようとしている場合はエラー
      if (normalizedParentId === groupId) {
        return apiError(
          '自分自身を親グループとして設定することはできません',
          'BAD_REQUEST',
          400
        );
      }

      // 親グループの存在チェック
      const parentGroup = await prisma.group.findUnique({
        where: { id: normalizedParentId },
      });
      if (!parentGroup) {
        return apiError('親グループが見つかりません', 'NOT_FOUND', 404);
      }

      // 循環参照チェック
      const hasCircularRef = await checkCircularReference(
        groupId,
        normalizedParentId
      );
      if (hasCircularRef) {
        return apiError(
          '子グループを親として設定することはできません',
          'BAD_REQUEST',
          400
        );
      }
    }

    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name: (name as string).trim() }),
        ...(description !== undefined && {
          description:
            description === null
              ? null
              : (description as string).trim() || null,
        }),
        ...(parentId !== undefined && {
          parentId: normalizedParentId,
        }),
      },
      select: groupSelect,
    });

    return apiSuccess(updatedGroup);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }
    return apiError('グループの更新に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * DELETE /api/v1/groups/:groupId
 * グループを削除する
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

  const { groupId } = await params;

  try {
    // グループの存在チェック
    const targetGroup = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!targetGroup) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }

    // 子グループが存在する場合は削除不可
    const childCount = await prisma.group.count({
      where: { parentId: groupId },
    });
    if (childCount > 0) {
      return apiError(
        '子グループが存在するため削除できません',
        'BAD_REQUEST',
        400
      );
    }

    await prisma.group.delete({ where: { id: groupId } });

    return apiSuccess({ message: 'グループを削除しました' });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return apiError('グループが見つかりません', 'NOT_FOUND', 404);
    }
    return apiError('グループの削除に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
