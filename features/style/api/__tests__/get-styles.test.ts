import { getStyles } from '../get-styles';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    style: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getStyles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定したitemIdのスタイル一覧を取得できる', async () => {
    const itemId = 'item-1';
    const mockStyles = [
      { id: 'style-1', name: 'base.css', content: 'body {}', order: 0 },
      { id: 'style-2', name: 'theme.css', content: '.theme {}', order: 1 },
    ];

    (prisma.style.findMany as jest.Mock).mockResolvedValue(mockStyles);

    const result = await getStyles(itemId);

    expect(result).toEqual(mockStyles);
    expect(prisma.style.findMany).toHaveBeenCalledWith({
      where: { itemId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('スタイルが存在しない場合は空配列を返す', async () => {
    const itemId = 'item-1';

    (prisma.style.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getStyles(itemId);

    expect(result).toEqual([]);
    expect(prisma.style.findMany).toHaveBeenCalledWith({
      where: { itemId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });

  it('orderの昇順でソートされて返される', async () => {
    const itemId = 'item-1';
    const mockStyles = [
      { id: 'style-1', name: 'first.css', content: '', order: 0 },
      { id: 'style-2', name: 'second.css', content: '', order: 1 },
      { id: 'style-3', name: 'third.css', content: '', order: 2 },
    ];

    (prisma.style.findMany as jest.Mock).mockResolvedValue(mockStyles);

    const result = await getStyles(itemId);

    expect(result).toHaveLength(3);
    expect(result[0].order).toBe(0);
    expect(result[1].order).toBe(1);
    expect(result[2].order).toBe(2);
  });
});
