import { createGroup } from '../create-group';
import { requireAuth, AuthError } from '@/lib/auth';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      create: jest.fn(),
    },
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

// ADMINユーザーのモック
const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: '管理者',
  role: 'ADMIN' as const,
};

describe('createGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockAdminUser);
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
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const formData = new FormData();
    formData.append('name', 'テストグループ');

    const result = await createGroup({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
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
