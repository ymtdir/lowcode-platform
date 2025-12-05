import { updatePermission } from '../update-permission';
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
    itemPermission: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// DEVELOPERユーザーのモック
const mockDeveloperUser = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { email: 'developer@example.com' } },
    }),
  },
};

describe('updatePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('権限レベルを更新できる', async () => {
    const permissionId = 'permission-1';

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      id: permissionId,
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'READ',
    });

    (prisma.itemPermission.update as jest.Mock).mockResolvedValue({
      id: permissionId,
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'WRITE',
    });

    const result = await updatePermission(permissionId, 'WRITE');

    expect(result).toEqual({ success: true });
    expect(prisma.itemPermission.update).toHaveBeenCalledWith({
      where: { id: permissionId },
      data: { level: 'WRITE' },
    });
  });

  it('READ から NONE に変更できる', async () => {
    const permissionId = 'permission-1';

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      id: permissionId,
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'READ',
    });

    (prisma.itemPermission.update as jest.Mock).mockResolvedValue({
      id: permissionId,
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'NONE',
    });

    const result = await updatePermission(permissionId, 'NONE');

    expect(result).toEqual({ success: true });
    expect(prisma.itemPermission.update).toHaveBeenCalledWith({
      where: { id: permissionId },
      data: { level: 'NONE' },
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

    const result = await updatePermission('permission-1', 'WRITE');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.itemPermission.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await updatePermission('permission-1', 'WRITE');

    expect(result).toEqual({ error: '権限がありません' });
    expect(prisma.itemPermission.update).not.toHaveBeenCalled();
  });

  it('権限が見つからない場合はエラーを返す', async () => {
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updatePermission('permission-1', 'WRITE');

    expect(result).toEqual({ error: '権限が見つかりません' });
    expect(prisma.itemPermission.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      id: 'permission-1',
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'READ',
    });

    (prisma.itemPermission.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updatePermission('permission-1', 'WRITE');

    expect(result).toEqual({
      error: '権限の更新に失敗しました',
    });
  });
});
