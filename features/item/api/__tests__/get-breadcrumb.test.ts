import { getItemBreadcrumb } from '../get-breadcrumb';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getItemBreadcrumb', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('単一アイテムのパンくずを取得できる', async () => {
    const itemId = 'item-1';
    const mockItem = {
      id: itemId,
      name: 'ルートフォルダ',
      type: 'FOLDER',
      parentId: null,
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await getItemBreadcrumb(itemId);

    expect(result).toEqual([
      {
        id: itemId,
        name: 'ルートフォルダ',
        type: 'FOLDER',
      },
    ]);
    expect(prisma.item.findUnique).toHaveBeenCalledTimes(1);
    expect(prisma.item.findUnique).toHaveBeenCalledWith({
      where: { id: itemId },
      select: {
        id: true,
        name: true,
        type: true,
        parentId: true,
      },
    });
  });

  it('親子関係のあるアイテムのパンくずを取得できる', async () => {
    const parentId = 'parent-1';
    const childId = 'child-1';

    // 最初にchildを取得、次にparentを取得
    (prisma.item.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: childId,
        name: '子フォルダ',
        type: 'FOLDER',
        parentId: parentId,
      })
      .mockResolvedValueOnce({
        id: parentId,
        name: '親フォルダ',
        type: 'FOLDER',
        parentId: null,
      });

    const result = await getItemBreadcrumb(childId);

    expect(result).toEqual([
      {
        id: parentId,
        name: '親フォルダ',
        type: 'FOLDER',
      },
      {
        id: childId,
        name: '子フォルダ',
        type: 'FOLDER',
      },
    ]);
    expect(prisma.item.findUnique).toHaveBeenCalledTimes(2);
  });

  it('3階層のパンくずを取得できる', async () => {
    const grandparentId = 'grandparent-1';
    const parentId = 'parent-1';
    const childId = 'child-1';

    (prisma.item.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: childId,
        name: 'テーブル',
        type: 'TABLE',
        parentId: parentId,
      })
      .mockResolvedValueOnce({
        id: parentId,
        name: '子フォルダ',
        type: 'FOLDER',
        parentId: grandparentId,
      })
      .mockResolvedValueOnce({
        id: grandparentId,
        name: 'ルートフォルダ',
        type: 'FOLDER',
        parentId: null,
      });

    const result = await getItemBreadcrumb(childId);

    expect(result).toEqual([
      {
        id: grandparentId,
        name: 'ルートフォルダ',
        type: 'FOLDER',
      },
      {
        id: parentId,
        name: '子フォルダ',
        type: 'FOLDER',
      },
      {
        id: childId,
        name: 'テーブル',
        type: 'TABLE',
      },
    ]);
    expect(prisma.item.findUnique).toHaveBeenCalledTimes(3);
  });

  it('存在しないアイテムの場合は空配列を返す', async () => {
    const itemId = 'non-existent';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getItemBreadcrumb(itemId);

    expect(result).toEqual([]);
    expect(prisma.item.findUnique).toHaveBeenCalledTimes(1);
  });

  it('途中の親アイテムが存在しない場合はそこまでの結果を返す', async () => {
    const childId = 'child-1';

    // 子アイテムは存在するが、親アイテムは存在しない
    (prisma.item.findUnique as jest.Mock)
      .mockResolvedValueOnce({
        id: childId,
        name: '子フォルダ',
        type: 'FOLDER',
        parentId: 'deleted-parent',
      })
      .mockResolvedValueOnce(null);

    const result = await getItemBreadcrumb(childId);

    // 取得できたアイテムのみが結果に含まれる
    expect(result).toEqual([
      {
        id: childId,
        name: '子フォルダ',
        type: 'FOLDER',
      },
    ]);
    expect(prisma.item.findUnique).toHaveBeenCalledTimes(2);
  });
});
