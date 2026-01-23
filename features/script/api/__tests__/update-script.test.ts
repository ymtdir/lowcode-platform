import { updateScript } from '../update-script';
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
      findUnique: jest.fn(),
      update: jest.fn(),
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

describe('updateScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
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
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await updateScript('script-1', { name: 'test.js' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateScript('script-1', { name: 'test.js' });

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.script.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
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
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
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
