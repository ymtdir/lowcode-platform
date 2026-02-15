import { deleteApiKey } from '../delete-api-key';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      deleteMany: jest.fn(),
    },
  },
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER',
};

describe('deleteApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
  });

  it('APIキーを削除できる', async () => {
    (prisma.apiKey.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await deleteApiKey();

    expect(prisma.apiKey.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('APIキーが存在しない場合でもエラーにならない', async () => {
    (prisma.apiKey.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

    await expect(deleteApiKey()).resolves.toBeUndefined();
  });

  it('未認証の場合はエラーになる', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    await expect(deleteApiKey()).rejects.toThrow('Unauthorized');
    expect(prisma.apiKey.deleteMany).not.toHaveBeenCalled();
  });
});
