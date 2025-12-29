'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import { parseCSV } from '@/lib/csv';
import type { UserRole } from '@prisma/client';
import type {
  ImportResult,
  ValidationError,
} from '@/features/table/types/import';

/**
 * ユーザーインポート用のCSVヘッダー定義
 */
const REQUIRED_HEADERS = ['ID', 'メールアドレス', '名前', 'ロール', '作成日'];

/**
 * 有効なUserRole
 */
const VALID_ROLES: UserRole[] = ['ADMIN', 'DEVELOPER', 'MEMBER'];

/**
 * ユーザーデータをCSVインポートするServer Action
 * @param csvContent - CSV文字列
 * @returns インポート結果
 */
export async function importUsersAction(
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

  if (!currentUser || !canManageUsers(currentUser.role)) {
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

      const [id, email, name, role] = row;

      // メールアドレスの必須チェック
      if (!email || email.trim() === '') {
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
      if (!emailRegex.test(email.trim())) {
        validationErrors.push({
          type: 'INVALID_TYPE',
          row: i,
          column: 'email',
          message: `${rowNum}行目: メールアドレスの形式が正しくありません`,
        });
        continue;
      }

      // 名前の必須チェック
      if (!name || name.trim() === '') {
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
        id: id.trim(),
        email: email.trim(),
        name: name.trim(),
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

    const adminSupabase = createAdminClient();

    await prisma.$transaction(async (tx) => {
      for (const row of validRows) {
        // IDが存在する場合は更新
        if (row.id && existingIds.has(row.id)) {
          await tx.user.update({
            where: { id: row.id },
            data: {
              name: row.name,
              role: row.role,
              // メールアドレスは更新しない（Supabase Authとの整合性のため）
            },
          });
          updatedCount++;
        }
        // メールアドレスが既に存在する場合はスキップ
        else if (existingEmails.has(row.email)) {
          skippedCount++;
        }
        // 新規ユーザーを作成
        else {
          try {
            // Supabase Admin APIでユーザー作成（仮パスワード設定）
            const { data: authData, error } =
              await adminSupabase.auth.admin.createUser({
                email: row.email,
                password: Math.random().toString(36).slice(-12), // ランダムな仮パスワード
                email_confirm: true,
              });

            if (error || !authData.user) {
              console.error('Supabaseユーザー作成エラー:', error?.message);
              skippedCount++;
              continue;
            }

            // Prismaにユーザー情報を保存
            await tx.user.create({
              data: {
                id: authData.user.id,
                name: row.name,
                email: row.email,
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
