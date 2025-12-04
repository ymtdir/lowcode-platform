import { addPermission } from '../add-permission';
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
    group: {
      findUnique: jest.fn(),
    },
    itemPermission: {
      create: jest.fn(),
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

describe('addPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('ユーザーに権限を追加できる', async () => {
    const itemId = 'item-1';
    const userId = 'user-2';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-1',
        role: 'DEVELOPER',
      })
      .mockResolvedValueOnce({
        id: userId,
        name: 'テストユーザー',
      });

    (prisma.itemPermission.create as jest.Mock).mockResolvedValue({
      id: 'permission-1',
      itemId,
      userId,
      groupId: null,
      level: 'WRITE',
    });

    const result = await addPermission(itemId, 'user', userId, 'WRITE');

    expect(result).toEqual({ success: true });
    expect(prisma.itemPermission.create).toHaveBeenCalledWith({
      data: {
        itemId,
        userId,
        groupId: null,
        level: 'WRITE',
      },
    });
  });

  it('グループに権限を追加できる', async () => {
    const itemId = 'item-1';
    const groupId = 'group-1';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    (prisma.group.findUnique as jest.Mock).mockResolvedValue({
      id: groupId,
      name: 'テストグループ',
    });

    (prisma.itemPermission.create as jest.Mock).mockResolvedValue({
      id: 'permission-1',
      itemId,
      userId: null,
      groupId,
      level: 'READ',
    });

    const result = await addPermission(itemId, 'group', groupId, 'READ');

    expect(result).toEqual({ success: true });
    expect(prisma.itemPermission.create).toHaveBeenCalledWith({
      data: {
        itemId,
        userId: null,
        groupId,
        level: 'READ',
      },
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

    const result = await addPermission('item-1', 'user', 'user-1', 'READ');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.itemPermission.create).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await addPermission('item-1', 'user', 'user-2', 'WRITE');

    expect(result).toEqual({ error: '権限がありません' });
    expect(prisma.itemPermission.create).not.toHaveBeenCalled();
  });

  it('アイテムが見つからない場合はエラーを返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await addPermission('item-1', 'user', 'user-2', 'WRITE');

    expect(result).toEqual({ error: 'アイテムが見つかりません' });
    expect(prisma.itemPermission.create).not.toHaveBeenCalled();
  });

  it('ユーザーが見つからない場合はエラーを返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-1',
      name: 'テストアイテム',
    });

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-1',
        role: 'DEVELOPER',
      })
      .mockResolvedValueOnce(null);

    const result = await addPermission('item-1', 'user', 'user-2', 'WRITE');

    expect(result).toEqual({ error: 'ユーザーが見つかりません' });
    expect(prisma.itemPermission.create).not.toHaveBeenCalled();
  });

  it('グループが見つからない場合はエラーを返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-1',
      name: 'テストアイテム',
    });

    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await addPermission('item-1', 'group', 'group-1', 'READ');

    expect(result).toEqual({ error: 'グループが見つかりません' });
    expect(prisma.itemPermission.create).not.toHaveBeenCalled();
  });

  it('既に権限が設定されている場合はエラーを返す（ユーザー）', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-1',
      name: 'テストアイテム',
    });

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-1',
        role: 'DEVELOPER',
      })
      .mockResolvedValueOnce({
        id: 'user-2',
        name: 'テストユーザー',
      });

    (prisma.itemPermission.create as jest.Mock).mockRejectedValue({
      code: 'P2002',
    });

    const result = await addPermission('item-1', 'user', 'user-2', 'WRITE');

    expect(result).toEqual({
      error: 'このユーザーには既に権限が設定されています',
    });
  });

  it('既に権限が設定されている場合はエラーを返す（グループ）', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-1',
      name: 'テストアイテム',
    });

    (prisma.group.findUnique as jest.Mock).mockResolvedValue({
      id: 'group-1',
      name: 'テストグループ',
    });

    (prisma.itemPermission.create as jest.Mock).mockRejectedValue({
      code: 'P2002',
    });

    const result = await addPermission('item-1', 'group', 'group-1', 'READ');

    expect(result).toEqual({
      error: 'このグループには既に権限が設定されています',
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'item-1',
      name: 'テストアイテム',
    });

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: 'user-1',
        role: 'DEVELOPER',
      })
      .mockResolvedValueOnce({
        id: 'user-2',
        name: 'テストユーザー',
      });

    (prisma.itemPermission.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await addPermission('item-1', 'user', 'user-2', 'WRITE');

    expect(result).toEqual({
      error: '権限の追加に失敗しました',
    });
  });
});
