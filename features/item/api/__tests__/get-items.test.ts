import { getItems } from '../get-items';

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
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    itemPermission: {
      findUnique: jest.fn(),
    },
    groupMember: {
      findMany: jest.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('getItems', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトでADMINユーザーを設定
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'admin@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    // 権限チェック用のデフォルトモック（ADMIN権限なので常にアクセス可能）
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);
  });

  it('ルートアイテムを取得できる', async () => {
    const mockRootFolders = [{ id: 'folder-1' }, { id: 'folder-2' }];

    const mockItem1 = {
      id: 'folder-1',
      name: 'アイテム1',
      parentId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
      children: [],
      _count: {
        children: 0,
      },
    };

    const mockItem2 = {
      id: 'folder-2',
      name: 'アイテム2',
      parentId: null,
      order: 1,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      createdById: 'user-1',
      children: [],
      _count: {
        children: 0,
      },
    };

    (prisma.item.findMany as jest.Mock).mockResolvedValue(mockRootFolders);
    (prisma.item.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockItem1)
      .mockResolvedValueOnce(mockItem2);

    const result = await getItems();

    expect(result).toEqual([mockItem1, mockItem2]);
    expect(prisma.item.findMany).toHaveBeenCalledWith({
      where: {
        parentId: null,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
      },
    });
  });

  it('子アイテムを含むルートアイテムを取得できる', async () => {
    const mockRootFolders = [{ id: 'folder-1' }];

    const mockChildFolder = {
      id: 'child-1',
      name: '子アイテム',
      parentId: 'folder-1',
      order: 0,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      createdById: 'user-1',
      children: [],
      _count: {
        children: 0,
      },
    };

    const mockItem1WithChildren = {
      id: 'folder-1',
      name: 'アイテム1',
      parentId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
      children: [mockChildFolder],
      _count: {
        children: 1,
      },
    };

    (prisma.item.findMany as jest.Mock).mockResolvedValue(mockRootFolders);
    (prisma.item.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockItem1WithChildren)
      .mockResolvedValueOnce(mockChildFolder);

    const result = await getItems();

    expect(result).toHaveLength(1);
    expect(result[0]?.children).toHaveLength(1);
    expect(result[0]?.children?.[0]?.id).toBe('child-1');
  });

  it('ルートアイテムが存在しない場合は空配列を返す', async () => {
    (prisma.item.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getItems();

    expect(result).toEqual([]);
  });
});
