import { getRecords } from '../get-records';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    record: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      orderBy: { createdAt: 'asc' },
    });
  });

  it('レコードが存在しない場合は空配列を返す', async () => {
    const tableId = 'table-1';

    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getRecords(tableId);

    expect(result).toEqual([]);
    expect(prisma.record.findMany).toHaveBeenCalledWith({
      where: { tableId },
      orderBy: { createdAt: 'asc' },
    });
  });

  it('作成日時の昇順でソートされる', async () => {
    const tableId = 'table-1';

    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);

    await getRecords(tableId);

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'asc' },
      })
    );
  });
});
