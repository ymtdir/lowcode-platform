import { reorderFolders } from '../reorder-folders';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';

describe('reorderFolders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォルダが見つからない場合はエラーを返す', async () => {
    const input = {
      folderId: 'non-existent',
      newParentId: null,
      reorderedSiblings: [],
    };

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderFolders(input);

    expect(result).toEqual({
      success: false,
      error: 'フォルダが見つかりません',
    });
  });

  it('同じ親内でフォルダの順序を変更できる', async () => {
    const input = {
      folderId: 'folder-1',
      newParentId: null,
      reorderedSiblings: [
        { id: 'folder-2', order: 0 },
        { id: 'folder-1', order: 1 },
        { id: 'folder-3', order: 2 },
      ],
    };

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'フォルダ1',
      parentId: null,
      children: [],
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        folder: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      return callback(tx);
    });

    const result = await reorderFolders(input);

    expect(result).toEqual({ success: true });
    expect(prisma.folder.findUnique).toHaveBeenCalledWith({
      where: { id: 'folder-1' },
      include: {
        children: {
          select: { id: true },
        },
      },
    });
  });

  it('自分自身を親にしようとした場合はエラーを返す', async () => {
    const input = {
      folderId: 'folder-1',
      newParentId: 'folder-1',
      reorderedSiblings: [],
    };

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'フォルダ1',
      parentId: null,
      children: [],
    });

    const result = await reorderFolders(input);

    expect(result).toEqual({
      success: false,
      error: '自分自身または子フォルダを親にすることはできません',
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const input = {
      folderId: 'folder-1',
      newParentId: null,
      reorderedSiblings: [{ id: 'folder-1', order: 0 }],
    };

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'フォルダ1',
      parentId: null,
      children: [],
    });

    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderFolders(input);

    expect(result).toEqual({
      error: 'フォルダの並び替えに失敗しました',
    });
  });
});
