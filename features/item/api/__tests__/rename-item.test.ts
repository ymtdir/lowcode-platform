import { renameItem } from '../rename-item';
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
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
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

describe('renameItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'DEVELOPER',
    });
  });

  it('アイテム名を変更できる', async () => {
    const itemId = 'folder-1';
    const newName = '新しいアイテム名';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
      parentId: null,
    });

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.update as jest.Mock).mockResolvedValue({
      id: itemId,
      name: newName,
    });

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: { name: newName },
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

    const result = await renameItem('folder-1', '新しい名前');

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'MEMBER',
    });

    const result = await renameItem('folder-1', '新しい名前');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('アイテム名が空の場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const newName = '';

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({
      error: 'アイテム名を入力してください',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('アイテム名が空白のみの場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const newName = '   ';

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({
      error: 'アイテム名を入力してください',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('使用できない文字が含まれている場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const newName = 'test/folder';

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('アイテムが見つからない場合はエラーを返す', async () => {
    const itemId = 'non-existent';
    const newName = '新しいアイテム名';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({
      error: 'アイテムが見つかりません',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('同じ名前のアイテムが既に存在する場合でも名前を変更できる', async () => {
    const itemId = 'folder-1';
    const newName = '既存アイテム';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
      parentId: null,
    });

    (prisma.item.update as jest.Mock).mockResolvedValue({
      id: itemId,
      name: newName,
    });

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: { name: newName },
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const newName = '新しいアイテム名';

    (prisma.item.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await renameItem(itemId, newName);

    expect(result).toEqual({
      error: 'アイテム名の変更に失敗しました',
    });
  });
});
