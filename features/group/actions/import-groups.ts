'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { canManageGroups } from '@/lib/permissions';
import { parseCSV } from '@/lib/csv';
import type {
  ImportResult,
  ValidationError,
} from '@/features/table/types/import';

/**
 * グループインポート用のCSVヘッダー定義
 */
const REQUIRED_HEADERS = [
  'ID',
  'グループ名',
  '説明',
  '親グループ',
  'メンバー数',
  '作成日',
];

/**
 * グループデータをCSVインポートするServer Action
 * @param csvContent - CSV文字列
 * @returns インポート結果
 */
export async function importGroupsAction(
  csvContent: string
): Promise<ImportResult> {
  // 認証チェック
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
  const currentUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { role: true },
  });

  if (!currentUser || !canManageGroups(currentUser.role)) {
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

    // データ検証
    const validationErrors: ValidationError[] = [];
    const validRows: Array<{
      id: string;
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

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const rowNum = i + 2; // ヘッダー行 + 1行目からのインデックス

      if (row.length !== REQUIRED_HEADERS.length) {
        validationErrors.push({
          type: 'INVALID_TYPE',
          row: i,
          column: '',
          message: `${rowNum}行目: カラム数が正しくありません`,
        });
        continue;
      }

      const [id, name, description, parentName] = row;

      // グループ名の必須チェック
      if (!name || name.trim() === '') {
        validationErrors.push({
          type: 'REQUIRED_FIELD',
          row: i,
          column: 'name',
          message: `${rowNum}行目: グループ名は必須です`,
        });
        continue;
      }

      validRows.push({
        id: id.trim(),
        name: name.trim(),
        description: description.trim() || null,
        parentName: parentName.trim() || null,
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

        // IDが存在する場合は更新、存在しない場合は新規作成
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
          const created = await tx.group.create({
            data: {
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
 */
function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) {
      errors.push({
        type: 'MISSING_HEADER',
        row: -1,
        column: required,
        message: `必須ヘッダー "${required}" がありません`,
      });
    }
  }

  return errors;
}
