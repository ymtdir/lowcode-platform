import { generateApiKey } from '../generate-api-key';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashApiKey } from '@/lib/api-auth';

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
  createHash: jest.requireActual('crypto').createHash,
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

  it('APIキーを生成しハッシュとprefixを保存する', async () => {
    const createdAt = new Date();
    const rawKey = `mk_${'a'.repeat(64)}`;
    const expectedPrefix = rawKey.slice(0, 8);
    const expectedHash = hashApiKey(rawKey);

    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { count: 0 },
      { prefix: expectedPrefix, createdAt },
    ]);

    const result = await generateApiKey();

    expect(result.prefix).toBe(expectedPrefix);
    expect(result.plainTextKey).toBe(rawKey);
    expect(result.createdAt).toBe(createdAt);
    expect(result.lastUsedAt).toBeNull();
    expect(result.expiresAt).toBeNull();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.apiKey.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
    expect(prisma.apiKey.create).toHaveBeenCalledWith({
      data: {
        name: 'default',
        key: expectedHash,
        prefix: expectedPrefix,
        userId: 'user-1',
      },
    });
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
