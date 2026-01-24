import { getScripts } from '../get-scripts';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    script: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getScripts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定したitemIdのスクリプト一覧を取得できる', async () => {
    const itemId = 'item-1';
    const mockScripts = [
      {
        id: 'script-1',
        name: 'init.js',
        content: 'console.log("init")',
        order: 0,
      },
      {
        id: 'script-2',
        name: 'main.js',
        content: 'console.log("main")',
        order: 1,
      },
    ];

    (prisma.script.findMany as jest.Mock).mockResolvedValue(mockScripts);

    const result = await getScripts(itemId);

    expect(result).toEqual({ success: true, scripts: mockScripts });
    expect(prisma.script.findMany).toHaveBeenCalledWith({
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

  it('スクリプトが存在しない場合は空配列を返す', async () => {
    const itemId = 'item-1';

    (prisma.script.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getScripts(itemId);

    expect(result).toEqual({ success: true, scripts: [] });
    expect(prisma.script.findMany).toHaveBeenCalledWith({
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
    const mockScripts = [
      { id: 'script-1', name: 'first.js', content: '', order: 0 },
      { id: 'script-2', name: 'second.js', content: '', order: 1 },
      { id: 'script-3', name: 'third.js', content: '', order: 2 },
    ];

    (prisma.script.findMany as jest.Mock).mockResolvedValue(mockScripts);

    const result = await getScripts(itemId);

    expect('success' in result && result.success).toBe(true);
    if ('success' in result && result.success) {
      expect(result.scripts).toHaveLength(3);
      expect(result.scripts[0].order).toBe(0);
      expect(result.scripts[1].order).toBe(1);
      expect(result.scripts[2].order).toBe(2);
    }
  });

  it('データベースエラー時はエラーオブジェクトを返す', async () => {
    const itemId = 'item-1';
    const mockError = new Error('データベース接続エラー');

    (prisma.script.findMany as jest.Mock).mockRejectedValue(mockError);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = await getScripts(itemId);

    expect(result).toEqual({
      error: 'スクリプトの取得に失敗しました',
      scripts: [],
    });
    expect(consoleSpy).toHaveBeenCalledWith(
      'スクリプトの取得に失敗しました:',
      mockError
    );

    consoleSpy.mockRestore();
  });

  it('itemIdがnullの場合はグローバルスクリプトを取得する', async () => {
    const mockScripts = [
      {
        id: 'script-1',
        name: 'global.js',
        content: 'console.log("global")',
        order: 0,
      },
    ];

    (prisma.script.findMany as jest.Mock).mockResolvedValue(mockScripts);

    const result = await getScripts(null);

    expect(result).toEqual({ success: true, scripts: mockScripts });
    expect(prisma.script.findMany).toHaveBeenCalledWith({
      where: { itemId: null },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        content: true,
        order: true,
      },
    });
  });
});
