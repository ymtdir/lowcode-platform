import { createItem } from '../create-item';
import { Prisma } from '@prisma/client';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
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

// DEVELOPERユーザーのモック
const mockDeveloperUser = {
  id: 'user-1',
  email: 'developer@example.com',
  name: 'Developer',
  role: 'DEVELOPER',
};

describe('createItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
  });

  it('アイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'テストアイテム',
      parentId: null,
      createdById: 'user-1',
      order: 0,
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'FOLDER',
        name: 'テストアイテム',
        parentId: null,
        createdById: 'user-1',
        order: 0,
        meta: Prisma.JsonNull,
      },
    });
  });

  it('親アイテムを指定してアイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子アイテム');
    formData.append('parentId', 'parent-1');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({ order: 2 }); // 最大order値

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'folder-2',
      name: '子アイテム',
      parentId: 'parent-1',
      createdById: 'user-1',
      order: 3,
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'FOLDER',
        name: '子アイテム',
        parentId: 'parent-1',
        createdById: 'user-1',
        order: 3,
        meta: Prisma.JsonNull,
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    (requireAuth as jest.Mock).mockRejectedValue(new Error('認証が必要です'));

    const result = await createItem({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    const result = await createItem({}, formData);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('アイテム名が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('parentId', '');

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: 'アイテム名を入力してください',
    });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('使用できない文字が含まれている場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'test/folder');
    formData.append('parentId', '');

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: '使用できない文字が含まれています（/ \\ : * ? " < > |）',
    });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('同じ名前のアイテムが既に存在する場合でも作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '既存アイテム');
    formData.append('parentId', '');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({ order: 0 });

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'new-item',
      name: '既存アイテム',
    });

    const result = await createItem({}, formData);

    expect(result).toEqual({ success: true });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストアイテム');
    formData.append('parentId', '');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createItem({}, formData);

    expect(result).toEqual({
      error: 'アイテムの作成に失敗しました',
    });
  });
});
