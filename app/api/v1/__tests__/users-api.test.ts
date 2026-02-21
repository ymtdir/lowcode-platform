import { NextRequest } from 'next/server';
import { GET as getUsers, POST as createUser } from '../users/route';
import {
  GET as getUserById,
  PATCH as updateUser,
  DELETE as deleteUser,
} from '../users/[userId]/route';
import { prisma } from '@/lib/prisma';
import { authenticateApiKey } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';

// API認証をモック化
jest.mock('@/lib/api-auth', () => ({
  authenticateApiKey: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// bcryptをモック化
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
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

beforeEach(() => {
  jest.clearAllMocks();
  (authenticateApiKey as jest.Mock).mockResolvedValue(mockAdminUser);
});

// ========================
// GET /api/v1/users
// ========================
describe('GET /api/v1/users', () => {
  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/users', {
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('ユーザー一覧を { data: [...] } 形式で返す', async () => {
    const users = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

    const response = await getUsers(createRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('user-1');
  });

  it('パスワードフィールドはレスポンスに含まれない', async () => {
    const users = [
      {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'MEMBER',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

    const response = await getUsers(createRequest());
    const body = await response.json();

    expect(body.data[0].password).toBeUndefined();
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await getUsers(createRequest());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('未認証の場合は401を返す', async () => {
    const { NextResponse } = await import('next/server');
    (authenticateApiKey as jest.Mock).mockResolvedValue(
      NextResponse.json(
        { error: { message: 'APIキーが必要です', code: 'UNAUTHORIZED' } },
        { status: 401 }
      )
    );

    const response = await getUsers(createRequest());

    expect(response.status).toBe(401);
  });
});

// ========================
// POST /api/v1/users
// ========================
describe('POST /api/v1/users', () => {
  function createRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/users', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer mk_test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  const validBody = {
    name: 'New User',
    email: 'new@example.com',
    password: 'password123',
    role: 'MEMBER',
  };

  it('ユーザーを作成して201を返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const createdUser = {
      id: 'new-user-1',
      email: validBody.email,
      name: validBody.name,
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

    const response = await createUser(createRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.email).toBe(validBody.email);
    expect(body.data.password).toBeUndefined();
  });

  it('パスワードがハッシュ化される', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'new-user-1',
      email: validBody.email,
      name: validBody.name,
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await createUser(createRequest(validBody));

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ password: 'hashed_password' }),
      })
    );
  });

  it('メールアドレスが重複している場合は400を返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing' });

    const response = await createUser(createRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('nameが未入力の場合は422を返す', async () => {
    const response = await createUser(
      createRequest({ ...validBody, name: '' })
    );
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('emailが不正な場合は422を返す', async () => {
    const response = await createUser(
      createRequest({ ...validBody, email: 'invalid-email' })
    );

    expect(response.status).toBe(422);
  });

  it('passwordが6文字未満の場合は422を返す', async () => {
    const response = await createUser(
      createRequest({ ...validBody, password: 'abc' })
    );

    expect(response.status).toBe(422);
  });

  it('無効なroleの場合は422を返す', async () => {
    const response = await createUser(
      createRequest({ ...validBody, role: 'SUPERUSER' })
    );

    expect(response.status).toBe(422);
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await createUser(createRequest(validBody));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });
});

// ========================
// GET /api/v1/users/[userId]
// ========================
describe('GET /api/v1/users/[userId]', () => {
  const params = Promise.resolve({ userId: 'user-1' });

  function createRequest(
    overrideHeaders?: Record<string, string>
  ): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/users/user-1', {
      headers: { Authorization: 'Bearer mk_test', ...overrideHeaders },
    });
  }

  it('Adminは任意のユーザー詳細を取得できる', async () => {
    const targetUser = {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User 1',
      role: 'MEMBER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);

    const response = await getUserById(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe('user-1');
  });

  it('自分自身の情報はMemberでも取得できる', async () => {
    const selfParams = Promise.resolve({ userId: mockMemberUser.id });
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);
    const targetUser = {
      id: mockMemberUser.id,
      email: mockMemberUser.email,
      name: mockMemberUser.name,
      role: mockMemberUser.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);

    const response = await getUserById(createRequest(), { params: selfParams });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.id).toBe(mockMemberUser.id);
  });

  it('他ユーザーの情報はMemberが取得しようとすると403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await getUserById(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('存在しないユーザーは404を返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await getUserById(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// PATCH /api/v1/users/[userId]
// ========================
describe('PATCH /api/v1/users/[userId]', () => {
  const params = Promise.resolve({ userId: 'user-1' });

  function createRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/users/user-1', {
      method: 'PATCH',
      headers: {
        Authorization: 'Bearer mk_test',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }

  it('Adminはユーザー名を更新できる', async () => {
    const existingUser = {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'Old Name',
      role: 'MEMBER',
    };
    const updatedUser = {
      ...existingUser,
      name: 'New Name',
      updatedAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

    const response = await updateUser(createRequest({ name: 'New Name' }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.name).toBe('New Name');
  });

  it('Adminはroleを変更できる', async () => {
    const existingUser = {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User',
      role: 'MEMBER',
    };
    const updatedUser = {
      ...existingUser,
      role: 'DEVELOPER',
      updatedAt: new Date(),
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

    const response = await updateUser(createRequest({ role: 'DEVELOPER' }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.role).toBe('DEVELOPER');
  });

  it('自分自身のrole変更は400を返す', async () => {
    const selfParams = Promise.resolve({ userId: mockAdminUser.id });

    const response = await updateUser(createRequest({ role: 'MEMBER' }), {
      params: selfParams,
    });

    expect(response.status).toBe(400);
  });

  it('Memberはrole変更できない（403）', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);
    const selfParams = Promise.resolve({ userId: mockMemberUser.id });

    const response = await updateUser(createRequest({ role: 'ADMIN' }), {
      params: selfParams,
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('更新フィールドが空の場合は400を返す', async () => {
    const response = await updateUser(createRequest({}), { params });

    expect(response.status).toBe(400);
  });

  it('他ユーザーの更新をMemberが試みると403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await updateUser(createRequest({ name: 'Hack' }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('存在しないユーザーは404を返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await updateUser(createRequest({ name: 'Test' }), {
      params,
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ========================
// DELETE /api/v1/users/[userId]
// ========================
describe('DELETE /api/v1/users/[userId]', () => {
  const params = Promise.resolve({ userId: 'user-1' });

  function createRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/v1/users/user-1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer mk_test' },
    });
  }

  it('Adminはユーザーを削除できる', async () => {
    const targetUser = {
      id: 'user-1',
      email: 'user1@example.com',
      name: 'User 1',
      role: 'MEMBER',
    };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(targetUser);
    (prisma.user.delete as jest.Mock).mockResolvedValue(targetUser);

    const response = await deleteUser(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.message).toBe('ユーザーを削除しました');
  });

  it('自分自身を削除しようとすると400を返す', async () => {
    const selfParams = Promise.resolve({ userId: mockAdminUser.id });

    const response = await deleteUser(createRequest(), { params: selfParams });

    expect(response.status).toBe(400);
  });

  it('Admin以外は403を返す', async () => {
    (authenticateApiKey as jest.Mock).mockResolvedValue(mockMemberUser);

    const response = await deleteUser(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('存在しないユーザーは404を返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const response = await deleteUser(createRequest(), { params });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});
