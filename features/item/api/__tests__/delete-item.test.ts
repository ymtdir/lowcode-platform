import { deleteItem } from '../delete-item';
import { requireAuth } from '@/lib/auth';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      delete: jest.fn(),
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

describe('deleteItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('アイテムを削除できる', async () => {
    const itemId = 'folder-1';

    (prisma.item.delete as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    const result = await deleteItem(itemId);

    expect(result).toEqual({ success: true });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: itemId },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const result = await deleteItem('folder-1');

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    const result = await deleteItem('folder-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('ADMIN権限でも削除できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'ADMIN',
    });

    (prisma.item.delete as jest.Mock).mockResolvedValue({
      id: 'folder-1',
      name: 'テストアイテム',
    });

    const result = await deleteItem('folder-1');

    expect(result).toEqual({ success: true });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'folder-1';

    (prisma.item.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteItem(itemId);

    expect(result).toEqual({
      error: 'アイテムの削除に失敗しました',
    });
  });
});
