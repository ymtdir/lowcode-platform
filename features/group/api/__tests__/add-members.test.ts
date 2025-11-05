import { addMembers } from '../add-members';

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

import { prisma } from '@/lib/prisma';

describe('addMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('空の配列を渡すとエラーを返す', async () => {
    const result = await addMembers('group-1', []);

    expect(result).toEqual({
      error: 'ユーザーが選択されていません',
    });
    expect(prisma.groupMember.findMany).not.toHaveBeenCalled();
  });

  it('既存メンバーをスキップして新規メンバーのみ追加', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1', 'user-2', 'user-3'];

    // user-1は既存メンバー
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
    ]);

    // user-2, user-3のみ追加
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

  it('すべてのユーザーが既にメンバーの場合はエラーを返す', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1', 'user-2'];

    // すべて既存メンバー
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

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const groupId = 'group-1';
    const userIds = ['user-1'];

    (prisma.groupMember.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await addMembers(groupId, userIds);

    expect(result).toEqual({
      error: 'メンバーの追加に失敗しました',
    });
  });
});
