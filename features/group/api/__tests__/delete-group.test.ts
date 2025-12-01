import { deleteGroup } from '../delete-group';
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
      findMany: jest.fn(),
      delete: jest.fn(),
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

describe('deleteGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockAdminUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
    });
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

  it('認証されていない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await deleteGroup('group-1');

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'MEMBER',
    });

    const result = await deleteGroup('group-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
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
