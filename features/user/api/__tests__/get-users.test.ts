import { getUsers } from '../get-users';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザー一覧を取得できる', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'ユーザー1',
        role: 'ADMIN',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'ユーザー2',
        role: 'MEMBER',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
      },
    ];

    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

    const result = await getUsers();

    expect(result).toEqual(mockUsers);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('ユーザーが存在しない場合は空配列を返す', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getUsers();

    expect(result).toEqual([]);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
  });
});
