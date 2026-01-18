import { updateStyle } from '../update-style';
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

describe('updateStyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'DEVELOPER',
    });
  });

  it('スタイルの名前を更新できる', async () => {
    const styleId = 'style-1';
    const input = { name: 'updated.css' };

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockResolvedValue({
      id: styleId,
      name: 'updated.css',
      content: 'body {}',
      order: 0,
    });

    const result = await updateStyle(styleId, input);

    expect(result).toEqual({
      success: true,
      style: {
        id: styleId,
        name: 'updated.css',
        content: 'body {}',
        order: 0,
      },
    });
    expect(prisma.style.update).toHaveBeenCalledWith({
      where: { id: styleId },
      data: { name: 'updated.css' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('スタイルのcontentを更新できる', async () => {
    const styleId = 'style-1';
    const input = { content: '.new-content {}' };

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockResolvedValue({
      id: styleId,
      name: 'test.css',
      content: '.new-content {}',
      order: 0,
    });

    const result = await updateStyle(styleId, input);

    expect(result).toEqual({
      success: true,
      style: {
        id: styleId,
        name: 'test.css',
        content: '.new-content {}',
        order: 0,
      },
    });
    expect(prisma.style.update).toHaveBeenCalledWith({
      where: { id: styleId },
      data: { content: '.new-content {}' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('nameとcontentを同時に更新できる', async () => {
    const styleId = 'style-1';
    const input = { name: 'new-name.css', content: '.new {}' };

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockResolvedValue({
      id: styleId,
      name: 'new-name.css',
      content: '.new {}',
      order: 0,
    });

    const result = await updateStyle(styleId, input);

    expect(result.success).toBe(true);
    expect(prisma.style.update).toHaveBeenCalledWith({
      where: { id: styleId },
      data: { name: 'new-name.css', content: '.new {}' },
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

    const result = await updateStyle('style-1', { name: 'test.css' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.style.update).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateStyle('style-1', { name: 'test.css' });

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.style.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'MEMBER',
    });

    const result = await updateStyle('style-1', { name: 'test.css' });

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.style.update).not.toHaveBeenCalled();
  });

  it('スタイルが見つからない場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateStyle('non-existent', { name: 'test.css' });

    expect(result).toEqual({ error: 'スタイルが見つかりません' });
    expect(prisma.style.update).not.toHaveBeenCalled();
  });

  it('スタイル名が空文字の場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    const result = await updateStyle('style-1', { name: '' });

    expect(result).toEqual({ error: 'スタイル名を入力してください' });
    expect(prisma.style.update).not.toHaveBeenCalled();
  });

  it('スタイル名が空白のみの場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    const result = await updateStyle('style-1', { name: '   ' });

    expect(result).toEqual({ error: 'スタイル名を入力してください' });
    expect(prisma.style.update).not.toHaveBeenCalled();
  });

  it('スタイル名の前後の空白はトリムされる', async () => {
    const styleId = 'style-1';
    const input = { name: '  trimmed.css  ' };

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockResolvedValue({
      id: styleId,
      name: 'trimmed.css',
      content: '',
      order: 0,
    });

    await updateStyle(styleId, input);

    expect(prisma.style.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'trimmed.css' },
      })
    );
  });

  it('contentを空文字列に更新できる', async () => {
    const styleId = 'style-1';
    const input = { content: '' };

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockResolvedValue({
      id: styleId,
      name: 'test.css',
      content: '',
      order: 0,
    });

    const result = await updateStyle(styleId, input);

    expect(result.success).toBe(true);
    expect(prisma.style.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { content: '' },
      })
    );
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateStyle('style-1', { name: 'test.css' });

    expect(result).toEqual({ error: 'スタイルの更新に失敗しました' });
  });

  it('ADMINロールでもスタイルを更新できる', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      role: 'ADMIN',
    });

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.update as jest.Mock).mockResolvedValue({
      id: 'style-1',
      name: 'admin.css',
      content: '',
      order: 0,
    });

    const result = await updateStyle('style-1', { name: 'admin.css' });

    expect(result.success).toBe(true);
  });
});
