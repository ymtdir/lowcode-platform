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

  it('APIキー情報を取得できる（plainTextKeyはnull）', async () => {
    const createdAt = new Date();
    const apiKey = {
      prefix: 'mk_abc1d',
      lastUsedAt: null,
      expiresAt: null,
      createdAt,
    };

    (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(apiKey);

    const result = await getApiKey();

    expect(result).toEqual({
      prefix: 'mk_abc1d',
      plainTextKey: null,
      lastUsedAt: null,
      expiresAt: null,
      createdAt,
    });
    expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: {
        prefix: true,
        lastUsedAt: true,
        expiresAt: true,
        createdAt: true,
      },
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
