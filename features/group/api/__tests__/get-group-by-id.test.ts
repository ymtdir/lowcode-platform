import { getGroupById } from '../get-group-by-id';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getGroupById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定したIDのグループを取得できる', async () => {
    const groupId = 'group-1';
    const mockGroup = {
      id: groupId,
      name: 'テストグループ',
      description: 'テスト用のグループです',
      parentId: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      parent: null,
      members: [
        {
          id: 'member-1',
          userId: 'user-1',
          groupId,
          createdAt: new Date('2024-01-01'),
          user: {
            id: 'user-1',
            email: 'user1@example.com',
            name: 'ユーザー1',
          },
        },
      ],
    };

    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);

    const result = await getGroupById(groupId);

    expect(result).toEqual(mockGroup);
    expect(prisma.group.findUnique).toHaveBeenCalledWith({
      where: { id: groupId },
      include: {
        parent: {
          select: {
            id: true,
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
      },
    });
  });

  it('親グループを持つグループを取得できる', async () => {
    const groupId = 'group-2';
    const mockGroup = {
      id: groupId,
      name: '子グループ',
      description: '子グループです',
      parentId: 'group-1',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      parent: {
        id: 'group-1',
        name: '親グループ',
      },
      members: [],
    };

    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);

    const result = await getGroupById(groupId);

    expect(result).toEqual(mockGroup);
  });

  it('グループが存在しない場合はnullを返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getGroupById('non-existent-id');

    expect(result).toBeNull();
    expect(prisma.group.findUnique).toHaveBeenCalledTimes(1);
  });
});
