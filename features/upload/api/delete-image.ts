'use server';

import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * アップロード済み画像を削除するServer Action
 */
export async function deleteImage(
  imagePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // URLデコードしてからパスを検証
    const decodedPath = decodeURIComponent(imagePath);

    // パスがpublic/uploadsで始まることを検証（セキュリティ対策）
    if (!decodedPath.startsWith('/uploads/')) {
      return { success: false, error: '無効なパスです' };
    }

    // パストラバーサル攻撃を防ぐため、..を含むパスを拒否
    if (decodedPath.includes('..')) {
      return { success: false, error: '無効なパスです' };
    }

    // ファイルパスを構築
    const filePath = join(process.cwd(), 'public', decodedPath);

    // ファイルが存在するか確認
    if (!existsSync(filePath)) {
      return { success: false, error: 'ファイルが見つかりません' };
    }

    // ファイルを削除
    await unlink(filePath);

    return { success: true };
  } catch (error) {
    console.error('Failed to delete image:', error);
    return {
      success: false,
      error: 'ファイルの削除に失敗しました',
    };
  }
}
