import { deleteUser } from '../delete-user';

// モック関数を定義
const mockGetUser = jest.fn();
const mockDeleteUser = jest.fn();

// Supabase Server Clientをモック化
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Supabase Admin Clientをモック化
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        deleteUser: mockDeleteUser,
      },
    },
  })),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'current-user', email: 'admin@example.com' },
      },
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
    });
  });

  it('ユーザーを削除できる', async () => {
    const userId = 'user-1';

    mockDeleteUser.mockResolvedValue({
      error: null,
    });

    (prisma.user.delete as jest.Mock).mockResolvedValue({
      id: userId,
    });

    const result = await deleteUser(userId);

    expect(result).toEqual({ success: true });
    expect(mockDeleteUser).toHaveBeenCalledWith(userId);
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('認証エラーの場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const result = await deleteUser('user-1');

    expect(result).toEqual({
      error: '認証エラーが発生しました',
    });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'MEMBER',
    });

    const result = await deleteUser('user-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('自分自身を削除しようとするとエラーを返す', async () => {
    const userId = 'current-user';

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId, email: 'admin@example.com' },
      },
    });

    const result = await deleteUser(userId);

    expect(result).toEqual({
      error: '自分自身を削除することはできません',
    });
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('Supabase Auth でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';

    mockDeleteUser.mockResolvedValue({
      error: { message: 'Delete failed' },
    });

    const result = await deleteUser(userId);

    expect(result).toEqual({
      error: 'ユーザーの削除に失敗しました',
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('Prisma でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';

    mockDeleteUser.mockResolvedValue({
      error: null,
    });

    (prisma.user.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteUser(userId);

    expect(result).toEqual({
      error: 'ユーザーの削除に失敗しました',
    });
  });
});
