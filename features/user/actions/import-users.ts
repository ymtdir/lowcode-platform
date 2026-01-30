'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import { requireAuth } from '@/lib/auth';
import { parseCSV } from '@/lib/csv';
import type { UserRole } from '@prisma/client';
import type {
  ImportResult,
  ValidationError,
} from '@/features/table/types/import';

/**
 * ヘッダー名のエイリアス定義（大文字小文字無視）
 */
const HEADER_ALIASES = {
  id: ['id'],
  email: ['email', 'mail', 'メールアドレス'],
  name: ['name', '氏名', '名前'],
  role: ['role', '権限', 'ロール'],
} as const;

/**
 * 有効なUserRole
 */
const VALID_ROLES: UserRole[] = ['ADMIN', 'DEVELOPER', 'MEMBER'];

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
 * CSVインポートで作成されるユーザーのデフォルトパスワード
 * 環境変数 DEFAULT_USER_PASSWORD から取得
 */
const DEFAULT_PASSWORD = process.env.DEFAULT_USER_PASSWORD || 'ChangeMe123!';

/**
 * ユーザーデータをCSVインポートするServer Action
 * @param csvContent - CSV文字列
 * @returns インポート結果
 */
export async function importUsersAction(
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
  if (!canManageUsers(currentUser.role)) {
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
      email: string;
      name: string;
      role: UserRole;
    }> = [];

    // 既存ユーザーのIDとメールアドレスを取得
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true },
    });
    const existingIds = new Set(existingUsers.map((u) => u.id));
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    // インデックスを取得（IDは任意なのでundefinedの可能性あり）
    const idIndex = headerMapping.get('id');
    const emailIndex = headerMapping.get('email')!;
    const nameIndex = headerMapping.get('name')!;
    const roleIndex = headerMapping.get('role')!;

    for (let i = 0; i < parsed.rows.length; i++) {
      const row = parsed.rows[i];
      const rowNum = i + 2; // ヘッダー行 + 1行目からのインデックス

      // 各フィールドを取得（順序に依存しない）
      const id = idIndex !== undefined ? row[idIndex]?.trim() || null : null;
      const email = row[emailIndex]?.trim() || '';
      const name = row[nameIndex]?.trim() || '';
      const role = row[roleIndex]?.trim() || '';

      // メールアドレスの必須チェック
      if (!email) {
        validationErrors.push({
          type: 'REQUIRED_FIELD',
          row: i,
          column: 'email',
          message: `${rowNum}行目: メールアドレスは必須です`,
        });
        continue;
      }

      // メールアドレスの形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push({
          type: 'INVALID_TYPE',
          row: i,
          column: 'email',
          message: `${rowNum}行目: メールアドレスの形式が正しくありません`,
        });
        continue;
      }

      // 名前の必須チェック
      if (!name) {
        validationErrors.push({
          type: 'REQUIRED_FIELD',
          row: i,
          column: 'name',
          message: `${rowNum}行目: 名前は必須です`,
        });
        continue;
      }

      // ロールの検証
      if (!VALID_ROLES.includes(role as UserRole)) {
        validationErrors.push({
          type: 'INVALID_TYPE',
          row: i,
          column: 'role',
          message: `${rowNum}行目: ロールは ADMIN, DEVELOPER, MEMBER のいずれかである必要があります`,
        });
        continue;
      }

      validRows.push({
        id,
        email,
        name,
        role: role as UserRole,
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
    let skippedCount = 0;

    // デフォルトパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        // ID値がある + 既存IDと一致 → 更新
        if (row.id && existingIds.has(row.id)) {
          await tx.user.update({
            where: { id: row.id },
            data: {
              name: row.name,
              role: row.role,
              // メールアドレスとパスワードは更新しない
            },
          });
          updatedCount++;
        }
        // メールアドレスが既に存在する場合はスキップ（新規作成のみ）
        else if (existingEmails.has(row.email)) {
          skippedCount++;
        }
        // 新規ユーザーを作成
        else {
          try {
            await tx.user.create({
              data: {
                // ID値がある + 既存IDと不一致 → ID指定で新規作成
                // ID値が空 → UUID自動生成（idフィールドを省略）
                ...(row.id ? { id: row.id } : {}),
                name: row.name,
                email: row.email,
                password: hashedPassword,
                role: row.role,
              },
            });
            insertedCount++;
          } catch (error) {
            console.error('ユーザー作成エラー:', error);
            skippedCount++;
          }
        }
      }
    });

    return {
      success: true,
      insertedCount,
      updatedCount,
      skippedCount,
      totalCount: validRows.length,
      message: `${validRows.length}件のユーザーをインポートしました（新規: ${insertedCount}件, 更新: ${updatedCount}件, スキップ: ${skippedCount}件）`,
    };
  } catch (error) {
    console.error('ユーザーインポートエラー:', error);
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
 * 必須: email, name, role（IDは任意）
 */
function validateHeaders(headers: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const mapping = createHeaderMapping(headers);

  // 必須フィールドのチェック（IDは任意なので含まない）
  const requiredFields: Array<{
    field: keyof typeof HEADER_ALIASES;
    displayName: string;
  }> = [
    { field: 'email', displayName: 'メールアドレス' },
    { field: 'name', displayName: '名前' },
    { field: 'role', displayName: 'ロール' },
  ];

  for (const { field, displayName } of requiredFields) {
    if (!mapping.has(field)) {
      errors.push({
        type: 'MISSING_HEADER',
        row: -1,
        column: displayName,
        message: `必須ヘッダー「${displayName}」がありません（許容: ${HEADER_ALIASES[field].join(', ')}）`,
      });
    }
  }

  return errors;
}
