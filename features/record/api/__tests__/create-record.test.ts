import { createRecord } from '../create-record';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Supabaseクライアントをモック化
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
    })
  ),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    record: {
      create: jest.fn(),
    },
    itemPermission: {
      findUnique: jest.fn(),
    },
    groupMember: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('createRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'auth-user-1',
    email: 'test@example.com',
  };

  const mockDbUser = {
    id: 'db-user-1',
  };

  const mockTable = {
    id: 'table-1',
    name: 'テストテーブル',
    type: 'TABLE',
  };

  it('レコードを作成できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockDbUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockTable);
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.create as jest.Mock).mockResolvedValue({
      id: 'record-1',
      tableId: 'table-1',
      data: { name: 'テスト' },
      createdById: 'db-user-1',
    });

    const formData = new FormData();
    formData.set('tableId', 'table-1');
    formData.set('data', JSON.stringify({ name: 'テスト' }));

    const result = await createRecord({}, formData);

    expect(result).toEqual({
      success: true,
      record: {
        id: 'record-1',
        tableId: 'table-1',
        data: { name: 'テスト' },
        createdById: 'db-user-1',
      },
    });
    expect(prisma.record.create).toHaveBeenCalledWith({
      data: {
        tableId: 'table-1',
        data: { name: 'テスト' },
        createdById: 'db-user-1',
      },
    });
  });

  it('未認証の場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.set('tableId', 'table-1');

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.set('tableId', 'table-1');

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: 'ユーザー情報が取得できませんでした' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('テーブルIDがない場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);

    const formData = new FormData();

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: 'テーブルIDが必要です' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('テーブルが存在しない場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockDbUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.set('tableId', 'non-existent-table');

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: 'テーブルが見つかりません' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('dataが空の場合は空オブジェクトで作成される', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockDbUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockTable);
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.create as jest.Mock).mockResolvedValue({
      id: 'record-1',
      tableId: 'table-1',
      data: {},
      createdById: 'db-user-1',
    });

    const formData = new FormData();
    formData.set('tableId', 'table-1');

    const result = await createRecord({}, formData);

    expect(result).toEqual({
      success: true,
      record: {
        id: 'record-1',
        tableId: 'table-1',
        data: {},
        createdById: 'db-user-1',
      },
    });
    expect(prisma.record.create).toHaveBeenCalledWith({
      data: {
        tableId: 'table-1',
        data: {},
        createdById: 'db-user-1',
      },
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...mockDbUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockTable);
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.record.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const formData = new FormData();
    formData.set('tableId', 'table-1');
    formData.set('data', JSON.stringify({ name: 'テスト' }));

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: 'レコードの作成に失敗しました' });
  });
});
