import { deleteRecord } from '../delete-record';

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
    record: {
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('deleteRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'auth-user-1',
    email: 'test@example.com',
  };

  it('レコードを削除できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.delete as jest.Mock).mockResolvedValue({
      tableId: 'table-1',
    });

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ success: true });
    expect(prisma.record.delete).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      select: { tableId: true },
    });
  });

  it('未認証の場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.record.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ error: 'レコードの削除に失敗しました' });
  });

  it('存在しないレコードを削除しようとした場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.delete as jest.Mock).mockRejectedValue(
      new Error('Record not found')
    );

    const result = await deleteRecord('non-existent');

    expect(result).toEqual({ error: 'レコードの削除に失敗しました' });
  });
});
