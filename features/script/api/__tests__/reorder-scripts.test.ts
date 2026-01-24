import { reorderScripts } from '../reorder-scripts';
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
    script: {
      update: jest.fn(),
      findMany: jest.fn(),
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

describe('reorderScripts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('スクリプトの並び順を更新できる', async () => {
    const itemId = 'item-1';
    const scriptIds = ['script-3', 'script-1', 'script-2'];

    // バリデーション用のmock: すべてのIDが見つかったとする
    (prisma.script.findMany as jest.Mock).mockResolvedValue([
      { id: 'script-3' },
      { id: 'script-1' },
      { id: 'script-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'script-3', order: 0 },
      { id: 'script-1', order: 1 },
      { id: 'script-2', order: 2 },
    ]);

    const result = await reorderScripts(itemId, scriptIds);

    expect(result).toEqual({ success: true });
    expect(prisma.script.findMany).toHaveBeenCalledWith({
      where: { id: { in: scriptIds }, itemId },
      select: { id: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('空の配列でも成功する', async () => {
    const itemId = 'item-1';
    const scriptIds: string[] = [];

    // バリデーション用のmock: 空配列が返る
    (prisma.script.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const result = await reorderScripts(itemId, scriptIds);

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalledWith([]);
  });

  it('単一のスクリプトでも並び替えできる', async () => {
    const itemId = 'item-1';
    const scriptIds = ['script-1'];

    (prisma.script.findMany as jest.Mock).mockResolvedValue([
      { id: 'script-1' },
    ]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'script-1', order: 0 },
    ]);

    const result = await reorderScripts(itemId, scriptIds);

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

    const result = await reorderScripts('item-1', ['script-1', 'script-2']);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderScripts('item-1', ['script-1', 'script-2']);

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await reorderScripts('item-1', ['script-1', 'script-2']);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('無効なスクリプトIDが含まれている場合はエラーを返す', async () => {
    const itemId = 'item-1';
    const scriptIds = ['script-1', 'invalid-script'];

    // バリデーション用のmock: 1つしか見つからない
    (prisma.script.findMany as jest.Mock).mockResolvedValue([
      { id: 'script-1' },
    ]);

    const result = await reorderScripts(itemId, scriptIds);

    expect(result).toEqual({ error: '無効なスクリプトIDが含まれています' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'item-1';
    const scriptIds = ['script-1', 'script-2'];

    (prisma.script.findMany as jest.Mock).mockResolvedValue([
      { id: 'script-1' },
      { id: 'script-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderScripts(itemId, scriptIds);

    expect(result).toEqual({ error: 'スクリプトの並び替えに失敗しました' });
  });

  it('ADMINロールでもスクリプトを並び替えできる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    const scriptIds = ['script-1', 'script-2'];
    (prisma.script.findMany as jest.Mock).mockResolvedValue([
      { id: 'script-1' },
      { id: 'script-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'script-1', order: 0 },
      { id: 'script-2', order: 1 },
    ]);

    const result = await reorderScripts('item-1', scriptIds);

    expect(result).toEqual({ success: true });
  });

  it('グローバルスクリプト（itemId=null）の並び替えもできる', async () => {
    const scriptIds = ['script-1', 'script-2'];

    (prisma.script.findMany as jest.Mock).mockResolvedValue([
      { id: 'script-1' },
      { id: 'script-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'script-1', order: 0 },
      { id: 'script-2', order: 1 },
    ]);

    const result = await reorderScripts(null, scriptIds);

    expect(result).toEqual({ success: true });
    expect(prisma.script.findMany).toHaveBeenCalledWith({
      where: { id: { in: scriptIds }, itemId: null },
      select: { id: true },
    });
  });
});
