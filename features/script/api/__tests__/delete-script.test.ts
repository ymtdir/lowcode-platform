import { deleteScript } from '../delete-script';
import { requireAuth, AuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    script: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => {
  const actual = jest.requireActual('@/lib/auth');
  return {
    ...actual,
    requireAuth: jest.fn(),
  };
});

const mockUser = {
  id: 'user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'DEVELOPER',
};

describe('deleteScript', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'DEVELOPER',
    });
  });

  it('スクリプトを削除できる', async () => {
    const scriptId = 'script-1';

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.delete as jest.Mock).mockResolvedValue({
      id: scriptId,
    });

    const result = await deleteScript(scriptId);

    expect(result).toEqual({ success: true });
    expect(prisma.script.delete).toHaveBeenCalledWith({
      where: { id: scriptId },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(
      new AuthError('認証が必要です')
    );

    const result = await deleteScript('script-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.script.delete).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    const result = await deleteScript('script-1');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.script.delete).not.toHaveBeenCalled();
  });

  it('スクリプトが存在しない場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await deleteScript('non-existent');

    expect(result).toEqual({ error: 'スクリプトが存在しません' });
    expect(prisma.script.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteScript('script-1');

    expect(result).toEqual({ error: 'スクリプトの削除に失敗しました' });
  });

  it('ADMINロールでもスクリプトを削除できる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'ADMIN',
    });

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: 'item-1',
    });

    (prisma.script.delete as jest.Mock).mockResolvedValue({
      id: 'script-1',
    });

    const result = await deleteScript('script-1');

    expect(result).toEqual({ success: true });
  });

  it('グローバルスクリプト（itemId=null）も削除できる', async () => {
    const scriptId = 'script-1';

    (prisma.script.findUnique as jest.Mock).mockResolvedValue({
      itemId: null,
    });

    (prisma.script.delete as jest.Mock).mockResolvedValue({
      id: scriptId,
    });

    const result = await deleteScript(scriptId);

    expect(result).toEqual({ success: true });
    expect(prisma.script.delete).toHaveBeenCalledWith({
      where: { id: scriptId },
    });
  });
});
