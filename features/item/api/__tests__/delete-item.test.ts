import { deleteItem } from '../delete-item';
import { createClient } from '@/lib/supabase/server';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

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
    item: {
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

describe('deleteItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'DEVELOPER',
    });
  });

  it('アイテムを削除できる', async () => {
    const itemId = 'folder-1';

    (prisma.item.delete as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    const result = await deleteItem(itemId);

    expect(result).toEqual({ success: true });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: itemId },
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

    const result = await deleteItem('folder-1');

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'MEMBER',
    });

    const result = await deleteItem('folder-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('ADMIN権限でも削除できる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
    });

    (prisma.item.delete as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'テストアイテム',
    });

    const result = await deleteItem('folder-1');

    expect(result).toEqual({ success: true });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'folder-1';

    (prisma.item.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteItem(itemId);

    expect(result).toEqual({
      error: 'アイテムの削除に失敗しました',
    });
  });
});
