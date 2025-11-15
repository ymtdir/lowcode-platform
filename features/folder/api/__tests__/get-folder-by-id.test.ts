import { getFolderById } from '../get-folder-by-id';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getFolderById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('フォルダを取得できる', async () => {
    const folderId = 'folder-1';
    const mockFolder = {
      id: folderId,
      name: 'テストフォルダ',
      parentId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
      createdBy: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'テストユーザー',
      },
      children: [],
      _count: {
        children: 0,
      },
    };

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

    const result = await getFolderById(folderId);

    expect(result).toEqual(mockFolder);
    expect(prisma.folder.findUnique).toHaveBeenCalledWith({
      where: { id: folderId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        children: {
          include: {
            createdBy: {
              select: {
                id: true,
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
            children: true,
          },
        },
      },
    });
  });

  it('子フォルダを含むフォルダを取得できる', async () => {
    const folderId = 'folder-1';
    const mockFolder = {
      id: folderId,
      name: 'テストフォルダ',
      parentId: null,
      order: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      createdById: 'user-1',
      createdBy: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'テストユーザー',
      },
      children: [
        {
          id: 'child-1',
          name: '子フォルダ1',
          parentId: folderId,
          order: 0,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          createdById: 'user-1',
          createdBy: {
            id: 'user-1',
            name: 'テストユーザー',
          },
        },
      ],
      _count: {
        children: 1,
      },
    };

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue(mockFolder);

    const result = await getFolderById(folderId);

    expect(result).toEqual(mockFolder);
    expect(result?.children).toHaveLength(1);
  });

  it('フォルダが見つからない場合はnullを返す', async () => {
    const folderId = 'non-existent';

    (prisma.folder.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await getFolderById(folderId);

    expect(result).toBeNull();
  });
});
