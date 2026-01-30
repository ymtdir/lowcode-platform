'use server';

import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';
import { parseCSV } from '@/lib/csv';
import type {
  ImportResult,
  ValidationError,
} from '@/features/table/types/import';

/**
 * ヘッダー名のエイリアス定義（大文字小文字無視）
 */
const HEADER_ALIASES = {
  id: ['id'],
  name: ['name', 'グループ名', '名前'],
  description: ['description', '説明'],
  parent: ['parent', 'parentgroup', '親グループ'],
} as const;

/**
 * ヘッダー名を正規化してフィールド名を取得
 */
function normalizeHeader(header: string): keyof typeof HEADER_ALIASES | null {
  const normalized = header.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => alias.toLowerCase() === normalized)) {
      return field as keyof typeof HEADER_ALIASES;
    }
  }
  return null;
}

/**
 * ヘッダーからカラムインデックスマッピングを作成
 */
function createHeaderMapping(
  headers: string[]
): Map<keyof typeof HEADER_ALIASES, number> {
  const mapping = new Map<keyof typeof HEADER_ALIASES, number>();
  headers.forEach((header, index) => {
    const field = normalizeHeader(header);
    if (field && !mapping.has(field)) {
      mapping.set(field, index);
    }
  });
  return mapping;
}

/**
 * グループデータをCSVインポートするServer Action
 * @param csvContent - CSV文字列
 * @returns インポート結果
 */
export async function importGroupsAction(
  csvContent: string
): Promise<ImportResult> {
  // 認証チェック
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      totalCount: 0,
      errors: [],
      message: '認証が必要です',
    };
  }

  // 権限チェック
  if (!canManageGroups(currentUser.role)) {
    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      totalCount: 0,
      errors: [],
      message: 'この操作を行う権限がありません',
    };
  }

  try {
    // CSVをパース
    const parsed = parseCSV(csvContent);

    // ヘッダー検証
    const headerErrors = validateHeaders(parsed.headers);
    if (headerErrors.length > 0) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: 0,
        errors: headerErrors,
        message: 'CSVのヘッダーが正しくありません',
      };
    }

    // ヘッダーマッピングを作成
    const headerMapping = createHeaderMapping(parsed.headers);

    // データ検証
    const validationErrors: ValidationError[] = [];
    const validRows: Array<{
      id: string | null;
      name: string;
      description: string | null;
      parentName: string | null;
    }> = [];

    // 既存グループのIDを取得（重複チェック用）
    const existingGroups = await prisma.group.findMany({
      select: { id: true, name: true },
    });
    const existingIds = new Set(existingGroups.map((g) => g.id));
    const groupNameToId = new Map(existingGroups.map((g) => [g.name, g.id]));

    // インデックスを取得（IDは任意なのでundefinedの可能性あり）
    const idIndex = headerMapping.get('id');
    const nameIndex = headerMapping.get('name')!;
    const descriptionIndex = headerMapping.get('description');
    const parentIndex = headerMapping.get('parent');

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const rowNum = i + 2; // ヘッダー行 + 1行目からのインデックス

      // 各フィールドを取得（順序に依存しない）
      const id = idIndex !== undefined ? row[idIndex]?.trim() || null : null;
      const name = row[nameIndex]?.trim() || '';
      const description =
        descriptionIndex !== undefined
          ? row[descriptionIndex]?.trim() || null
          : null;
      const parentName =
        parentIndex !== undefined ? row[parentIndex]?.trim() || null : null;

      // グループ名の必須チェック
      if (!name) {
        validationErrors.push({
          type: 'REQUIRED_FIELD',
          row: i,
          column: 'name',
          message: `${rowNum}行目: グループ名は必須です`,
        });
        continue;
      }

      validRows.push({
        id,
        name,
        description,
        parentName,
      });
    }

    // エラーがある場合は処理を中断
    if (validationErrors.length > 0) {
      return {
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        totalCount: parsed.rows.length,
        errors: validationErrors,
        message: `${validationErrors.length}件のバリデーションエラーがあります`,
      };
    }

    // トランザクションでインポート実行
    let insertedCount = 0;
    let updatedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        // 親グループIDを解決
        let parentId: string | null = null;
        if (row.parentName) {
          parentId = groupNameToId.get(row.parentName) ?? null;
          // 親グループが見つからない場合は作成
          if (!parentId) {
            const createdParent = await tx.group.create({
              data: {
                name: row.parentName,
                description: null,
                parentId: null,
              },
            });
            parentId = createdParent.id;
            groupNameToId.set(row.parentName, createdParent.id);
          }
        }

        // ID値がある + 既存IDと一致 → 更新
        if (row.id && existingIds.has(row.id)) {
          await tx.group.update({
            where: { id: row.id },
            data: {
              name: row.name,
              description: row.description,
              parentId,
            },
          });
          updatedCount++;
        } else {
          // 新規作成（ID指定またはUUID自動生成）
          const created = await tx.group.create({
            data: {
              // ID値がある + 既存IDと不一致 → ID指定で新規作成
              // ID値が空 → UUID自動生成（idフィールドを省略）
              ...(row.id ? { id: row.id } : {}),
              name: row.name,
              description: row.description,
              parentId,
            },
          });
          // 新規作成した場合はマップに追加（後続の親グループ参照用）
          groupNameToId.set(created.name, created.id);
          insertedCount++;
        }
      }
    });

    return {
      success: true,
      insertedCount,
      updatedCount,
      skippedCount: 0,
      totalCount: validRows.length,
      message: `${validRows.length}件のグループをインポートしました`,
    };
  } catch (error) {
    console.error('グループインポートエラー:', error);
    return {
      success: false,
      insertedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      totalCount: 0,
      errors: [],
      message:
        error instanceof Error
          ? error.message
          : 'インポート中にエラーが発生しました',
    };
  }
}

/**
 * CSVヘッダーを検証
 * 必須: name（ID、説明、親グループは任意）
 */
function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const mapping = createHeaderMapping(headers);

  // 必須フィールドのチェック（グループ名のみ必須）
  if (!mapping.has('name')) {
    errors.push({
      type: 'MISSING_HEADER',
      row: -1,
      column: 'グループ名',
      message: `必須ヘッダー「グループ名」がありません（許容: ${HEADER_ALIASES.name.join(', ')}）`,
    });
  }

  return errors;
}
