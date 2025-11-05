import { removeMembers } from '../remove-members';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    groupMember: {
      deleteMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('removeMembers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
