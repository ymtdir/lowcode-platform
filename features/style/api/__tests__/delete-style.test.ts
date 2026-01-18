import { deleteStyle } from '../delete-style';
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
    style: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
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

describe('deleteStyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('スタイルを削除できる', async () => {
    const styleId = 'style-1';

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.delete as jest.Mock).mockResolvedValue({
      id: styleId,
    });

    const result = await deleteStyle(styleId);

    expect(result).toEqual({ success: true });
    expect(prisma.style.delete).toHaveBeenCalledWith({
      where: { id: styleId },
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

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('スタイルが存在しない場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await deleteStyle('non-existent');

    expect(result).toEqual({ error: 'スタイルが存在しません' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: 'スタイルの削除に失敗しました' });
  });

  it('ADMINロールでもスタイルを削除できる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.delete as jest.Mock).mockResolvedValue({
      id: 'style-1',
    });

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ success: true });
  });
});
