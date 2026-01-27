import { removeMembers } from '../remove-members';
import { requireAuth, AuthError } from '@/lib/auth';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    groupMember: {
      deleteMany: jest.fn(),
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

describe('removeMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  it('メンバーを削除できる', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1', 'user-2'];

    (prisma.groupMember.deleteMany as jest.Mock).mockResolvedValue({
      count: 2,
    });

    const result = await removeMembers(groupId, userIds);

    expect(result).toEqual({
      success: true,
      successCount: 2,
    });
    expect(prisma.groupMember.deleteMany).toHaveBeenCalledWith({
      where: {
        groupId,
        userId: { in: userIds },
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await removeMembers('group-1', ['user-1']);

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      role: 'MEMBER',
    });

    const result = await removeMembers('group-1', ['user-1']);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('空の配列を渡すとエラーを返す', async () => {
    const result = await removeMembers('group-1', []);

    expect(result).toEqual({
      error: 'ユーザーが選択されていません',
    });
    expect(prisma.groupMember.deleteMany).not.toHaveBeenCalled();
  });

  it('削除対象が存在しない場合は0件削除', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1'];

    (prisma.groupMember.deleteMany as jest.Mock).mockResolvedValue({
      count: 0,
    });

    const result = await removeMembers(groupId, userIds);

    expect(result).toEqual({
      success: true,
      successCount: 0,
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1'];

    (prisma.groupMember.deleteMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await removeMembers(groupId, userIds);

    expect(result).toEqual({
      error: 'メンバーの削除に失敗しました',
    });
  });
});
