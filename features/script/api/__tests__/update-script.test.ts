import { updateScript } from '../update-script';
import { requireAuth, AuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    script: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth');
  return {
    ...actual,
    requireAuth: jest.fn(),
  };
});

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'DEVELOPER',
};

describe('updateScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('スクリプトの名前を更新できる', async () => {
    const scriptId = 'script-1';
    const input = { name: 'updated.js' };

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: scriptId,
      name: 'updated.js',
      content: 'console.log("test")',
      order: 0,
    });

    const result = await updateScript(scriptId, input);

    expect(result).toEqual({
      success: true,
      script: {
        id: scriptId,
        name: 'updated.js',
        content: 'console.log("test")',
        order: 0,
      },
    });
    expect(prisma.script.update).toHaveBeenCalledWith({
      where: { id: scriptId },
      data: { name: 'updated.js' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('スクリプトのcontentを更新できる', async () => {
    const scriptId = 'script-1';
    const input = { content: 'console.log("updated")' };

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: scriptId,
      name: 'test.js',
      content: 'console.log("updated")',
      order: 0,
    });

    const result = await updateScript(scriptId, input);

    expect(result).toEqual({
      success: true,
      script: {
        id: scriptId,
        name: 'test.js',
        content: 'console.log("updated")',
        order: 0,
      },
    });
    expect(prisma.script.update).toHaveBeenCalledWith({
      where: { id: scriptId },
      data: { content: 'console.log("updated")' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('nameとcontentを同時に更新できる', async () => {
    const scriptId = 'script-1';
    const input = { name: 'new-name.js', content: 'console.log("new")' };

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: scriptId,
      name: 'new-name.js',
      content: 'console.log("new")',
      order: 0,
    });

    const result = await updateScript(scriptId, input);

    expect(result.success).toBe(true);
    expect(prisma.script.update).toHaveBeenCalledWith({
      where: { id: scriptId },
      data: { name: 'new-name.js', content: 'console.log("new")' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await updateScript('script-1', { name: 'test.js' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    const result = await updateScript('script-1', { name: 'test.js' });

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('スクリプトが見つからない場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateScript('non-existent', { name: 'test.js' });

    expect(result).toEqual({ error: 'スクリプトが見つかりません' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('スクリプト名が空文字の場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    const result = await updateScript('script-1', { name: '' });

    expect(result).toEqual({ error: 'スクリプト名を入力してください' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('スクリプト名が空白のみの場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    const result = await updateScript('script-1', { name: '   ' });

    expect(result).toEqual({ error: 'スクリプト名を入力してください' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('スクリプト名の前後の空白はトリムされる', async () => {
    const scriptId = 'script-1';
    const input = { name: '  trimmed.js  ' };

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: scriptId,
      name: 'trimmed.js',
      content: '',
      order: 0,
    });

    await updateScript(scriptId, input);

    expect(prisma.script.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'trimmed.js' },
      })
    );
  });

  it('contentを空文字列に更新できる', async () => {
    const scriptId = 'script-1';
    const input = { content: '' };

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: scriptId,
      name: 'test.js',
      content: '',
      order: 0,
    });

    const result = await updateScript(scriptId, input);

    expect(result.success).toBe(true);
    expect(prisma.script.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { content: '' },
      })
    );
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateScript('script-1', { name: 'test.js' });

    expect(result).toEqual({ error: 'スクリプトの更新に失敗しました' });
  });

  it('ADMINロールでもスクリプトを更新できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'ADMIN',
    });

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: 'script-1',
      name: 'admin.js',
      content: '',
      order: 0,
    });

    const result = await updateScript('script-1', { name: 'admin.js' });

    expect(result.success).toBe(true);
  });

  it('グローバルスクリプト（itemId: null）を更新できる', async () => {
    const scriptId = 'script-1';
    const input = { name: 'global.js' };

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: null,
    });

    (prisma.script.update as jest.Mock).mockResolvedValue({
      id: scriptId,
      name: 'global.js',
      content: '',
      order: 0,
    });

    const result = await updateScript(scriptId, input);

    expect(result.success).toBe(true);
  });

  it('更新内容が空の場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    const result = await updateScript('script-1', {});

    expect(result).toEqual({ error: '更新内容がありません' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });
});
