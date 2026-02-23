import { NextRequest } from 'next/server';
import { GET as getGroups, POST as createGroup } from '../groups/route';
import {
  GET as getGroupById,
  PATCH as updateGroup,
  DELETE as deleteGroup,
} from '../groups/[groupId]/route';
import {
  GET as getMembers,
  POST as addMembers,
} from '../groups/[groupId]/members/route';
import { DELETE as removeMember } from '../groups/[groupId]/members/[userId]/route';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';

// API認証をモック化
jest.mock('@/lib/api-auth', () => ({
  authenticateApiKey: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    group: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    groupMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'ADMIN' as const,
};

const mockMemberUser = {
  id: 'member-1',
  email: 'member@example.com',
  name: 'Member User',
  role: 'MEMBER' as const,
};

const mockGroup = {
  id: 'group-1',
  name: 'テストグループ',
  description: 'テスト用グループ',
  parentId: null,
  parent: null,
  _count: { members: 2 },
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateApiKey as jest.Mock).mockResolvedValue(mockAdminUser);
});

// ========================
// GET /api/v1/groups
// ========================
describe('GET /api/v1/groups', () => {
  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/groups', {
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('グループ一覧を返す', async () => {
    (prisma.group.findMany as jest.Mock).mockResolvedValue([mockGroup]);

    const response = await getGroups(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('group-1');
  });

  it('認証失敗は401を返す', async () => {
    const { NextResponse } = await import('next/server');
    (authenticateApiKey as jest.Mock).mockResolvedValue(
      NextResponse.json(
        { error: { message: '認証失敗', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    );

    const response = await getGroups(createRequest());
    expect(response.status).toBe(401);
  });
});

// ========================
// POST /api/v1/groups
// ========================
describe('POST /api/v1/groups', () => {
  function createRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/groups', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mk_test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  it('Adminはグループを作成できる', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.group.create as jest.Mock).mockResolvedValue(mockGroup);

    const response = await createGroup(
      createRequest({ name: 'テストグループ' })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.id).toBe('group-1');
  });

  it('nameが空の場合は422を返す', async () => {
    const response = await createGroup(createRequest({ name: '' }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await createGroup(
      createRequest({ name: 'テストグループ' })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('存在しないparentIdを指定すると404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await createGroup(
      createRequest({ name: 'テストグループ', parentId: 'nonexistent' })
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// GET /api/v1/groups/:groupId
// ========================
describe('GET /api/v1/groups/:groupId', () => {
  const params = Promise.resolve({ groupId: 'group-1' });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/groups/group-1', {
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('グループ詳細を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);

    const response = await getGroupById(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('group-1');
  });

  it('存在しないグループは404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getGroupById(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// PATCH /api/v1/groups/:groupId
// ========================
describe('PATCH /api/v1/groups/:groupId', () => {
  const params = Promise.resolve({ groupId: 'group-1' });

  function createRequest(body: object): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/groups/group-1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mk_test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  it('Adminはグループを更新できる', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.group.update as jest.Mock).mockResolvedValue({
      ...mockGroup,
      name: '更新後グループ',
    });

    const response = await updateGroup(
      createRequest({ name: '更新後グループ' }),
      { params }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.name).toBe('更新後グループ');
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await updateGroup(
      createRequest({ name: '更新後グループ' }),
      { params }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('自分自身を親に設定しようとすると400を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);

    const response = await updateGroup(createRequest({ parentId: 'group-1' }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('更新フィールドがない場合は400を返す', async () => {
    const response = await updateGroup(createRequest({}), { params });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('存在しないグループは404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await updateGroup(createRequest({ name: '更新' }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// DELETE /api/v1/groups/:groupId
// ========================
describe('DELETE /api/v1/groups/:groupId', () => {
  const params = Promise.resolve({ groupId: 'group-1' });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/groups/group-1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('Adminはグループを削除できる', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.group.count as jest.Mock).mockResolvedValue(0);
    (prisma.group.delete as jest.Mock).mockResolvedValue(mockGroup);

    const response = await deleteGroup(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe('グループを削除しました');
  });

  it('子グループが存在する場合は400を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.group.count as jest.Mock).mockResolvedValue(2);

    const response = await deleteGroup(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await deleteGroup(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('存在しないグループは404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await deleteGroup(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// GET /api/v1/groups/:groupId/members
// ========================
describe('GET /api/v1/groups/:groupId/members', () => {
  const params = Promise.resolve({ groupId: 'group-1' });

  function createRequest(): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/v1/groups/group-1/members',
      {
        headers: { Authorization: 'Bearer mk_test' },
      }
    );
  }

  it('メンバー一覧を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
      {
        user: {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'MEMBER',
        },
        createdAt: new Date(),
      },
    ]);

    const response = await getMembers(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('user-1');
    expect(body.data[0].joinedAt).toBeDefined();
  });

  it('存在しないグループは404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getMembers(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// POST /api/v1/groups/:groupId/members
// ========================
describe('POST /api/v1/groups/:groupId/members', () => {
  const params = Promise.resolve({ groupId: 'group-1' });

  function createRequest(body: object): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/v1/groups/group-1/members',
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

  it('Adminはメンバーを追加できる', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.$transaction as jest.Mock).mockResolvedValue([]);

    const response = await addMembers(
      createRequest({ userIds: ['user-1', 'user-2'] }),
      { params }
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.addedCount).toBe(2);
  });

  it('userIdsが空配列の場合は422を返す', async () => {
    const response = await addMembers(createRequest({ userIds: [] }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('全員が既にメンバーの場合は400を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([
      { userId: 'user-1' },
    ]);

    const response = await addMembers(createRequest({ userIds: ['user-1'] }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await addMembers(createRequest({ userIds: ['user-1'] }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ========================
// DELETE /api/v1/groups/:groupId/members/:userId
// ========================
describe('DELETE /api/v1/groups/:groupId/members/:userId', () => {
  const params = Promise.resolve({ groupId: 'group-1', userId: 'user-1' });

  function createRequest(): NextRequest {
    return new NextRequest(
      'http://localhost:3000/api/v1/groups/group-1/members/user-1',
      {
        method: 'DELETE',
        headers: { Authorization: 'Bearer mk_test' },
      }
    );
  }

  it('Adminはメンバーを削除できる', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      groupId: 'group-1',
    });
    (prisma.groupMember.delete as jest.Mock).mockResolvedValue({});

    const response = await removeMember(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe('メンバーを削除しました');
  });

  it('メンバーでないユーザーは404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(mockGroup);
    (prisma.groupMember.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await removeMember(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await removeMember(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('存在しないグループは404を返す', async () => {
    (prisma.group.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await removeMember(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
