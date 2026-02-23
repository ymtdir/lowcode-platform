import { NextRequest } from 'next/server';
import { GET as getRecords, POST } from '../items/[itemId]/records/route';
import {
  GET as getRecord,
  PATCH,
  PUT,
  DELETE,
} from '../items/[itemId]/records/[recordId]/route';
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
      findUnique: jest.fn(),
    },
    record: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// 権限チェックをモック化
jest.mock('@/lib/permissions', () => ({
  canAccessItem: jest.fn(),
  hasPermission: jest.requireActual('@/lib/permissions').hasPermission,
}));

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'MEMBER' as const,
};

describe('GET /api/v1/items/[itemId]/records', () => {
  const params = Promise.resolve({ itemId: 'table-1' });

  function createRequest(query = ''): NextRequest {
    return new NextRequest(
      `http://localhost:3000/api/v1/items/table-1/records${query}`,
      { headers: { Authorization: 'Bearer mk_test' } }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'READ',
    });
  });

  it('ページネーション付きでレコード一覧を返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    const records = [{ id: 'rec-1', tableId: 'table-1', data: {} }];
    (prisma.record.findMany as jest.Mock).mockResolvedValue(records);
    (prisma.record.count as jest.Mock).mockResolvedValue(1);

    const response = await getRecords(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 1,
      totalPages: 1,
    });
  });

  it('page と limit パラメータが使える', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(100);

    await getRecords(createRequest('?page=2&limit=20'), { params });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 })
    );
  });

  it('limit は最大100に制限される', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(0);

    await getRecords(createRequest('?limit=999'), { params });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  it('テーブルでないアイテムの場合は404を返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getRecords(createRequest(), { params });

    expect(response.status).toBe(404);
  });

  // ── フィルタ関連 ────────────────────────────────────────────────────

  it('filter=col1:eq:hello でeq条件のwhere句が生成される', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(0);

    await getRecords(createRequest('?filter=col1:eq:hello'), { params });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tableId: 'table-1',
          AND: [{ data: { path: ['col1'], equals: 'hello' } }],
        },
      })
    );
  });

  it('filter=age:gt:20 で数値のgt条件が生成される', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(0);

    await getRecords(createRequest('?filter=age:gt:20'), { params });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tableId: 'table-1',
          AND: [{ data: { path: ['age'], gt: 20 } }],
        },
      })
    );
  });

  it('filter=name:contains:%E7%94%B0 でcontains条件が生成される', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(0);

    await getRecords(createRequest('?filter=name:contains:%E7%94%B0'), {
      params,
    });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [{ data: { path: ['name'], string_contains: '田' } }],
        }),
      })
    );
  });

  it('複数フィルタ条件をAND結合する', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(0);

    await getRecords(createRequest('?filter=status:eq:active,age:gte:18'), {
      params,
    });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tableId: 'table-1',
          AND: [
            { data: { path: ['status'], equals: 'active' } },
            { data: { path: ['age'], gte: 18 } },
          ],
        },
      })
    );
  });

  it('不正なフィルタ構文は422を返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });

    const response = await getRecords(
      createRequest('?filter=invalid_no_operator'),
      { params }
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('未対応の演算子は422を返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });

    const response = await getRecords(
      createRequest('?filter=col1:like:value'),
      { params }
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('filterパラメータなしの場合はフィルタなしで動作する', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    (prisma.record.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.count as jest.Mock).mockResolvedValue(0);

    await getRecords(createRequest(), { params });

    expect(prisma.record.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tableId: 'table-1' },
      })
    );
  });
});

describe('POST /api/v1/items/[itemId]/records', () => {
  const params = Promise.resolve({ itemId: 'table-1' });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/v1/items/table-1/records',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer mk_test',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'WRITE',
    });
  });

  it('レコードを作成して { data: ... } 形式で返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });
    const created = { id: 'rec-1', tableId: 'table-1', data: { col1: 'v1' } };
    (prisma.record.create as jest.Mock).mockResolvedValue(created);

    const response = await POST(createRequest({ data: { col1: 'v1' } }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.id).toBe('rec-1');
  });

  it('dataフィールドがない場合は400を返す', async () => {
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({ id: 'table-1' });

    const response = await POST(createRequest({}), { params });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('READ権限のみの場合は403を返す', async () => {
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'READ',
    });

    const response = await POST(createRequest({ data: { col1: 'v1' } }), {
      params,
    });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/v1/items/[itemId]/records/[recordId]', () => {
  const params = Promise.resolve({ itemId: 'table-1', recordId: 'rec-1' });

  function createRequest(): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/v1/items/table-1/records/rec-1',
      { headers: { Authorization: 'Bearer mk_test' } }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'READ',
    });
  });

  it('レコードを { data: ... } 形式で返す', async () => {
    const record = { id: 'rec-1', tableId: 'table-1', data: { col1: 'v1' } };
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(record);

    const response = await getRecord(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('rec-1');
  });

  it('レコードが存在しない場合は404を返す', async () => {
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getRecord(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('PATCH /api/v1/items/[itemId]/records/[recordId]', () => {
  const params = Promise.resolve({ itemId: 'table-1', recordId: 'rec-1' });

  function createRequest(body?: unknown): NextRequest {
    const headers: Record<string, string> = {
      Authorization: 'Bearer mk_test',
    };
    if (body) {
      headers['Content-Type'] = 'application/json';
    }
    return new NextRequest(
      'http://localhost:3000/api/v1/items/table-1/records/rec-1',
      {
        method: 'PATCH',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'WRITE',
    });
  });

  it('レコードを部分更新できる', async () => {
    const existing = {
      id: 'rec-1',
      tableId: 'table-1',
      data: { col1: 'keep', col2: 'old' },
    };
    const updated = {
      id: 'rec-1',
      tableId: 'table-1',
      data: { col1: 'keep', col2: 'new' },
    };
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.record.update as jest.Mock).mockResolvedValue(updated);

    const response = await PATCH(createRequest({ data: { col2: 'new' } }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('rec-1');
    expect(prisma.record.update).toHaveBeenCalledWith({
      where: { id: 'rec-1' },
      data: { data: { col1: 'keep', col2: 'new' } },
    });
  });

  it('レコードが存在しない場合は404を返す', async () => {
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await PATCH(createRequest({ data: { col1: 'v' } }), {
      params,
    });

    expect(response.status).toBe(404);
  });

  it('dataフィールドがない場合は400を返す', async () => {
    const existing = { id: 'rec-1', tableId: 'table-1', data: {} };
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(existing);

    const response = await PATCH(createRequest({}), { params });

    expect(response.status).toBe(400);
  });
});

describe('PUT /api/v1/items/[itemId]/records/[recordId]', () => {
  const params = Promise.resolve({ itemId: 'table-1', recordId: 'rec-1' });

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'WRITE',
    });
  });

  it('PUTもPATCHと同じ動作をする', async () => {
    const existing = {
      id: 'rec-1',
      tableId: 'table-1',
      data: { col1: 'old' },
    };
    const updated = {
      id: 'rec-1',
      tableId: 'table-1',
      data: { col1: 'new' },
    };
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.record.update as jest.Mock).mockResolvedValue(updated);

    const response = await PUT(
      new NextRequest(
        'http://localhost:3000/api/v1/items/table-1/records/rec-1',
        {
          method: 'PUT',
          headers: {
            Authorization: 'Bearer mk_test',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: { col1: 'new' } }),
        }
      ),
      { params }
    );

    expect(response.status).toBe(200);
  });
});

describe('DELETE /api/v1/items/[itemId]/records/[recordId]', () => {
  const params = Promise.resolve({ itemId: 'table-1', recordId: 'rec-1' });

  function createRequest(): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/v1/items/table-1/records/rec-1',
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mk_test' },
      }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockUser);
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'WRITE',
    });
  });

  it('レコードを削除できる', async () => {
    (prisma.record.findUnique as jest.Mock).mockResolvedValue({ id: 'rec-1' });
    (prisma.record.delete as jest.Mock).mockResolvedValue({});

    const response = await DELETE(createRequest(), { params });

    expect(response.status).toBe(204);
  });

  it('レコードが存在しない場合は404を返す', async () => {
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await DELETE(createRequest(), { params });

    expect(response.status).toBe(404);
  });

  it('READ権限のみの場合は403を返す', async () => {
    (canAccessItem as jest.Mock).mockResolvedValue({
      canAccess: true,
      level: 'READ',
    });

    const response = await DELETE(createRequest(), { params });

    expect(response.status).toBe(403);
  });
});
