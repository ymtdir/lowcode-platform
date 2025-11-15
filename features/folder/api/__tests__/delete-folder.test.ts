import { deleteFolder } from '../delete-folder';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('deleteFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォルダを削除できる', async () => {
    const folderId = 'folder-1';

    (prisma.folder.delete as jest.Mock).mockResolvedValue({
      id: folderId,
      name: 'テストフォルダ',
    });

    const result = await deleteFolder(folderId);

    expect(result).toEqual({ success: true });
    expect(prisma.folder.delete).toHaveBeenCalledWith({
      where: { id: folderId },
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const folderId = 'folder-1';

    (prisma.folder.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteFolder(folderId);

    expect(result).toEqual({
      success: false,
      error: 'フォルダの削除に失敗しました',
    });
  });
});
