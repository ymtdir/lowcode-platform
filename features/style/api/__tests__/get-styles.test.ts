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

    expect(result).toEqual({ success: true, styles: mockStyles });
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

    expect(result).toEqual({ success: true, styles: [] });
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

    expect('success' in result && result.success).toBe(true);
    if ('success' in result && result.success) {
      expect(result.styles).toHaveLength(3);
      expect(result.styles[0].order).toBe(0);
      expect(result.styles[1].order).toBe(1);
      expect(result.styles[2].order).toBe(2);
    }
  });

  it('データベースエラー時はエラーオブジェクトを返す', async () => {
    const itemId = 'item-1';
    const mockError = new Error('データベース接続エラー');

    (prisma.style.findMany as jest.Mock).mockRejectedValue(mockError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await getStyles(itemId);

    expect(result).toEqual({
      error: 'スタイルの取得に失敗しました',
      styles: [],
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'スタイルの取得に失敗しました:',
      mockError
    );

    consoleSpy.mockRestore();
  });
});
