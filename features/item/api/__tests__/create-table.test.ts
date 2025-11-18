import { createTable } from '../create-table';

// next/cacheをモック化
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

describe('createTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TABLEタイプのアイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストテーブル');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { email: 'test@example.com' },
          },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
      name: 'テストテーブル',
      parentId: null,
      createdById: 'user-1',
      order: 0,
    });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'TABLE',
        name: 'テストテーブル',
        parentId: null,
        createdById: 'user-1',
        order: 0,
        meta: null,
      },
    });
  });

  it('親フォルダを指定してTABLEを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子テーブル');
    formData.append('parentId', 'parent-1');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { email: 'test@example.com' },
          },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({ order: 2 });

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'table-2',
      type: 'TABLE',
      name: '子テーブル',
      parentId: 'parent-1',
      createdById: 'user-1',
      order: 3,
    });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'TABLE',
        name: '子テーブル',
        parentId: 'parent-1',
        createdById: 'user-1',
        order: 3,
        meta: null,
      },
    });
  });

  it('typeがTABLEに設定される', async () => {
    const formData = new FormData();
    formData.append('name', 'テーブル確認');
    formData.append('parentId', '');
    // typeを明示的に設定しても上書きされる
    formData.append('type', 'FOLDER');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { email: 'test@example.com' },
          },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'table-3',
      type: 'TABLE',
      name: 'テーブル確認',
    });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });
    // typeがTABLEになっていることを確認
    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'TABLE',
        }),
      })
    );
  });
});
