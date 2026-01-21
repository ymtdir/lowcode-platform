import { createStyle } from '../create-style';
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
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
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

describe('createStyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('スタイルを作成できる', async () => {
    const itemId = 'item-1';
    const input = { name: 'test.css', content: 'body {}' };

    (prisma.style.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: 0 },
    });

    (prisma.style.create as jest.Mock).mockResolvedValue({
      id: 'style-1',
      name: 'test.css',
      content: 'body {}',
      order: 1,
    });

    const result = await createStyle(itemId, input);

    expect(result).toEqual({
      success: true,
      style: {
        id: 'style-1',
        name: 'test.css',
        content: 'body {}',
        order: 1,
      },
    });
    expect(prisma.style.create).toHaveBeenCalledWith({
      data: {
        itemId,
        name: 'test.css',
        content: 'body {}',
        order: 1,
      },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('最初のスタイルはorder 0で作成される', async () => {
    const itemId = 'item-1';
    const input = { name: 'first.css' };

    (prisma.style.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.style.create as jest.Mock).mockResolvedValue({
      id: 'style-1',
      name: 'first.css',
      content: '',
      order: 0,
    });

    const result = await createStyle(itemId, input);

    expect(result.success).toBe(true);
    expect(prisma.style.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          order: 0,
        }),
      })
    );
  });

  it('contentが未指定の場合は空文字列で作成される', async () => {
    const itemId = 'item-1';
    const input = { name: 'empty.css' };

    (prisma.style.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.style.create as jest.Mock).mockResolvedValue({
      id: 'style-1',
      name: 'empty.css',
      content: '',
      order: 0,
    });

    await createStyle(itemId, input);

    expect(prisma.style.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          content: '',
        }),
      })
    );
  });

  it('認証されていない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await createStyle('item-1', { name: 'test.css' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.style.create).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await createStyle('item-1', { name: 'test.css' });

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.style.create).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await createStyle('item-1', { name: 'test.css' });

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.style.create).not.toHaveBeenCalled();
  });

  it('スタイル名が空の場合はエラーを返す', async () => {
    const result = await createStyle('item-1', { name: '' });

    expect(result).toEqual({ error: 'スタイル名を入力してください' });
    expect(prisma.style.create).not.toHaveBeenCalled();
  });

  it('スタイル名が空白のみの場合はエラーを返す', async () => {
    const result = await createStyle('item-1', { name: '   ' });

    expect(result).toEqual({ error: 'スタイル名を入力してください' });
    expect(prisma.style.create).not.toHaveBeenCalled();
  });

  it('スタイル名の前後の空白はトリムされる', async () => {
    const itemId = 'item-1';
    const input = { name: '  trimmed.css  ' };

    (prisma.style.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.style.create as jest.Mock).mockResolvedValue({
      id: 'style-1',
      name: 'trimmed.css',
      content: '',
      order: 0,
    });

    await createStyle(itemId, input);

    expect(prisma.style.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'trimmed.css',
        }),
      })
    );
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.style.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.style.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createStyle('item-1', { name: 'test.css' });

    expect(result).toEqual({ error: 'スタイルの作成に失敗しました' });
  });

  it('ADMINロールでもスタイルを作成できる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    (prisma.style.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.style.create as jest.Mock).mockResolvedValue({
      id: 'style-1',
      name: 'admin.css',
      content: '',
      order: 0,
    });

    const result = await createStyle('item-1', { name: 'admin.css' });

    expect(result.success).toBe(true);
  });
});
