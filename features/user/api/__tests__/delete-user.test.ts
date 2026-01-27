import { deleteUser } from '../delete-user';
import { requireAuth, AuthError } from '@/lib/auth';

// lib/authをモック化
jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth');
  return {
    ...actual,
    requireAuth: jest.fn(),
  };
});

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

const mockAdminUser = {
  id: 'current-user',
  email: 'admin@example.com',
  name: '管理者',
  role: 'ADMIN' as const,
};

describe('deleteUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  it('ユーザーを削除できる', async () => {
    const userId = 'user-1';

    (prisma.user.delete as jest.Mock).mockResolvedValue({
      id: userId,
    });

    const result = await deleteUser(userId);

    expect(result).toEqual({ success: true });
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('認証エラーの場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await deleteUser('user-1');

    expect(result).toEqual({
      error: '認証エラーが発生しました',
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      role: 'MEMBER',
    });

    const result = await deleteUser('user-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('自分自身を削除しようとするとエラーを返す', async () => {
    const userId = 'current-user';

    const result = await deleteUser(userId);

    expect(result).toEqual({
      error: '自分自身を削除することはできません',
    });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('Prisma でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';

    (prisma.user.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteUser(userId);

    expect(result).toEqual({
      error: 'ユーザーの削除に失敗しました',
    });
  });
});
