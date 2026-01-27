import { addColumn } from '../add-column';
import { requireAuth, AuthError } from '@/lib/auth';

// lib/authをモック化
jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth');
  return {
    ...actual,
    requireAuth: jest.fn(),
  };
});

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

const mockDeveloperUser = {
  id: 'user-1',
  email: 'developer@example.com',
  name: '開発者',
  role: 'DEVELOPER' as const,
};

describe('addColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
  });

  const mockItem = {
    id: 'item-1',
    type: 'TABLE',
    createdById: 'user-1',
    meta: {
      schema: {
        columns: [],
      },
      version: 1,
    },
  };

  it('カラムを追加できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue({
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
          ],
        },
        version: 1,
      },
    });

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result.success).toBe(true);
    expect(result.column).toEqual(
      expect.objectContaining({
        name: '顧客名',
        type: 'TEXT',
        order: 0,
      })
    );
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({
                  name: '顧客名',
                  type: 'TEXT',
                }),
              ]),
            }),
          }),
        },
      })
    );
  });

  it('スキーマが存在しない場合は新規作成してカラムを追加できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: null,
    });
    (prisma.item.update as jest.Mock).mockResolvedValue({
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
          ],
        },
        version: 1,
      },
    });

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result.success).toBe(true);
    expect(result.column).toEqual(
      expect.objectContaining({
        name: '顧客名',
        type: 'TEXT',
        order: 0,
      })
    );
    expect(prisma.item.update).toHaveBeenCalled();
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('カラム名が空の場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);

    const result = await addColumn('item-1', {
      name: '',
      type: 'TEXT',
      order: 0,
    });

    expect(result).toEqual({
      error: 'カラム名を入力してください',
    });
    expect(prisma.item.findUnique).not.toHaveBeenCalled();
  });

  it('テーブルが見つからない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result).toEqual({ error: 'テーブルが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルではない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      type: 'FOLDER',
    });

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result).toEqual({ error: 'テーブルではありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('ADMIN権限の場合もカラムを追加できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      createdById: 'other-user',
    });
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result.success).toBe(true);
    expect(result.column).toEqual(
      expect.objectContaining({
        name: '顧客名',
        type: 'TEXT',
        order: 0,
      })
    );
    expect(prisma.item.update).toHaveBeenCalled();
  });

  it('同じ名前のカラムが既に存在する場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
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
          ],
        },
        version: 1,
      },
    });

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 1,
    });

    expect(result).toEqual({
      error: '同じ名前のカラムが既に存在します',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await addColumn('item-1', {
      name: '顧客名',
      type: 'TEXT',
      order: 0,
    });

    expect(result).toEqual({
      error: 'カラムの追加に失敗しました',
    });
  });

  it('RELATION型カラムを追加できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: {
        schema: {
          columns: [
            {
              id: 'col-1',
              name: '顧客',
              type: 'RELATION',
              order: 0,
              config: {
                referencedTableId: 'customer-table',
                displayField: 'name',
                allowMultiple: false,
              },
            },
          ],
        },
        version: 1,
      },
    });

    const result = await addColumn('item-1', {
      name: '顧客',
      type: 'RELATION',
      order: 0,
      config: {
        referencedTableId: 'customer-table',
        displayField: 'name',
        allowMultiple: false,
      },
    });

    expect(result.success).toBe(true);
    expect(result.column).toEqual(
      expect.objectContaining({
        name: '顧客',
        type: 'RELATION',
        order: 0,
        config: expect.objectContaining({
          referencedTableId: 'customer-table',
          displayField: 'name',
          allowMultiple: false,
        }),
      })
    );
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({
                  name: '顧客',
                  type: 'RELATION',
                  config: expect.objectContaining({
                    referencedTableId: 'customer-table',
                    displayField: 'name',
                  }),
                }),
              ]),
            }),
          }),
        },
      })
    );
  });

  it('RELATION型カラムで複数選択を許可できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: {
        schema: {
          columns: [
            {
              id: 'col-1',
              name: 'タグ',
              type: 'RELATION',
              order: 0,
              config: {
                referencedTableId: 'tag-table',
                displayField: 'tagName',
                allowMultiple: true,
              },
            },
          ],
        },
        version: 1,
      },
    });

    const result = await addColumn('item-1', {
      name: 'タグ',
      type: 'RELATION',
      order: 0,
      config: {
        referencedTableId: 'tag-table',
        displayField: 'tagName',
        allowMultiple: true,
      },
    });

    expect(result.success).toBe(true);
    expect(result.column).toEqual(
      expect.objectContaining({
        config: expect.objectContaining({
          allowMultiple: true,
        }),
      })
    );
  });
});
