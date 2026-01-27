import { createTable } from '../create-table';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// revalidatePathをモック化
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

// DEVELOPERユーザーのモック
const mockDeveloperUser = {
  id: 'user-1',
  email: 'developer@example.com',
  name: 'Developer',
  role: 'DEVELOPER' as const,
};

describe('createTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
  });

  it('TABLEタイプのアイテムを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストテーブル');
    formData.append('parentId', '');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'table-1',
      name: 'テストテーブル',
      parentId: null,
      createdById: 'user-1',
      order: 0,
      type: 'TABLE',
    });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'TABLE',
        name: 'テストテーブル',
        parentId: null,
        createdById: 'user-1',
        order: 0,
        meta: Prisma.JsonNull,
      },
    });
  });

  it('親フォルダを指定してTABLEを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', '子テーブル');
    formData.append('parentId', 'parent-1');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue({ order: 2 }); // 最大order値

    (prisma.item.create as jest.Mock).mockResolvedValue({
      id: 'table-2',
      name: '子テーブル',
      parentId: 'parent-1',
      createdById: 'user-1',
      order: 3,
      type: 'TABLE',
    });

    const result = await createTable({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.item.create).toHaveBeenCalledWith({
      data: {
        type: 'TABLE',
        name: '子テーブル',
        parentId: 'parent-1',
        createdById: 'user-1',
        order: 3,
        meta: Prisma.JsonNull,
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('name', 'テストテーブル');

    const result = await createTable({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const formData = new FormData();
    formData.append('name', 'テストテーブル');

    const result = await createTable({}, formData);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('アイテム名が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');

    const result = await createTable({}, formData);

    expect(result).toEqual({
      error: 'アイテム名を入力してください',
    });
    expect(prisma.item.create).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストテーブル');

    (prisma.item.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.item.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createTable({}, formData);

    expect(result).toEqual({
      error: 'アイテムの作成に失敗しました',
    });
  });
});
