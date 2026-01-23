import { createScript } from '../create-script';
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

describe('createScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('スクリプトを作成できる', async () => {
    const itemId = 'item-1';
    const input = { name: 'test.js', content: 'console.log("test")' };

    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: 0 },
    });

    (prisma.script.create as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'test.js',
      content: 'console.log("test")',
      order: 1,
    });

    const result = await createScript(itemId, input);

    expect(result).toEqual({
      success: true,
      script: {
        id: 'script-1',
        name: 'test.js',
        content: 'console.log("test")',
        order: 1,
      },
    });
    expect(prisma.script.create).toHaveBeenCalledWith({
      data: {
        itemId,
        name: 'test.js',
        content: 'console.log("test")',
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

  it('最初のスクリプトはorder 0で作成される', async () => {
    const itemId = 'item-1';
    const input = { name: 'first.js' };

    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.script.create as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'first.js',
      content: '',
      order: 0,
    });

    const result = await createScript(itemId, input);

    expect(result.success).toBe(true);
    expect(prisma.script.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          order: 0,
        }),
      })
    );
  });

  it('contentが未指定の場合は空文字列で作成される', async () => {
    const itemId = 'item-1';
    const input = { name: 'empty.js' };

    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.script.create as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'empty.js',
      content: '',
      order: 0,
    });

    await createScript(itemId, input);

    expect(prisma.script.create).toHaveBeenCalledWith(
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

    const result = await createScript('item-1', { name: 'test.js' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.script.create).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await createScript('item-1', { name: 'test.js' });

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.script.create).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await createScript('item-1', { name: 'test.js' });

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.script.create).not.toHaveBeenCalled();
  });

  it('スクリプト名が空の場合はエラーを返す', async () => {
    const result = await createScript('item-1', { name: '' });

    expect(result).toEqual({ error: 'スクリプト名を入力してください' });
    expect(prisma.script.create).not.toHaveBeenCalled();
  });

  it('スクリプト名が空白のみの場合はエラーを返す', async () => {
    const result = await createScript('item-1', { name: '   ' });

    expect(result).toEqual({ error: 'スクリプト名を入力してください' });
    expect(prisma.script.create).not.toHaveBeenCalled();
  });

  it('スクリプト名の前後の空白はトリムされる', async () => {
    const itemId = 'item-1';
    const input = { name: '  trimmed.js  ' };

    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.script.create as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'trimmed.js',
      content: '',
      order: 0,
    });

    await createScript(itemId, input);

    expect(prisma.script.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'trimmed.js',
        }),
      })
    );
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.script.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createScript('item-1', { name: 'test.js' });

    expect(result).toEqual({ error: 'スクリプトの作成に失敗しました' });
  });

  it('ADMINロールでもスクリプトを作成できる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.script.create as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'admin.js',
      content: '',
      order: 0,
    });

    const result = await createScript('item-1', { name: 'admin.js' });

    expect(result.success).toBe(true);
  });

  it('グローバルスクリプト（itemId=null）を作成できる', async () => {
    (prisma.script.aggregate as jest.Mock).mockResolvedValue({
      _max: { order: null },
    });

    (prisma.script.create as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'global.js',
      content: '',
      order: 0,
    });

    const result = await createScript(null, { name: 'global.js' });

    expect(result.success).toBe(true);
    expect(prisma.script.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          itemId: null,
        }),
      })
    );
  });
});
