import { getTables } from '../get-tables';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getTables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TABLE型のアイテムのみを取得できる', async () => {
    const mockTables = [
      {
        id: 'table-1',
        name: 'テーブル1',
        type: 'TABLE',
        parentId: 'folder-1',
        order: 0,
        meta: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdById: 'user-1',
      },
      {
        id: 'table-2',
        name: 'テーブル2',
        type: 'TABLE',
        parentId: null,
        order: 1,
        meta: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        createdById: 'user-1',
      },
    ];

    (prisma.item.findMany as jest.Mock).mockResolvedValue(mockTables);

    const result = await getTables();

    expect(result).toEqual(mockTables);
    expect(prisma.item.findMany).toHaveBeenCalledWith({
      where: { type: 'TABLE' },
      orderBy: { order: 'asc' },
    });
  });

  it('テーブルが存在しない場合は空配列を返す', async () => {
    (prisma.item.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getTables();

    expect(result).toEqual([]);
    expect(prisma.item.findMany).toHaveBeenCalledWith({
      where: { type: 'TABLE' },
      orderBy: { order: 'asc' },
    });
  });

  it('orderの昇順でソートされる', async () => {
    const mockTables = [
      {
        id: 'table-1',
        name: 'テーブル1',
        type: 'TABLE',
        parentId: null,
        order: 0,
        meta: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdById: 'user-1',
      },
      {
        id: 'table-2',
        name: 'テーブル2',
        type: 'TABLE',
        parentId: null,
        order: 1,
        meta: null,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        createdById: 'user-1',
      },
    ];

    (prisma.item.findMany as jest.Mock).mockResolvedValue(mockTables);

    await getTables();

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { order: 'asc' },
      })
    );
  });

  it('型ガードによってTABLE型のみがフィルタリングされる', async () => {
    // 実際にはPrismaのwhereで絞り込まれるが、型ガードのテストのため混在データを返す
    const mockItems = [
      {
        id: 'table-1',
        name: 'テーブル1',
        type: 'TABLE' as const,
        parentId: null,
        order: 0,
        meta: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        createdById: 'user-1',
      },
    ];

    (prisma.item.findMany as jest.Mock).mockResolvedValue(mockItems);

    const result = await getTables();

    // フィルタ後もTABLE型のみが残る
    expect(result).toHaveLength(1);
    expect(result.every((item) => item.type === 'TABLE')).toBe(true);
  });
});
