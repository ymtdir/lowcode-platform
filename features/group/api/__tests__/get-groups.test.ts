import { getGroups } from '../get-groups';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getGroups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('グループ一覧を取得できる', async () => {
    const mockGroups = [
      {
        id: 'group-1',
        name: 'グループ1',
        description: 'テストグループ1',
        parentId: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        parent: null,
        members: [],
        _count: { members: 0 },
      },
      {
        id: 'group-2',
        name: 'グループ2',
        description: 'テストグループ2',
        parentId: 'group-1',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        parent: { name: 'グループ1' },
        members: [
          {
            id: 'member-1',
            userId: 'user-1',
            groupId: 'group-2',
            createdAt: new Date('2024-01-02'),
            user: {
              id: 'user-1',
              email: 'user1@example.com',
              name: 'ユーザー1',
            },
          },
        ],
        _count: { members: 1 },
      },
    ];

    (prisma.group.findMany as jest.Mock).mockResolvedValue(mockGroups);

    const result = await getGroups();

    expect(result).toEqual(mockGroups);
    expect(prisma.group.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        parent: {
          select: {
            name: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });
  });

  it('グループが存在しない場合は空配列を返す', async () => {
    (prisma.group.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getGroups();

    expect(result).toEqual([]);
    expect(prisma.group.findMany).toHaveBeenCalledTimes(1);
  });
});
