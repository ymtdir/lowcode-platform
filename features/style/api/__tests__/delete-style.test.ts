import { deleteStyle } from '../delete-style';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    style: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
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

describe('deleteStyle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('スタイルを削除できる', async () => {
    const styleId = 'style-1';

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.delete as jest.Mock).mockResolvedValue({
      id: styleId,
    });

    const result = await deleteStyle(styleId);

    expect(result).toEqual({ success: true });
    expect(prisma.style.delete).toHaveBeenCalledWith({
      where: { id: styleId },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('スタイルが存在しない場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await deleteStyle('non-existent');

    expect(result).toEqual({ error: 'スタイルが存在しません' });
    expect(prisma.style.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ error: 'スタイルの削除に失敗しました' });
  });

  it('ADMINロールでもスタイルを削除できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'ADMIN',
    });

    (prisma.style.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.style.delete as jest.Mock).mockResolvedValue({
      id: 'style-1',
    });

    const result = await deleteStyle('style-1');

    expect(result).toEqual({ success: true });
  });
});
