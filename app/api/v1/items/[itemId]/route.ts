import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canAccessItem } from '@/lib/permissions';

/**
 * GET /api/v1/items/[itemId]
 * アイテム詳細を取得する
 * - FOLDER: 子アイテム一覧を含む
 * - TABLE: スキーマ（meta）を含む（レコードは含めない）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { itemId } = await params;

  const { canAccess } = await canAccessItem(itemId, user.id, user.role);
  if (!canAccess) {
    return apiError('アイテムへのアクセス権がありません', 'FORBIDDEN', 403);
  }

  try {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        type: true,
        name: true,
        icon: true,
        meta: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        children: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            name: true,
            icon: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!item) {
      return apiError('アイテムが見つかりません', 'NOT_FOUND', 404);
    }

    return apiSuccess(item);
  } catch {
    return apiError('アイテムの取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
