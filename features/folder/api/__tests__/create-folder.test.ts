import { createFolder } from '../create-folder';

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
    folder: {
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

  it('フォルダを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
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

    (prisma.folder.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.folder.create as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'テストフォルダ',
      parentId: null,
      createdById: 'user-1',
      order: 0,
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.folder.create).toHaveBeenCalledWith({
      data: {
        name: 'テストフォルダ',
        parentId: null,
        createdById: 'user-1',
        order: 0,
      },
    });
  });

  it('親フォルダを指定してフォルダを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子フォルダ');
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

    (prisma.folder.findFirst as jest.Mock)
      .mockResolvedValueOnce(null) // 既存フォルダチェック
      .mockResolvedValueOnce({ order: 2 }); // 最大order値

    (prisma.folder.create as jest.Mock).mockResolvedValue({
      id: 'folder-2',
      name: '子フォルダ',
      parentId: 'parent-1',
      createdById: 'user-1',
      order: 3,
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.folder.create).toHaveBeenCalledWith({
      data: {
        name: '子フォルダ',
        parentId: 'parent-1',
        createdById: 'user-1',
        order: 3,
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', '');

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.folder.create).not.toHaveBeenCalled();
  });

  it('フォルダ名が空の場合はエラーを返す', async () => {
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

    const result = await createFolder({}, formData);

    expect(result).toEqual({
      error: 'ワークスペース名を入力してください',
    });
    expect(prisma.folder.create).not.toHaveBeenCalled();
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

    const result = await createFolder({}, formData);

    expect(result).toEqual({
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    });
    expect(prisma.folder.create).not.toHaveBeenCalled();
  });

  it('同じ名前のフォルダが既に存在する場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '既存フォルダ');
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

    (prisma.folder.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing-folder',
      name: '既存フォルダ',
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({
      error: 'この名前のワークスペースは既に存在します',
    });
    expect(prisma.folder.create).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
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

    (prisma.folder.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.folder.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createFolder({}, formData);

    expect(result).toEqual({
      error: 'ワークスペースの作成に失敗しました',
    });
  });
});
