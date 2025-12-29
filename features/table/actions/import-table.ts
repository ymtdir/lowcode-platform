'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getItemPermissionLevel, hasPermission } from '@/lib/permissions';
import { getItemById } from '@/features/item/api';
import { getColumnSchema } from '@/features/column/types/schema';
import { parseCSV } from '@/lib/csv';
import {
  validateImportData,
  parseImportData,
} from '@/lib/validators/import-validator';
import type { ImportResult } from '../types/import';
import type { RecordData } from '@/features/record/types';
import type { RelationColumn } from '@/features/column/types';

/**
 * テーブルにCSVデータをインポートするServer Action
 * @param itemId - テーブルID
 * @param csvContent - CSV形式の文字列
 * @returns インポート結果
 */
export async function importTableAction(
  itemId: string,
  csvContent: string
): Promise<ImportResult> {
  try {
    // 認証チェック
    const currentUser = await requireAuth();

    // アイテム情報を取得
    const item = await getItemById(itemId);
    if (!item || item.type !== 'TABLE') {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message: 'テーブルが見つかりません',
      };
    }

    // 権限チェック（WRITE権限が必要）
    const permissionLevel = await getItemPermissionLevel(
      itemId,
      currentUser.id,
      currentUser.role
    );

    if (!hasPermission(permissionLevel, 'WRITE')) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message: 'インポートする権限がありません',
      };
    }

    // カラム定義を取得
    const columnSchema = getColumnSchema(item.meta);
    const columns = columnSchema?.columns || [];

    if (columns.length === 0) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message: 'カラムが定義されていません',
      };
    }

    // CSVをパース
    const parsedCsv = parseCSV(csvContent);

    if (parsedCsv.rows.length === 0) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        message: 'インポートするデータがありません',
      };
    }

    // 既存レコードIDを取得（重複チェック用）
    const existingRecords = await prisma.record.findMany({
      where: { tableId: itemId },
      select: { id: true, data: true },
    });
    const existingRecordIds = new Set(existingRecords.map((r) => r.id));

    // RELATION型カラムの参照先データを取得
    const relationColumns = columns.filter(
      (col) => col.type === 'RELATION'
    ) as RelationColumn[];
    // カラムID → 表示値のセット（バリデーション用）
    const referencedDisplayValues = new Map<string, Set<string>>();
    // カラムID → 表示値→レコードIDのマップ（変換用）
    const displayValueToIdMaps = new Map<string, Map<string, string>>();

    for (const relationCol of relationColumns) {
      const referencedTableId = relationCol.config.referencedTableId;
      const displayField = relationCol.config.displayField;

      // リレーション先のテーブルを取得
      const referencedTable = await getItemById(referencedTableId);
      if (!referencedTable || referencedTable.type !== 'TABLE') continue;

      // 参照先のすべてのレコードを取得
      const referencedRecords = await prisma.record.findMany({
        where: { tableId: referencedTableId },
      });

      // 表示値のセット（バリデーション用）
      const displayValueSet = new Set<string>();
      // 表示値からレコードIDへのマップ（変換用）
      const valueToIdMap = new Map<string, string>();

      for (const record of referencedRecords) {
        const data = record.data as RecordData;
        const displayValue = data[displayField];
        if (displayValue) {
          const displayValueStr = String(displayValue);
          displayValueSet.add(displayValueStr);
          valueToIdMap.set(displayValueStr, record.id);
        }
      }

      referencedDisplayValues.set(relationCol.id, displayValueSet);
      displayValueToIdMaps.set(relationCol.id, valueToIdMap);
    }

    // バリデーション実行
    const validationResult = validateImportData(
      parsedCsv,
      columns,
      existingRecordIds,
      referencedDisplayValues
    );

    if (!validationResult.valid) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: parsedCsv.rows.length,
        errors: validationResult.errors,
        message: `バリデーションエラーが${validationResult.errors.length}件見つかりました`,
      };
    }

    // インポートデータをパース
    const parsedData = parseImportData(parsedCsv, columns);

    // RELATION型の表示値をレコードIDに変換
    for (const row of parsedData.rows) {
      for (const relationCol of relationColumns) {
        const value = row.data[relationCol.id];
        if (!value) continue;

        const displayValues = Array.isArray(value) ? value : [value];
        const valueToIdMap = displayValueToIdMaps.get(relationCol.id);

        if (valueToIdMap) {
          const recordIds: string[] = [];
          for (const displayValue of displayValues) {
            const recordId = valueToIdMap.get(String(displayValue));
            if (recordId) {
              recordIds.push(recordId);
            }
          }

          // 常に配列形式で保存（エクスポート形式と統一）
          row.data[relationCol.id] = recordIds;
        }
      }
    }

    // トランザクション処理でインポート実行
    let insertedCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of parsedData.rows) {
        const jsonData = JSON.parse(JSON.stringify(row.data));

        if (row.recordId && existingRecordIds.has(row.recordId)) {
          // 既存レコードを更新
          await tx.record.update({
            where: { id: row.recordId },
            data: {
              data: jsonData,
              updatedAt: new Date(),
            },
          });
          updatedCount++;
        } else {
          // 新規レコードを作成
          await tx.record.create({
            data: {
              ...(row.recordId ? { id: row.recordId } : {}), // recordIdが指定されていればそれを使用、なければ自動生成
              tableId: itemId,
              data: jsonData,
              createdById: currentUser.id,
            },
          });
          insertedCount++;
        }
      }
    });

    return {
      success: true,
      insertedCount,
      updatedCount,
      skippedCount: 0,
      totalCount: parsedData.rows.length,
      message: `${insertedCount}件を新規作成、${updatedCount}件を更新しました`,
    };
  } catch (error) {
    console.error('Import error:', error);
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
