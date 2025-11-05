import { deleteGroup } from '../delete-group';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('deleteGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('グループを削除できる', async () => {
    const groupId = 'group-1';

    // 子グループなし
    (prisma.group.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.group.delete as jest.Mock).mockResolvedValue({
      id: groupId,
      name: 'テストグループ',
    });

    const result = await deleteGroup(groupId);

    expect(result).toEqual({ success: true });
    expect(prisma.group.findMany).toHaveBeenCalledWith({
      where: { parentId: groupId },
    });
    expect(prisma.group.delete).toHaveBeenCalledWith({
      where: { id: groupId },
    });
  });

  it('子グループが存在する場合は削除できない', async () => {
    const groupId = 'group-1';

    // 子グループあり
    (prisma.group.findMany as jest.Mock).mockResolvedValue([
      { id: 'child-1', name: '子グループ1', parentId: groupId },
      { id: 'child-2', name: '子グループ2', parentId: groupId },
    ]);

    const result = await deleteGroup(groupId);

    expect(result).toEqual({
      error: '子グループが存在するため削除できません',
    });
    expect(prisma.group.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const groupId = 'group-1';

    (prisma.group.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteGroup(groupId);

    expect(result).toEqual({
      error: 'グループの削除に失敗しました',
    });
  });

  it('削除時にエラーが発生した場合はエラーを返す', async () => {
    const groupId = 'group-1';

    (prisma.group.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.group.delete as jest.Mock).mockRejectedValue(
      new Error('Delete failed')
    );

    const result = await deleteGroup(groupId);

    expect(result).toEqual({
      error: 'グループの削除に失敗しました',
    });
  });
});
