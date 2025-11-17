import { createItem } from '../create-item';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

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
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('createItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('アイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'テストアイテム',
      parentId: null,
      createdById: 'user-1',
      order: 0,
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        name: 'テストアイテム',
        parentId: null,
        createdById: 'user-1',
        order: 0,
      },
    });
  });

  it('親アイテムを指定してアイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子アイテム');
    formData.append('parentId', 'parent-1');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock)
      .mockResolvedValueOnce(null) // 既存アイテムチェック
      .mockResolvedValueOnce({ order: 2 }); // 最大order値

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-2',
      name: '子アイテム',
      parentId: 'parent-1',
      createdById: 'user-1',
      order: 3,
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        name: '子アイテム',
        parentId: 'parent-1',
        createdById: 'user-1',
        order: 3,
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('アイテム名が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: 'ワークスペース名を入力してください',
    });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('使用できない文字が含まれている場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'test/folder');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('同じ名前のアイテムが既に存在する場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '既存アイテム');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-folder',
      name: '既存アイテム',
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: 'この名前のワークスペースは既に存在します',
    });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { email: 'test@example.com' } },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: 'ワークスペースの作成に失敗しました',
    });
  });
});
