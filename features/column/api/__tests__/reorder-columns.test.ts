import { reorderColumns } from '../reorder-columns';

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

describe('reorderColumns', () => {
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

  it('カラムの順序を並び替えできる', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    // col-3, col-1, col-2 の順に並び替え
    const result = await reorderColumns('item-1', ['col-3', 'col-1', 'col-2']);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: [
                expect.objectContaining({
                  id: 'col-3',
                  name: '電話番号',
                  order: 0,
                }),
                expect.objectContaining({
                  id: 'col-1',
                  name: '顧客名',
                  order: 1,
                }),
                expect.objectContaining({
                  id: 'col-2',
                  name: '会社名',
                  order: 2,
                }),
              ],
            }),
          }),
        },
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

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルが見つからない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

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

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

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

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({
      error: 'カラムを並び替える権限がありません',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('ADMINユーザーは他のユーザーのテーブルも並び替えできる', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockDbUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      createdById: 'other-user',
    });
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await reorderColumns('item-1', ['col-2', 'col-1', 'col-3']);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalled();
  });

  it('スキーマが存在しない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: null,
    });

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: 'スキーマが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('存在しないカラムIDは無視される', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    // 存在しないcol-999を含む（スキップされてorderは0, 2になる）
    const result = await reorderColumns('item-1', [
      'col-2',
      'col-999',
      'col-1',
    ]);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: [
                expect.objectContaining({ id: 'col-2', order: 0 }),
                expect.objectContaining({ id: 'col-1', order: 2 }),
              ],
            }),
          }),
        },
      })
    );
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderColumns('item-1', ['col-1', 'col-2', 'col-3']);

    expect(result).toEqual({
      error: 'カラムの並び替えに失敗しました',
    });
  });
});
