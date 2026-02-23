import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canManageGroups } from '@/lib/permissions';

/** グループ取得時の共通select */
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
 * GET /api/v1/groups
 * グループ一覧を取得する
 * 権限: 認証済み
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      select: groupSelect,
    });

    return apiSuccess(groups);
  } catch {
    return apiError('グループ一覧の取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/v1/groups
 * グループを作成する
 * 権限: Admin
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  // Admin権限チェック
  if (!canManageGroups(user.role)) {
    return apiError('この操作にはAdmin権限が必要です', 'FORBIDDEN', 403);
  }

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
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return apiError('nameは必須です', 'VALIDATION_ERROR', 422);
  }
  if (description !== undefined && typeof description !== 'string') {
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

  // 空文字列のparentIdはnullとして扱う
  const normalizedParentId =
    typeof parentId === 'string' ? parentId.trim() || null : (parentId ?? null);

  try {
    // parentIdが指定された場合は存在チェック
    if (normalizedParentId) {
      const parentGroup = await prisma.group.findUnique({
        where: { id: normalizedParentId },
      });
      if (!parentGroup) {
        return apiError('親グループが見つかりません', 'NOT_FOUND', 404);
      }
    }

    const newGroup = await prisma.group.create({
      data: {
        name: name.trim(),
        description:
          typeof description === 'string' ? description.trim() || null : null,
        parentId: normalizedParentId,
      },
      select: groupSelect,
    });

    return apiSuccess(newGroup, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return apiError('同名のグループが既に存在します', 'BAD_REQUEST', 400);
    }
    return apiError('グループの作成に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
