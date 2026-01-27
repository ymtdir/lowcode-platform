import { reorderStyles } from '../reorder-styles';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    style: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'DEVELOPER',
};

describe('reorderStyles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('スタイルの並び順を更新できる', async () => {
    const itemId = 'item-1';
    const styleIds = ['style-3', 'style-1', 'style-2'];

    // バリデーション用のmock: すべてのIDが見つかったとする
    (prisma.style.findMany as jest.Mock).mockResolvedValue([
      { id: 'style-3' },
      { id: 'style-1' },
      { id: 'style-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'style-3', order: 0 },
      { id: 'style-1', order: 1 },
      { id: 'style-2', order: 2 },
    ]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ success: true });
    expect(prisma.style.findMany).toHaveBeenCalledWith({
      where: { id: { in: styleIds }, itemId },
      select: { id: true },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('空の配列でも成功する', async () => {
    const itemId = 'item-1';
    const styleIds: string[] = [];

    // バリデーション用のmock: 空配列が返る
    (prisma.style.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalledWith([]);
  });

  it('単一のスタイルでも並び替えできる', async () => {
    const itemId = 'item-1';
    const styleIds = ['style-1'];

    (prisma.style.findMany as jest.Mock).mockResolvedValue([{ id: 'style-1' }]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'style-1', order: 0 },
    ]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ success: true });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    const result = await reorderStyles('item-1', ['style-1', 'style-2']);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('無効なスタイルIDが含まれている場合はエラーを返す', async () => {
    const itemId = 'item-1';
    const styleIds = ['style-1', 'invalid-style'];

    // バリデーション用のmock: 1つしか見つからない
    (prisma.style.findMany as jest.Mock).mockResolvedValue([{ id: 'style-1' }]);

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ error: '無効なスタイルIDが含まれています' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'item-1';
    const styleIds = ['style-1', 'style-2'];

    (prisma.style.findMany as jest.Mock).mockResolvedValue([
      { id: 'style-1' },
      { id: 'style-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderStyles(itemId, styleIds);

    expect(result).toEqual({ error: 'スタイルの並び替えに失敗しました' });
  });

  it('ADMINロールでもスタイルを並び替えできる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'ADMIN',
    });

    const styleIds = ['style-1', 'style-2'];
    (prisma.style.findMany as jest.Mock).mockResolvedValue([
      { id: 'style-1' },
      { id: 'style-2' },
    ]);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { id: 'style-1', order: 0 },
      { id: 'style-2', order: 1 },
    ]);

    const result = await reorderStyles('item-1', styleIds);

    expect(result).toEqual({ success: true });
  });
});
