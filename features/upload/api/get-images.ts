'use server';

import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * 画像ファイルの情報
 */
export type ImageFile = {
  name: string;
  path: string;
  size: number;
  modifiedAt: Date;
};

/**
 * public/uploadsディレクトリ内の画像ファイル一覧を取得するServer Action
 */
export async function getImages(
  imageType?: 'icon' | 'favicon'
): Promise<ImageFile[]> {
  try {
    const subDir =
      imageType === 'icon'
        ? 'icons'
        : imageType === 'favicon'
          ? 'favicons'
          : '';
    const uploadDir = subDir
      ? join(process.cwd(), 'public', 'uploads', subDir)
      : join(process.cwd(), 'public', 'uploads');

    // ディレクトリが存在しない場合は空配列を返す
    if (!existsSync(uploadDir)) {
      return [];
    }

    const files = await readdir(uploadDir);

    // 画像ファイルのみをフィルタリングして情報を取得
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.webp',
      '.svg',
      '.ico',
    ];
    const imageFiles = await Promise.all(
      files
        .filter((file) =>
          imageExtensions.some((ext) => file.toLowerCase().endsWith(ext))
        )
        .map(async (file) => {
          const filePath = join(uploadDir, file);
          const stats = await stat(filePath);
          return {
            name: file,
            path: subDir ? `/uploads/${subDir}/${file}` : `/uploads/${file}`,
            size: stats.size,
            modifiedAt: stats.mtime,
          };
        })
    );

    // 更新日時の降順でソート
    return imageFiles.sort(
      (a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime()
    );
  } catch (error) {
    console.error('Failed to get images:', error);
    return [];
  }
}
