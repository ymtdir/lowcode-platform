import { updateColumn } from '../update-column';
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

describe('updateColumn', () => {
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
        ],
      },
      version: 1,
    },
  };

  it('カラムを更新できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
    });

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({
                  id: 'col-1',
                  name: '顧客名（更新）',
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

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
    });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('カラム名が空の場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);

    const result = await updateColumn('item-1', 'col-1', {
      name: '',
    });

    expect(result).toEqual({
      error: 'カラム名を入力してください',
    });
    expect(prisma.item.findUnique).not.toHaveBeenCalled();
  });

  it('テーブルが見つからない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
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

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
    });

    expect(result).toEqual({ error: 'テーブルではありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
    });

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

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
    });

    expect(result).toEqual({ error: 'スキーマが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
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

    const result = await updateColumn('item-1', 'col-1', {
      name: '会社名',
    });

    expect(result).toEqual({
      error: '同じ名前のカラムが既に存在します',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('カラムが見つからない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await updateColumn('item-1', 'col-999', {
      name: '顧客名（更新）',
    });

    expect(result).toEqual({ error: 'カラムが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateColumn('item-1', 'col-1', {
      name: '顧客名（更新）',
    });

    expect(result).toEqual({
      error: 'カラムの更新に失敗しました',
    });
  });

  describe('SELECT/MULTI_SELECTカラムの選択肢設定', () => {
    const mockSelectItem = {
      id: 'item-1',
      type: 'TABLE',
      createdById: 'user-1',
      meta: {
        schema: {
          columns: [
            {
              id: 'col-1',
              name: 'ステータス',
              type: 'SELECT',
              order: 0,
              config: {
                options: [
                  { id: 'opt-1', label: '未着手', color: '#gray' },
                  { id: 'opt-2', label: '進行中', color: '#blue' },
                ],
              },
            },
          ],
        },
        version: 1,
      },
    };

    it('SELECTカラムの選択肢を更新できる', async () => {
      (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockSelectItem);
      (prisma.item.update as jest.Mock).mockResolvedValue(mockSelectItem);

      const result = await updateColumn('item-1', 'col-1', {
        config: {
          options: [
            { id: 'opt-1', label: '未着手', color: '#gray' },
            { id: 'opt-2', label: '進行中', color: '#blue' },
            { id: 'opt-3', label: '完了', color: '#green' },
          ],
          defaultValue: 'opt-1',
        } as never,
      });

      expect(result).toEqual({ success: true });
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: {
            meta: expect.objectContaining({
              schema: expect.objectContaining({
                columns: expect.arrayContaining([
                  expect.objectContaining({
                    id: 'col-1',
                    config: expect.objectContaining({
                      options: expect.arrayContaining([
                        expect.objectContaining({ id: 'opt-3', label: '完了' }),
                      ]),
                      defaultValue: 'opt-1',
                    }),
                  }),
                ]),
              }),
            }),
          },
        })
      );
    });

    it('MULTI_SELECTカラムの選択肢を更新できる', async () => {
      const mockMultiSelectItem = {
        ...mockSelectItem,
        meta: {
          schema: {
            columns: [
              {
                id: 'col-1',
                name: 'タグ',
                type: 'MULTI_SELECT',
                order: 0,
                config: {
                  options: [
                    { id: 'opt-1', label: 'タグ1', color: '#red' },
                    { id: 'opt-2', label: 'タグ2', color: '#blue' },
                  ],
                },
              },
            ],
          },
          version: 1,
        },
      };

      (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
      (prisma.item.findUnique as jest.Mock).mockResolvedValue(
        mockMultiSelectItem
      );
      (prisma.item.update as jest.Mock).mockResolvedValue(mockMultiSelectItem);

      const result = await updateColumn('item-1', 'col-1', {
        config: {
          options: [
            { id: 'opt-1', label: 'タグ1', color: '#red' },
            { id: 'opt-2', label: 'タグ2', color: '#blue' },
            { id: 'opt-3', label: 'タグ3', color: '#green' },
          ],
          defaultValue: ['opt-1', 'opt-2'],
        } as never,
      });

      expect(result).toEqual({ success: true });
      expect(prisma.item.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'item-1' },
          data: {
            meta: expect.objectContaining({
              schema: expect.objectContaining({
                columns: expect.arrayContaining([
                  expect.objectContaining({
                    id: 'col-1',
                    config: expect.objectContaining({
                      options: expect.arrayContaining([
                        expect.objectContaining({
                          id: 'opt-3',
                          label: 'タグ3',
                        }),
                      ]),
                      defaultValue: ['opt-1', 'opt-2'],
                    }),
                  }),
                ]),
              }),
            }),
          },
        })
      );
    });
  });

  it('RELATION型カラムの設定を更新できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
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
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await updateColumn('item-1', 'col-1', {
      config: {
        referencedTableId: 'customer-table',
        displayField: 'companyName',
        allowMultiple: false,
      },
    });

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({
                  id: 'col-1',
                  config: expect.objectContaining({
                    referencedTableId: 'customer-table',
                    displayField: 'companyName',
                  }),
                }),
              ]),
            }),
          }),
        },
      })
    );
  });

  it('RELATION型カラムの複数選択設定を変更できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
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
                allowMultiple: false,
              },
            },
          ],
        },
        version: 1,
      },
    });
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await updateColumn('item-1', 'col-1', {
      config: {
        referencedTableId: 'tag-table',
        displayField: 'tagName',
        allowMultiple: true,
      },
    });

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
        data: {
          meta: expect.objectContaining({
            schema: expect.objectContaining({
              columns: expect.arrayContaining([
                expect.objectContaining({
                  id: 'col-1',
                  config: expect.objectContaining({
                    allowMultiple: true,
                  }),
                }),
              ]),
            }),
          }),
        },
      })
    );
  });
});
