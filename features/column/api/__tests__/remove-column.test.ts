import { removeColumn } from '../remove-column';
import { requireAuth } from '@/lib/auth';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Supabaseクライアントをモック化
// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('removeColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
  });

  const mockDeveloperUser = {
    id: 'user-1',
    email: 'developer@example.com',
    name: '開発者',
    role: 'DEVELOPER' as const,
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
        ],
      },
      version: 1,
    },
  };

  it('カラムを削除できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: {
        schema: {
          columns: [
            {
              id: 'col-2',
              name: '会社名',
              type: 'TEXT',
              order: 1,
            },
          ],
        },
        version: 1,
      },
    });

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.not.arrayContaining([
                expect.objectContaining({
                  id: 'col-1',
                }),
              ]),
            }),
          }),
        },
      })
    );
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルが見つからない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({ error: 'テーブルが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルではない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      type: 'FOLDER',
    });

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({ error: 'テーブルではありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({
      error: 'この操作を行う権限がありません',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('スキーマが存在しない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: null,
    });

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({ error: 'スキーマが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('カラムが見つからない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await removeColumn('item-1', 'col-999');

    expect(result).toEqual({ error: 'カラムが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await removeColumn('item-1', 'col-1');

    expect(result).toEqual({
      error: 'カラムの削除に失敗しました',
    });
  });
});
