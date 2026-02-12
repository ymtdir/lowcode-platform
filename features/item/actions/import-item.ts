'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { canManageStructure } from '@/lib/permissions';
import { Prisma } from '@prisma/client';
import type { ImportResult } from '@/features/table/types/import';
import type { ItemExportData, ItemExportFile } from '@/features/item/types';

/**
 * エクスポートデータからアイテムを再帰的に作成する
 */
async function createItemFromExport(
  tx: Prisma.TransactionClient,
  itemData: ItemExportData,
  parentId: string | null,
  createdById: string,
  baseOrder: number
): Promise<number> {
  let createdCount = 0;

  // アイテムを作成
  const item = await tx.item.create({
    data: {
      type: itemData.type,
      name: itemData.name,
      icon: itemData.icon,
      parentId,
      order: baseOrder,
      meta:
        itemData.meta === null
          ? Prisma.JsonNull
          : (itemData.meta as Prisma.InputJsonValue),
      createdById,
    },
  });
  createdCount++;

  // スタイルを作成
  if (itemData.styles.length > 0) {
    await tx.style.createMany({
      data: itemData.styles.map((s) => ({
        itemId: item.id,
        name: s.name,
        content: s.content,
        order: s.order,
      })),
    });
  }

  // スクリプトを作成
  if (itemData.scripts.length > 0) {
    await tx.script.createMany({
      data: itemData.scripts.map((s) => ({
        itemId: item.id,
        name: s.name,
        content: s.content,
        order: s.order,
      })),
    });
  }

  // レコードを作成（TABLE型の場合のみ）
  if (
    itemData.records &&
    itemData.records.length > 0 &&
    itemData.type === 'TABLE'
  ) {
    await tx.record.createMany({
      data: itemData.records.map((r) => ({
        tableId: item.id,
        data: r.data as Prisma.InputJsonValue,
        createdById,
      })),
    });
  }

  // 子アイテムを再帰的に作成（FOLDER型の場合のみ）
  if (itemData.children && itemData.children.length > 0) {
    for (let i = 0; i < itemData.children.length; i++) {
      const childCount = await createItemFromExport(
        tx,
        itemData.children[i],
        item.id,
        createdById,
        i
      );
      createdCount += childCount;
    }
  }

  return createdCount;
}

/**
 * JSONバリデーション
 */
function validateExportFile(data: unknown): data is ItemExportFile {
  if (!data || typeof data !== 'object') return false;

  const file = data as Record<string, unknown>;
  if (typeof file.version !== 'number') return false;
  if (!Array.isArray(file.items)) return false;
  if (file.items.length === 0) return false;

  // 各アイテムの基本構造チェック
  for (const item of file.items) {
    if (!validateExportItem(item)) return false;
  }

  return true;
}

/**
 * アイテムデータのバリデーション（再帰）
 */
function validateExportItem(data: unknown): data is ItemExportData {
  if (!data || typeof data !== 'object') return false;

  const item = data as Record<string, unknown>;
  if (typeof item.name !== 'string' || item.name.trim() === '') return false;
  if (item.type !== 'TABLE' && item.type !== 'FOLDER') return false;
  if (!Array.isArray(item.styles)) return false;
  if (!Array.isArray(item.scripts)) return false;

  // 子アイテムのバリデーション（再帰）
  if (item.children) {
    if (!Array.isArray(item.children)) return false;
    for (const child of item.children) {
      if (!validateExportItem(child)) return false;
    }
  }

  return true;
}

/**
 * アイテム数を再帰的にカウント
 */
function countItems(items: ItemExportData[]): number {
  let count = items.length;
  for (const item of items) {
    if (item.children) {
      count += countItems(item.children);
    }
  }
  return count;
}

/**
 * アイテムをJSON形式でインポートするServer Action
 * @param jsonContent - JSON形式の文字列
 * @param parentId - インポート先の親アイテムID（null の場合はルート）
 */
export async function importItemAction(
  jsonContent: string,
  parentId: string | null
): Promise<ImportResult> {
  try {
    // 認証チェック
    const currentUser = await requireAuth();

    // 権限チェック（ADMIN/DEVELOPERのみ）
    if (!canManageStructure(currentUser.role)) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message: 'この操作を行う権限がありません',
      };
    }

    // JSONパース
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message: 'JSONの形式が不正です',
      };
    }

    // バリデーション
    if (!validateExportFile(parsed)) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message:
          'インポートファイルの形式が不正です。エクスポートしたファイルを使用してください。',
      };
    }

    const exportFile = parsed;
    const totalItemCount = countItems(exportFile.items);

    // 親アイテムの存在チェック（parentId が指定されている場合）
    if (parentId) {
      const parentItem = await prisma.item.findUnique({
        where: { id: parentId },
        select: { id: true, type: true },
      });
      if (!parentItem) {
        return {
          success: false,
          insertedCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          totalCount: totalItemCount,
          message: 'インポート先のフォルダが見つかりません',
        };
      }
    }

    // 同じ親の最大order値を取得
    const maxOrderItem = await prisma.item.findFirst({
      where: { parentId: parentId || null },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const startOrder = maxOrderItem ? maxOrderItem.order + 1 : 0;

    // トランザクションでアイテムを一括作成
    let insertedCount = 0;

    await prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < exportFile.items.length; i++) {
          const count = await createItemFromExport(
            tx,
            exportFile.items[i],
            parentId,
            currentUser.id,
            startOrder + i
          );
          insertedCount += count;
        }
      },
      { timeout: 60000 }
    );

    revalidatePath('/', 'layout');

    return {
      success: true,
      insertedCount,
      updatedCount: 0,
      skippedCount: 0,
      totalCount: totalItemCount,
      message: `${insertedCount}件のアイテムをインポートしました`,
    };
  } catch (error) {
    console.error('アイテムインポートエラー:', error);
    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      totalCount: 0,
      message:
        error instanceof Error
          ? error.message
          : 'インポート中にエラーが発生しました',
    };
  }
}
