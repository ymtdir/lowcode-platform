import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canAccessItem } from '@/lib/permissions';

/**
 * GET /api/v1/items
 * アイテム一覧を取得する
 *
 * クエリパラメータ:
 * - type: FOLDER | TABLE (アイテムタイプでフィルタ)
 * - parentId: string (親フォルダIDでフィルタ、"null"でルート直下)
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const parentId = searchParams.get('parentId');

  try {
    const where: Prisma.ItemWhereInput = {};

    if (type === 'FOLDER' || type === 'TABLE') {
      where.type = type;
    }

    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { order: 'asc' },
      select: {
        id: true,
        type: true,
        name: true,
        icon: true,
        meta: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const accessibleItems = [];
    for (const item of items) {
      const { canAccess } = await canAccessItem(item.id, user.id, user.role);
      if (canAccess) {
        accessibleItems.push(item);
      }
    }

    return apiSuccess(accessibleItems);
  } catch {
    return apiError('アイテム一覧の取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
