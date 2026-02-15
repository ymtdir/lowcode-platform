import { NextRequest } from 'next/server';
import { authenticateApiKey, apiError } from '../api-auth';
import { prisma } from '@/lib/prisma';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    apiKey: {
      findUnique: jest.fn(),
    },
  },
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
  });

  it('Authorizationヘッダーで認証できる', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    const request = createRequest({ Authorization: 'Bearer mk_test123' });
    const result = await authenticateApiKey(request);

    expect(result).toEqual(mockUser);
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { key: 'mk_test123' },
      select: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  });

  it('X-API-Keyヘッダーで認証できる', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      user: mockUser,
    });

    const request = createRequest({ 'X-API-Key': 'mk_test456' });
    const result = await authenticateApiKey(request);

    expect(result).toEqual(mockUser);
    expect(prisma.apiKey.findUnique).toHaveBeenCalledWith({
      where: { key: 'mk_test456' },
      select: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  });

  it('APIキーがない場合は401を返す', async () => {
    const request = createRequest();
    const result = await authenticateApiKey(request);

    expect(result).toHaveProperty('status', 401);
    const body = await (result as Response).json();
    expect(body).toEqual({ error: 'APIキーが必要です' });
    expect(prisma.apiKey.findUnique).not.toHaveBeenCalled();
  });

  it('無効なAPIキーの場合は401を返す', async () => {
    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

    const request = createRequest({ Authorization: 'Bearer mk_invalid' });
    const result = await authenticateApiKey(request);

    expect(result).toHaveProperty('status', 401);
    const body = await (result as Response).json();
    expect(body).toEqual({ error: '無効なAPIキーです' });
  });
});

describe('apiError', () => {
  it('指定したメッセージとステータスでレスポンスを返す', async () => {
    const response = apiError('Not Found', 404);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'Not Found' });
  });
});
