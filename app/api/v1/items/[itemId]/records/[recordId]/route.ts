import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { apiSuccess, apiError } from '@/lib/api-response';
import { canAccessItem, hasPermission } from '@/lib/permissions';

type Params = Promise<{ itemId: string; recordId: string }>;

/**
 * GET /api/v1/items/[itemId]/records/[recordId]
 * レコードを取得する
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { itemId, recordId } = await params;

  const { canAccess } = await canAccessItem(itemId, user.id, user.role);
  if (!canAccess) {
    return apiError('アイテムへのアクセス権がありません', 'FORBIDDEN', 403);
  }

  try {
    const record = await prisma.record.findUnique({
      where: { id: recordId, tableId: itemId },
    });

    if (!record) {
      return apiError('レコードが見つかりません', 'NOT_FOUND', 404);
    }

    return apiSuccess(record);
  } catch {
    return apiError('レコードの取得に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * レコード更新の共通処理（PATCH/PUT共用）
 */
async function handleUpdate(
  request: NextRequest,
  { params }: { params: Params }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { itemId, recordId } = await params;

  const { canAccess, level } = await canAccessItem(itemId, user.id, user.role);
  if (!canAccess || !hasPermission(level, 'WRITE')) {
    return apiError('レコードを更新する権限がありません', 'FORBIDDEN', 403);
  }

  try {
    const record = await prisma.record.findUnique({
      where: { id: recordId, tableId: itemId },
    });

    if (!record) {
      return apiError('レコードが見つかりません', 'NOT_FOUND', 404);
    }

    const body = await request.json();

    if (!body.data || typeof body.data !== 'object') {
      return apiError('data フィールドが必要です', 'BAD_REQUEST', 400);
    }

    const existingData = (record.data as Record<string, unknown>) || {};
    const updatedData = { ...existingData, ...body.data };

    const updated = await prisma.record.update({
      where: { id: recordId },
      data: { data: updatedData },
    });

    return apiSuccess(updated);
  } catch {
    return apiError('レコードの更新に失敗しました', 'INTERNAL_ERROR', 500);
  }
}

/**
 * PATCH /api/v1/items/[itemId]/records/[recordId]
 * レコードを部分更新する
 */
export async function PATCH(request: NextRequest, context: { params: Params }) {
  return handleUpdate(request, context);
}

/**
 * PUT /api/v1/items/[itemId]/records/[recordId]
 * レコードを部分更新する（PATCH と同じ動作、後方互換のため維持）
 */
export async function PUT(request: NextRequest, context: { params: Params }) {
  return handleUpdate(request, context);
}

/**
 * DELETE /api/v1/items/[itemId]/records/[recordId]
 * レコードを削除する
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  const authResult = await authenticateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  const { itemId, recordId } = await params;

  const { canAccess, level } = await canAccessItem(itemId, user.id, user.role);
  if (!canAccess || !hasPermission(level, 'WRITE')) {
    return apiError('レコードを削除する権限がありません', 'FORBIDDEN', 403);
  }

  try {
    const record = await prisma.record.findUnique({
      where: { id: recordId, tableId: itemId },
      select: { id: true },
    });

    if (!record) {
      return apiError('レコードが見つかりません', 'NOT_FOUND', 404);
    }

    await prisma.record.delete({ where: { id: recordId } });

    return new NextResponse(null, { status: 204 });
  } catch {
    return apiError('レコードの削除に失敗しました', 'INTERNAL_ERROR', 500);
  }
}
