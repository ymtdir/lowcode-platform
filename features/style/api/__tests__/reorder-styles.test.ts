import { reorderStyles } from '../reorder-styles';
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
      update: jest.fn(),
    },
    $transaction: jest.fn(),
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

describe('reorderStyles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('スタイルの並び順を更新できる', async () => {
    const itemId = 'item-1';
    const styleIds = ['style-3', 'style-1', 'style-2'];

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'style-3', order: 0 },
      { id: 'style-1', order: 1 },
      { id: 'style-2', order: 2 },
    ]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('空の配列でも成功する', async () => {
    const itemId = 'item-1';
    const styleIds: string[] = [];

    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalledWith([]);
  });

  it('単一のスタイルでも並び替えできる', async () => {
    const itemId = 'item-1';
    const styleIds = ['style-1'];

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'style-1', order: 0 },
    ]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('認証されていない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ error: 'スタイルの並び替えに失敗しました' });
  });

  it('ADMINロールでもスタイルを並び替えできる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'style-1', order: 0 },
      { id: 'style-2', order: 1 },
    ]);

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ success: true });
  });
});
