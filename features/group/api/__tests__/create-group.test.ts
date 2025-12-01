import { createGroup } from '../create-group';
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
    group: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// ADMINユーザーのモック
const mockAdminUser = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { email: 'admin@example.com' } },
    }),
  },
};

describe('createGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockAdminUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
    });
  });

  it('グループを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストグループ');
    formData.append('description', 'テスト用のグループです');
    formData.append('parentId', '');

    (prisma.group.create as jest.Mock).mockResolvedValue({
      id: 'group-1',
      name: 'テストグループ',
      description: 'テスト用のグループです',
      parentId: null,
    });

    const result = await createGroup({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.group.create).toHaveBeenCalledWith({
      data: {
        name: 'テストグループ',
        description: 'テスト用のグループです',
        parentId: null,
      },
    });
  });

  it('親グループを指定してグループを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子グループ');
    formData.append('description', '');
    formData.append('parentId', 'parent-1');

    (prisma.group.create as jest.Mock).mockResolvedValue({
      id: 'group-2',
      name: '子グループ',
      description: null,
      parentId: 'parent-1',
    });

    const result = await createGroup({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.group.create).toHaveBeenCalledWith({
      data: {
        name: '子グループ',
        description: null,
        parentId: 'parent-1',
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

    const formData = new FormData();
    formData.append('name', 'テストグループ');

    const result = await createGroup({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'MEMBER',
    });

    const formData = new FormData();
    formData.append('name', 'テストグループ');

    const result = await createGroup({}, formData);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('グループ名が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('description', 'テスト');
    formData.append('parentId', '');

    const result = await createGroup({}, formData);

    expect(result).toEqual({
      error: 'グループ名を入力してください',
    });
    expect(prisma.group.create).not.toHaveBeenCalled();
  });

  it('グループ名が空白のみの場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '   ');
    formData.append('description', '');
    formData.append('parentId', '');

    const result = await createGroup({}, formData);

    expect(result).toEqual({
      error: 'グループ名を入力してください',
    });
    expect(prisma.group.create).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストグループ');
    formData.append('description', '');
    formData.append('parentId', '');

    (prisma.group.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createGroup({}, formData);

    expect(result).toEqual({
      error: 'グループの作成に失敗しました',
    });
  });
});
