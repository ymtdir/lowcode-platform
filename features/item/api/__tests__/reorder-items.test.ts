import { reorderItems } from '../reorder-items';
import { requireAuth, AuthError } from '@/lib/auth';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth');
  return {
    ...actual,
    requireAuth: jest.fn(),
  };
});
import { prisma } from '@/lib/prisma';

// DEVELOPERユーザーのモック

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'DEVELOPER',
};

describe('reorderItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await reorderItems({
      itemId: 'folder-1',
      newParentId: null,
      reorderedSiblings: [],
    });

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    const result = await reorderItems({
      itemId: 'folder-1',
      newParentId: null,
      reorderedSiblings: [],
    });

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('アイテムが見つからない場合はエラーを返す', async () => {
    const input = {
      itemId: 'non-existent',
      newParentId: null,
      reorderedSiblings: [],
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderItems(input);

    expect(result).toEqual({
      error: 'アイテムが見つかりません',
    });
  });

  it('同じ親内でアイテムの順序を変更できる', async () => {
    const input = {
      itemId: 'folder-1',
      newParentId: null,
      reorderedSiblings: [
        { id: 'folder-2', order: 0 },
        { id: 'folder-1', order: 1 },
        { id: 'folder-3', order: 2 },
      ],
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'アイテム1',
      parentId: null,
      children: [],
    });

    (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
      const tx = {
        item: {
          update: jest.fn().mockResolvedValue({}),
        },
      };
      return callback(tx);
    });

    const result = await reorderItems(input);

    expect(result).toEqual({ success: true });
    expect(prisma.item.findUnique).toHaveBeenCalledWith({
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
      itemId: 'folder-1',
      newParentId: 'folder-1',
      reorderedSiblings: [],
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'アイテム1',
      parentId: null,
      children: [],
    });

    const result = await reorderItems(input);

    expect(result).toEqual({
      error: '自分自身または子アイテムを親にすることはできません',
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const input = {
      itemId: 'folder-1',
      newParentId: null,
      reorderedSiblings: [{ id: 'folder-1', order: 0 }],
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'アイテム1',
      parentId: null,
      children: [],
    });

    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderItems(input);

    expect(result).toEqual({
      error: 'アイテムの並び替えに失敗しました',
    });
  });

  it('兄弟要素の指定がない場合、移動先の末尾に追加される', async () => {
    const input = {
      itemId: 'folder-1',
      newParentId: 'folder-target',
      reorderedSiblings: [],
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'アイテム1',
      parentId: null,
      children: [],
    });

    (prisma.item.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: 5 },
    });

    (prisma.item.update as jest.Mock).mockResolvedValue({});

    const result = await reorderItems(input);

    expect(result).toEqual({ success: true });
    expect(prisma.item.aggregate).toHaveBeenCalledWith({
      where: { parentId: 'folder-target' },
      _max: { order: true },
    });
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: 'folder-1' },
      data: {
        parentId: 'folder-target',
        order: 6,
      },
    });
  });
});
