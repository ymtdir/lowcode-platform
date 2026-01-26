import { createScript } from '../create-script';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    script: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'DEVELOPER',
};

describe('createScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
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
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const result = await createScript('item-1', { name: 'test.js' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.script.create).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
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
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
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
