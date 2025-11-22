import { getItemById } from '../get-item-by-id';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getItemById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('アイテムを取得できる', async () => {
    const itemId = 'folder-1';
    const mockItem = {
      id: itemId,
      name: 'テストアイテム',
      parentId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
      children: [],
      _count: {
        children: 0,
      },
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await getItemById(itemId);

    expect(result).toEqual(mockItem);
    expect(prisma.item.findUnique).toHaveBeenCalledWith({
      where: { id: itemId },
      include: {
        children: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });
  });

  it('子アイテムを含むアイテムを取得できる', async () => {
    const itemId = 'folder-1';
    const mockItem = {
      id: itemId,
      name: 'テストアイテム',
      parentId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
      children: [
        {
          id: 'child-1',
          name: '子アイテム1',
          parentId: itemId,
          order: 0,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          createdById: 'user-1',
        },
      ],
      _count: {
        children: 1,
      },
    };

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);

    const result = await getItemById(itemId);

    expect(result).toEqual(mockItem);
    expect(result?.children).toHaveLength(1);
  });

  it('アイテムが見つからない場合はnullを返す', async () => {
    const itemId = 'non-existent';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getItemById(itemId);

    expect(result).toBeNull();
  });
});
