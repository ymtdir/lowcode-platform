import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiSuccessList, apiError } from '@/lib/api-response';
import { canAccessItem, hasPermission } from '@/lib/permissions';
import { parseFilter, buildPrismaFilter } from '@/lib/api-filter';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

/**
 * GET /api/v1/items/[itemId]/records
 * レコード一覧を取得する（ページネーション・ソート・フィルタ付き）
 *
 * クエリパラメータ:
 * - page: number (デフォルト: 1)
 * - limit: number (デフォルト: 50, 最大: 100)
 * - sort: string (カラムIDまたは createdAt, updatedAt)
 * - order: asc | desc (デフォルト: desc)
 * - filter: string (例: "col1:eq:value,col2:gt:100")
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
    const table = await prisma.item.findUnique({
      where: { id: itemId, type: 'TABLE' },
      select: { id: true },
    });

    if (!table) {
      return apiError('テーブルが見つかりません', 'NOT_FOUND', 404);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get('limit')) || DEFAULT_LIMIT)
    );
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    const filterParam = searchParams.get('filter') || '';

    // フィルタのパース
    const filterResult = parseFilter(filterParam);
    if (!filterResult.ok) {
      return apiError(filterResult.error, 'VALIDATION_ERROR', 422);
    }

    const skip = (page - 1) * limit;

    // フィルタ条件をPrismaのwhere句に変換
    const filterConditions = buildPrismaFilter(filterResult.conditions);
    const where = {
      tableId: itemId,
      ...(filterConditions.length > 0 && { AND: filterConditions }),
    };

    const [records, total] = await Promise.all([
      prisma.record.findMany({
        where,
        orderBy:
          sort === 'createdAt' || sort === 'updatedAt'
            ? { [sort]: order }
            : { createdAt: order },
        skip,
        take: limit,
      }),
      prisma.record.count({ where }),
    ]);

    return apiSuccessList(records, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return apiError('レコードの取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * POST /api/v1/items/[itemId]/records
 * レコードを作成する
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { itemId } = await params;

  const { canAccess, level } = await canAccessItem(itemId, user.id, user.role);
  if (!canAccess || !hasPermission(level, 'WRITE')) {
    return apiError('レコードを作成する権限がありません', 'FORBIDDEN', 403);
  }

  try {
    const table = await prisma.item.findUnique({
      where: { id: itemId, type: 'TABLE' },
      select: { id: true },
    });

    if (!table) {
      return apiError('テーブルが見つかりません', 'NOT_FOUND', 404);
    }

    let body: { data?: unknown };
    try {
      body = await request.json();
    } catch {
      return apiError('リクエストボディが不正なJSONです', 'BAD_REQUEST', 400);
    }

    if (
      !body.data ||
      typeof body.data !== 'object' ||
      Array.isArray(body.data)
    ) {
      return apiError('data フィールドが必要です', 'BAD_REQUEST', 400);
    }

    const record = await prisma.record.create({
      data: {
        tableId: itemId,
        data: body.data,
        createdById: user.id,
      },
    });

    return apiSuccess(record, 201);
  } catch {
    return apiError('レコードの作成に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
