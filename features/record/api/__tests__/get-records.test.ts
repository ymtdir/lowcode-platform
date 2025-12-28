import { getRecords } from '../get-records';
import type { ExportColumnFilter } from '@/features/table/types/export';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    record: {
      findMany: jest.fn(),
    },
  },
}));

// filter-converterをモック化
jest.mock('@/features/table/utils/filter-converter', () => ({
  convertFiltersToPrismaWhere: jest.fn(() => ({})),
}));

import { prisma } from '@/lib/prisma';
import { convertFiltersToPrismaWhere } from '@/features/table/utils/filter-converter';

describe('getRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック戻り値をリセット
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue({});
  });

  it('テーブルに紐づくレコード一覧を取得できる', async () => {
    const tableId = 'table-1';
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { name: 'テスト1' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'record-2',
        tableId,
        data: { name: 'テスト2' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId);

    expect(result).toEqual(mockRecords);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
    });
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith([]);
  });

  it('レコードが存在しない場合は空配列を返す', async () => {
    const tableId = 'table-1';

    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getRecords(tableId);

    expect(result).toEqual([]);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('作成日時の降順でソートされる', async () => {
    const tableId = 'table-1';

    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);

    await getRecords(tableId);

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
      })
    );
  });

  it('フィルタ条件を指定してレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [{ id: 'name', value: 'テスト' }];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { name: 'テスト1' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = { data: { path: ['name'], string_contains: 'テスト' } };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('NUMBER型フィルタでレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      {
        id: 'age',
        value: { operator: 'gte', value1: 20, value2: null },
      },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { age: 25 },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = { data: { path: ['age'], gte: 20 } };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('NUMBER型の範囲フィルタでレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      {
        id: 'age',
        value: { operator: 'range', value1: 20, value2: 30 },
      },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { age: 25 },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = {
      AND: [
        { data: { path: ['age'], gte: 20 } },
        { data: { path: ['age'], lte: 30 } },
      ],
    };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('DATE型フィルタでレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      {
        id: 'birthday',
        value: {
          preset: 'custom',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { birthday: '2024-06-15' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = {
      AND: [
        { data: { path: ['birthday'], gte: '2024-01-01' } },
        { data: { path: ['birthday'], lte: '2024-12-31' } },
      ],
    };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('SELECT型フィルタでレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      { id: 'status', value: ['active', 'pending'] },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { status: 'active' },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = {
      OR: [
        { data: { path: ['status'], equals: 'active' } },
        { data: { path: ['status'], equals: 'pending' } },
      ],
    };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('CHECKBOX型フィルタ（checked）でレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      { id: 'isActive', value: 'checked' },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { isActive: true },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = { data: { path: ['isActive'], equals: true } };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('CHECKBOX型フィルタ（unchecked）でレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      { id: 'isActive', value: 'unchecked' },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { isActive: false },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = { data: { path: ['isActive'], equals: false } };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('複数の異なる型のフィルタを組み合わせてレコードを取得できる', async () => {
    const tableId = 'table-1';
    const filters: ExportColumnFilter[] = [
      { id: 'name', value: 'テスト' },
      { id: 'age', value: { operator: 'gte', value1: 20, value2: null } },
      { id: 'isActive', value: 'checked' },
    ];
    const mockRecords = [
      {
        id: 'record-1',
        tableId,
        data: { name: 'テスト1', age: 25, isActive: true },
        createdById: 'user-1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    const mockWhere = {
      AND: [
        { data: { path: ['name'], string_contains: 'テスト' } },
        { data: { path: ['age'], gte: 20 } },
        { data: { path: ['isActive'], equals: true } },
      ],
    };
    (convertFiltersToPrismaWhere as jest.Mock).mockReturnValue(mockWhere);
    (prisma.record.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const result = await getRecords(tableId, { filters });

    expect(result).toEqual(mockRecords);
    expect(convertFiltersToPrismaWhere).toHaveBeenCalledWith(filters);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId, ...mockWhere },
      orderBy: { createdAt: 'desc' },
    });
  });
});
