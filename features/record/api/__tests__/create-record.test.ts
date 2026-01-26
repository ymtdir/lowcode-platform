import { createRecord } from '../create-record';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Authをモック化
jest.mock('@/lib/auth', () => ({
  getCurrentUser: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
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

describe('createRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'db-user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  const mockTable = {
    id: 'table-1',
    name: 'テストテーブル',
    type: 'TABLE',
  };

  it('レコードを作成できる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
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
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.set('tableId', 'table-1');

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('テーブルIDがない場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    const formData = new FormData();

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: 'テーブルIDが必要です' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('テーブルが存在しない場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.set('tableId', 'non-existent-table');

    const result = await createRecord({}, formData);

    expect(result).toEqual({ error: 'テーブルが見つかりません' });
    expect(prisma.record.create).not.toHaveBeenCalled();
  });

  it('dataが空の場合は空オブジェクトで作成される', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
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
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
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
