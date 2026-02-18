import { NextRequest } from 'next/server';
import { authenticateApiKey, hashApiKey } from '../api-auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
  },
}));

// レート制限をモック化
jest.mock('@/lib/rate-limit', () => ({
  checkRateLimit: jest.fn(() => ({
    allowed: true,
    limit: 100,
    remaining: 99,
    resetAt: 9999999,
  })),
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER' as const,
};

function createRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/test', { headers });
}

describe('authenticateApiKey', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      limit: 100,
      remaining: 99,
      resetAt: 9999999,
    });
  });

  it('Authorizationヘッダーで認証できる', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      expiresAt: null,
      user: mockUser,
    });

    const request = createRequest({ Authorization: 'Bearer mk_test123' });
    const result = await authenticateApiKey(request);

    expect(result).toEqual(mockUser);
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { key: hashApiKey('mk_test123') },
      select: {
        id: true,
        expiresAt: true,
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });
  });

  it('X-API-Keyヘッダーで認証できる', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      expiresAt: null,
      user: mockUser,
    });

    const request = createRequest({ 'X-API-Key': 'mk_test456' });
    const result = await authenticateApiKey(request);

    expect(result).toEqual(mockUser);
  });

  it('APIキーがない場合は401を返す', async () => {
    const request = createRequest();
    const result = await authenticateApiKey(request);

    expect(result).toHaveProperty('status', 401);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
  });

  it('無効なAPIキーの場合は401を返す', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createRequest({ Authorization: 'Bearer mk_invalid' });
    const result = await authenticateApiKey(request);

    expect(result).toHaveProperty('status', 401);
    const body = await (result as Response).json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('期限切れのAPIキーは401を返す', async () => {
    const pastDate = new Date('2020-01-01');
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      expiresAt: pastDate,
      user: mockUser,
    });

    const request = createRequest({ Authorization: 'Bearer mk_expired' });
    const result = await authenticateApiKey(request);

    expect(result).toHaveProperty('status', 401);
    const body = await (result as Response).json();
    expect(body.error.message).toContain('有効期限');
  });

  it('有効期限内のAPIキーは認証される', async () => {
    const futureDate = new Date('2099-12-31');
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      expiresAt: futureDate,
      user: mockUser,
    });

    const request = createRequest({ Authorization: 'Bearer mk_valid' });
    const result = await authenticateApiKey(request);

    expect(result).toEqual(mockUser);
  });

  it('レート制限を超えた場合は429を返す', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      expiresAt: null,
      user: mockUser,
    });
    (checkRateLimit as jest.Mock).mockReturnValue({
      allowed: false,
      limit: 100,
      remaining: 0,
      resetAt: 9999999,
    });

    const request = createRequest({ Authorization: 'Bearer mk_test' });
    const result = await authenticateApiKey(request);

    expect(result).toHaveProperty('status', 429);
    const response = result as Response;
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(response.headers.get('X-RateLimit-Reset')).toBe('9999999');
  });

  it('認証成功後にlastUsedAtが更新される', async () => {
    const updatePromise = Promise.resolve({});
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      expiresAt: null,
      user: mockUser,
    });
    (prisma.apiKey.update as jest.Mock).mockReturnValue(updatePromise);

    const request = createRequest({ Authorization: 'Bearer mk_test' });
    await authenticateApiKey(request);

    // fire-and-forgetの完了を待つ
    await updatePromise;

    expect(prisma.apiKey.update).toHaveBeenCalledWith({
      where: { id: 'key-1' },
      data: { lastUsedAt: expect.any(Date) },
    });
  });
});
