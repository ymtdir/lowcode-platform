import { getFolders } from '../get-folders';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    folder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('getFolders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ルートフォルダを取得できる', async () => {
    const mockRootFolders = [{ id: 'folder-1' }, { id: 'folder-2' }];

    const mockFolder1 = {
      id: 'folder-1',
      name: 'フォルダ1',
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

    const mockFolder2 = {
      id: 'folder-2',
      name: 'フォルダ2',
      parentId: null,
      order: 1,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
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

    (prisma.folder.findMany as jest.Mock).mockResolvedValue(mockRootFolders);
    (prisma.folder.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockFolder1)
      .mockResolvedValueOnce(mockFolder2);

    const result = await getFolders();

    expect(result).toEqual([mockFolder1, mockFolder2]);
    expect(prisma.folder.findMany).toHaveBeenCalledWith({
      where: {
        parentId: null,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
      },
    });
  });

  it('子フォルダを含むルートフォルダを取得できる', async () => {
    const mockRootFolders = [{ id: 'folder-1' }];

    const mockChildFolder = {
      id: 'child-1',
      name: '子フォルダ',
      parentId: 'folder-1',
      order: 0,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
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

    const mockFolder1WithChildren = {
      id: 'folder-1',
      name: 'フォルダ1',
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
      children: [mockChildFolder],
      _count: {
        children: 1,
      },
    };

    (prisma.folder.findMany as jest.Mock).mockResolvedValue(mockRootFolders);
    (prisma.folder.findUnique as jest.Mock)
      .mockResolvedValueOnce(mockFolder1WithChildren)
      .mockResolvedValueOnce(mockChildFolder);

    const result = await getFolders();

    expect(result).toHaveLength(1);
    expect(result[0]?.children).toHaveLength(1);
    expect(result[0]?.children?.[0]?.id).toBe('child-1');
  });

  it('ルートフォルダが存在しない場合は空配列を返す', async () => {
    (prisma.folder.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getFolders();

    expect(result).toEqual([]);
  });
});
