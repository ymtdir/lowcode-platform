import { NextRequest } from 'next/server';
import { GET as getItems } from '../items/route';
import { GET as getItem } from '../items/[itemId]/route';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import { canAccessItem } from '@/lib/permissions';

// API認証をモック化
jest.mock('@/lib/api-auth', () => ({
  authenticateApiKey: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

// 権限チェックをモック化
jest.mock('@/lib/permissions', () => ({
  canAccessItem: jest.fn(),
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER' as const,
};

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
  (canAccessItem as jest.Mock).mockResolvedValue({
    canAccess: true,
    level: 'READ',
  });
});

describe('GET /api/v1/items', () => {
  function createRequest(query = ''): NextRequest {
    return new NextRequest(`http://localhost:3000/api/v1/items${query}`, {
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('アイテム一覧を { data: [...] } 形式で返す', async () => {
    const items = [
      {
        id: 'item-1',
        type: 'TABLE',
        name: 'テーブル',
        icon: null,
        meta: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (prisma.item.findMany as jest.Mock).mockResolvedValue(items);

    const response = await getItems(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('item-1');
  });

  it('type パラメータでフィルタできる', async () => {
    (prisma.item.findMany as jest.Mock).mockResolvedValue([]);

    await getItems(createRequest('?type=TABLE'));

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ type: 'TABLE' }),
      })
    );
  });

  it('parentId=null でルート直下をフィルタできる', async () => {
    (prisma.item.findMany as jest.Mock).mockResolvedValue([]);

    await getItems(createRequest('?parentId=null'));

    expect(prisma.item.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ parentId: null }),
      })
    );
  });

  it('アクセス権のないアイテムは除外される', async () => {
    const items = [
      {
        id: 'item-1',
        type: 'TABLE',
        name: 'アクセス可',
        icon: null,
        meta: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-2',
        type: 'TABLE',
        name: 'アクセス不可',
        icon: null,
        meta: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (prisma.item.findMany as jest.Mock).mockResolvedValue(items);
    (canAccessItem as jest.Mock)
      .mockResolvedValueOnce({ canAccess: true, level: 'READ' })
      .mockResolvedValueOnce({ canAccess: false, level: 'NONE' });

    const response = await getItems(createRequest());
    const body = await response.json();

    expect(body.data).toHaveLength(1);
  });

  it('未認証の場合は401を返す', async () => {
    const { NextResponse } = await import('next/server');
    (authenticateApiKey as jest.Mock).mockResolvedValue(
      NextResponse.json(
        { error: { message: 'APIキーが必要です', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    );

    const response = await getItems(createRequest());

    expect(response.status).toBe(401);
  });
});

describe('GET /api/v1/items/[itemId]', () => {
  const params = Promise.resolve({ itemId: 'item-1' });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/items/item-1', {
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('テーブルの詳細を { data: ... } 形式で返す', async () => {
    const table = {
      id: 'item-1',
      type: 'TABLE',
      name: 'テスト',
      icon: null,
      meta: { schema: { columns: [] } },
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    };
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(table);

    const response = await getItem(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('item-1');
    expect(body.data.type).toBe('TABLE');
  });

  it('レコードは含まれない', async () => {
    const table = {
      id: 'item-1',
      type: 'TABLE',
      name: 'テスト',
      icon: null,
      meta: { schema: { columns: [] } },
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [],
    };
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(table);

    const response = await getItem(createRequest(), { params });
    const body = await response.json();

    expect(body.data.records).toBeUndefined();
  });

  it('フォルダは子アイテムを含む', async () => {
    const folder = {
      id: 'item-1',
      type: 'FOLDER',
      name: 'フォルダ',
      icon: null,
      meta: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [
        {
          id: 'child-1',
          type: 'TABLE',
          name: '子テーブル',
          icon: null,
          parentId: 'item-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(folder);

    const response = await getItem(createRequest(), { params });
    const body = await response.json();

    expect(body.data.children).toHaveLength(1);
  });

  it('存在しない場合は404を返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getItem(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('アクセス権がない場合は403を返す', async () => {
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: false,
      level: 'NONE',
    });

    const response = await getItem(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});
