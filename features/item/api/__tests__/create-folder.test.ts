import { createFolder } from '../create-folder';
import { requireAuth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

// next/cacheをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));
import { prisma } from '@/lib/prisma';

// DEVELOPERユーザーのモック

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'DEVELOPER',
};

describe('createFolder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('FOLDERタイプのアイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストフォルダ');
    formData.append('parentId', '');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      type: 'FOLDER',
      name: 'テストフォルダ',
      parentId: null,
      createdById: 'user-id',
      order: 0,
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'FOLDER',
        name: 'テストフォルダ',
        parentId: null,
        createdById: 'user-id',
        order: 0,
        meta: Prisma.JsonNull,
      },
    });
  });

  it('親フォルダを指定してFOLDERを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子フォルダ');
    formData.append('parentId', 'parent-1');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({ order: 2 });

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-2',
      type: 'FOLDER',
      name: '子フォルダ',
      parentId: 'parent-1',
      createdById: 'user-id',
      order: 3,
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'FOLDER',
        name: '子フォルダ',
        parentId: 'parent-1',
        createdById: 'user-id',
        order: 3,
        meta: Prisma.JsonNull,
      },
    });
  });

  it('typeがFOLDERに設定される', async () => {
    const formData = new FormData();
    formData.append('name', 'フォルダ確認');
    formData.append('parentId', '');
    // typeを明示的に設定しても上書きされる
    formData.append('type', 'TABLE');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-3',
      type: 'FOLDER',
      name: 'フォルダ確認',
    });

    const result = await createFolder({}, formData);

    expect(result).toEqual({ success: true });
    // typeがFOLDERになっていることを確認
    expect(prisma.item.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'FOLDER',
        }),
      })
    );
  });
});
