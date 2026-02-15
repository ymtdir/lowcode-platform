import { generateApiKey } from '../generate-api-key';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    apiKey: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// cryptoのモック化
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'a'.repeat(64)),
  })),
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER',
};

describe('generateApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockUser);
  });

  it('APIキーを生成できる', async () => {
    const createdAt = new Date();
    const expectedKey = `mk_${'a'.repeat(64)}`;

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { count: 0 },
      { key: expectedKey, createdAt },
    ]);

    const result = await generateApiKey();

    expect(result).toEqual({ key: expectedKey, createdAt });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      prisma.apiKey.deleteMany({ where: { userId: 'user-1' } }),
      prisma.apiKey.create({
        data: {
          name: 'default',
          key: expectedKey,
          userId: 'user-1',
        },
      }),
    ]);
  });

  it('未認証の場合はエラーになる', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

    await expect(generateApiKey()).rejects.toThrow('Unauthorized');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('DBエラーの場合はエラーになる', async () => {
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('DB Error'));

    await expect(generateApiKey()).rejects.toThrow('DB Error');
  });
});
