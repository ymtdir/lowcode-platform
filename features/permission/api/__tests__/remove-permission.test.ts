import { removePermission } from '../remove-permission';
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
      delete: jest.fn(),
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

describe('removePermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('権限を削除できる', async () => {
    const permissionId = 'permission-1';

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      id: permissionId,
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'WRITE',
    });

    (prisma.itemPermission.delete as jest.Mock).mockResolvedValue({
      id: permissionId,
    });

    const result = await removePermission(permissionId);

    expect(result).toEqual({ success: true });
    expect(prisma.itemPermission.delete).toHaveBeenCalledWith({
      where: { id: permissionId },
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

    const result = await removePermission('permission-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.itemPermission.delete).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await removePermission('permission-1');

    expect(result).toEqual({ error: '権限がありません' });
    expect(prisma.itemPermission.delete).not.toHaveBeenCalled();
  });

  it('権限が見つからない場合はエラーを返す', async () => {
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await removePermission('permission-1');

    expect(result).toEqual({ error: '権限が見つかりません' });
    expect(prisma.itemPermission.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      id: 'permission-1',
      itemId: 'item-1',
      userId: 'user-2',
      groupId: null,
      level: 'WRITE',
    });

    (prisma.itemPermission.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await removePermission('permission-1');

    expect(result).toEqual({
      error: '権限の削除に失敗しました',
    });
  });
});
