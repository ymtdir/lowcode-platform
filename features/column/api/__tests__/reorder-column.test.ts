import { reorderColumn } from '../reorder-column';

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
      update: jest.fn(),
    },
  },
}));

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

describe('reorderColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { email: 'test@example.com' } },
      }),
    },
  };

  const mockDbUser = {
    id: 'user-1',
    role: 'MEMBER',
  };

  const mockItem = {
    id: 'item-1',
    type: 'TABLE',
    createdById: 'user-1',
    meta: {
      schema: {
        columns: [
          {
            id: 'col-1',
            name: '顧客名',
            type: 'TEXT',
            order: 0,
          },
          {
            id: 'col-2',
            name: '会社名',
            type: 'TEXT',
            order: 1,
          },
          {
            id: 'col-3',
            name: '電話番号',
            type: 'TEXT',
            order: 2,
          },
        ],
      },
      version: 1,
    },
  };

  it('カラムを並び替えられる', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalled();
  });

  it('認証されていない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('並び順が負の値の場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);

    const result = await reorderColumn('item-1', 'col-1', -1);

    expect(result).toEqual({
      error: '並び順は0以上である必要があります',
    });
    expect(prisma.item.findUnique).not.toHaveBeenCalled();
  });

  it('テーブルが見つからない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({ error: 'テーブルが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルではない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      type: 'FOLDER',
    });

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({ error: 'テーブルではありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('権限がない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      createdById: 'other-user',
    });

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({
      error: 'カラムを並び替える権限がありません',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('スキーマが存在しない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: null,
    });

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({ error: 'スキーマが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('カラムが見つからない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await reorderColumn('item-1', 'col-999', 2);

    expect(result).toEqual({ error: 'カラムが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('無効な並び順の場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    // 新しいオブジェクトを返すようにする（mutationを避ける）
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: {
        schema: {
          columns: [
            {
              id: 'col-1',
              name: '顧客名',
              type: 'TEXT',
              order: 0,
            },
            {
              id: 'col-2',
              name: '会社名',
              type: 'TEXT',
              order: 1,
            },
            {
              id: 'col-3',
              name: '電話番号',
              type: 'TEXT',
              order: 2,
            },
          ],
        },
        version: 1,
      },
    });

    const result = await reorderColumn('item-1', 'col-1', 999);

    expect(result).toEqual({ error: '無効な並び順です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    // 新しいオブジェクトを返すようにする（mutationを避ける）
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: {
        schema: {
          columns: [
            {
              id: 'col-1',
              name: '顧客名',
              type: 'TEXT',
              order: 0,
            },
            {
              id: 'col-2',
              name: '会社名',
              type: 'TEXT',
              order: 1,
            },
            {
              id: 'col-3',
              name: '電話番号',
              type: 'TEXT',
              order: 2,
            },
          ],
        },
        version: 1,
      },
    });
    (prisma.item.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderColumn('item-1', 'col-1', 2);

    expect(result).toEqual({
      error: 'カラムの並び替えに失敗しました',
    });
  });
});
