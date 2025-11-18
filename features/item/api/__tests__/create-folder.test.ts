import { createFolder } from '../create-folder';

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

describe('createFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('FOLDERタイプのアイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1' },
          },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null); // アイテムが存在しない場合

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      type: 'FOLDER',
      name: 'テストフォルダ',
      parentId: null,
      createdById: 'user-1',
      order: 0,
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'FOLDER',
        name: 'テストフォルダ',
        parentId: null,
        createdById: 'user-1',
        order: 0,
        meta: null,
      },
    });
  });

  it('親フォルダを指定してFOLDERを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子フォルダ');
    formData.append('parentId', 'parent-1');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1' },
          },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({ order: 2 });

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-2',
      type: 'FOLDER',
      name: '子フォルダ',
      parentId: 'parent-1',
      createdById: 'user-1',
      order: 3,
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'FOLDER',
        name: '子フォルダ',
        parentId: 'parent-1',
        createdById: 'user-1',
        order: 3,
        meta: null,
      },
    });
  });

  it('typeがFOLDERに設定される', async () => {
    const formData = new FormData();
    formData.append('name', 'フォルダ確認');
    formData.append('parentId', '');
    // typeを明示的に設定しても上書きされる
    formData.append('type', 'TABLE');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1' },
          },
        }),
      },
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-3',
      type: 'FOLDER',
      name: 'フォルダ確認',
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    // typeがFOLDERになっていることを確認
    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'FOLDER',
        }),
      })
    );
  });
});
