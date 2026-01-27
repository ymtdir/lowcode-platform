import { addMembers } from '../add-members';
import { requireAuth, AuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    groupMember: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// ADMINユーザーのモック
const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: '管理者',
  role: 'ADMIN' as const,
};

describe('addMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  it('新しいメンバーを追加できる', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1', 'user-2'];

    // 既存メンバーなし
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

    // トランザクション成功
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'member-1', userId: 'user-1', groupId },
      { id: 'member-2', userId: 'user-2', groupId },
    ]);

    const result = await addMembers(groupId, userIds);

    expect(result).toEqual({
      success: true,
      successCount: 2,
    });
    expect(prisma.groupMember.findMany).toHaveBeenCalledWith({
      where: { groupId, userId: { in: userIds } },
      select: { userId: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await addMembers('group-1', ['user-1']);

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      role: 'MEMBER',
    });

    const result = await addMembers('group-1', ['user-1']);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('空の配列を渡すとエラーを返す', async () => {
    const result = await addMembers('group-1', []);

    expect(result).toEqual({ error: 'ユーザーが選択されていません' });
  });

  it('すべてのユーザーが既にメンバーの場合はエラーを返す', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1', 'user-2'];

    // 全員既存メンバー
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
      { userId: 'user-2' },
    ]);

    const result = await addMembers(groupId, userIds);

    expect(result).toEqual({
      error: 'すべてのユーザーは既にメンバーです',
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('一部のユーザーが既にメンバーの場合は新しいユーザーのみ追加する', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1', 'user-2', 'user-3'];

    // user-1は既存メンバー
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
    ]);

    // user-2, user-3を追加
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'member-2', userId: 'user-2', groupId },
      { id: 'member-3', userId: 'user-3', groupId },
    ]);

    const result = await addMembers(groupId, userIds);

    expect(result).toEqual({
      success: true,
      successCount: 2,
      errorCount: 1,
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1'];

    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await addMembers(groupId, userIds);

    expect(result).toEqual({
      error: 'メンバーの追加に失敗しました',
    });
  });
});
