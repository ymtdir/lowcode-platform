import { getApiKey } from '../get-api-key';
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
      findFirst: jest.fn(),
    },
  },
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER',
};

describe('getApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
  });

  it('APIキーを取得できる', async () => {
    const createdAt = new Date();
    const apiKey = { key: 'mk_test123', createdAt };

    (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(apiKey);

    const result = await getApiKey();

    expect(result).toEqual(apiKey);
    expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { key: true, createdAt: true },
    });
  });

  it('APIキーが存在しない場合はnullを返す', async () => {
    (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await getApiKey();

    expect(result).toBeNull();
  });

  it('未認証の場合はエラーになる', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    await expect(getApiKey()).rejects.toThrow('Unauthorized');
    expect(prisma.apiKey.findFirst).not.toHaveBeenCalled();
  });
});
