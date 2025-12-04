import { getPermissions } from '../get-permissions';
import { createClient } from '@/lib/supabase/server';

// Supabaseクライアントをモック化
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    itemPermission: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// DEVELOPERユーザーのモック
const mockDeveloperUser = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { email: 'developer@example.com' } },
    }),
  },
};

describe('getPermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('権限一覧を取得できる', async () => {
    const itemId = 'item-1';
    const mockPermissions = [
      {
        id: 'permission-1',
        itemId,
        userId: 'user-2',
        groupId: null,
        level: 'WRITE',
        user: {
          id: 'user-2',
          name: 'テストユーザー',
          email: 'test@example.com',
        },
        group: null,
      },
      {
        id: 'permission-2',
        itemId,
        userId: null,
        groupId: 'group-1',
        level: 'READ',
        user: null,
        group: {
          id: 'group-1',
          name: 'テストグループ',
          description: 'テストグループの説明',
        },
      },
    ];

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    (prisma.itemPermission.findMany as jest.Mock).mockResolvedValue(
      mockPermissions
    );

    const result = await getPermissions(itemId);

    expect(result).toEqual({
      success: true,
      permissions: mockPermissions,
    });
    expect(prisma.item.findUnique).toHaveBeenCalledWith({
      where: { id: itemId },
    });
    expect(prisma.itemPermission.findMany).toHaveBeenCalledWith({
      where: { itemId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('権限がない場合は空配列を返す', async () => {
    const itemId = 'item-1';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    (prisma.itemPermission.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getPermissions(itemId);

    expect(result).toEqual({
      success: true,
      permissions: [],
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await getPermissions('item-1');

    expect(result).toEqual({ error: '認証が必要です', permissions: [] });
    expect(prisma.itemPermission.findMany).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await getPermissions('item-1');

    expect(result).toEqual({ error: '権限がありません', permissions: [] });
    expect(prisma.itemPermission.findMany).not.toHaveBeenCalled();
  });

  it('アイテムが見つからない場合はエラーを返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getPermissions('item-1');

    expect(result).toEqual({
      error: 'アイテムが見つかりません',
      permissions: [],
    });
    expect(prisma.itemPermission.findMany).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-1',
      name: 'テストアイテム',
    });

    (prisma.itemPermission.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await getPermissions('item-1');

    expect(result).toEqual({
      error: '権限の取得に失敗しました',
      permissions: [],
    });
  });
});
