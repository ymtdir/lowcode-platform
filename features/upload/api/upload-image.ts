'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomBytes } from 'crypto';

/**
 * 画像をpublic/uploadsにアップロードするServer Action
 */
export async function uploadImage(
  formData: FormData,
  imageType?: 'icon' | 'favicon'
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' };
    }

    // ファイルタイプを検証
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error:
          '画像ファイル（JPEG、PNG、GIF、WebP、SVG、ICO）のみアップロード可能です',
      };
    }

    // ファイルサイズを検証（5MB制限）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'ファイルサイズは5MB以下にしてください' };
    }

    // アップロード先ディレクトリを作成（画像タイプに応じて分ける）
    const subDir =
      imageType === 'icon'
        ? 'icons'
        : imageType === 'favicon'
          ? 'favicons'
          : '';
    const uploadDir = subDir
      ? join(process.cwd(), 'public', 'uploads', subDir)
      : join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイル名を生成（タイムスタンプ + ランダム文字列 + 拡張子）
    const ext = file.name.split('.').pop() || 'png';
    const timestamp = Date.now().toString(36); // 36進数で短縮
    const random = randomBytes(4).toString('hex'); // 8文字のランダム文字列
    const fileName = `${timestamp}_${random}.${ext}`;
    const filePath = join(uploadDir, fileName);

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 公開パスを返す
    const publicPath = subDir
      ? `/uploads/${subDir}/${fileName}`
      : `/uploads/${fileName}`;
    return { success: true, path: publicPath };
  } catch (error) {
    console.error('Failed to upload image:', error);
    return {
      success: false,
      error: 'ファイルのアップロードに失敗しました',
    };
  }
}
