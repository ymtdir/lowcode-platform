import { updateRecord } from '../update-record';

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
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('updateRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'auth-user-1',
    email: 'test@example.com',
  };

  const mockRecord = {
    id: 'record-1',
    tableId: 'table-1',
    data: { name: '元の名前', age: 20 },
    createdById: 'user-1',
    table: { id: 'table-1', name: 'テストテーブル' },
  };

  it('レコードを更新できる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);
    (prisma.record.update as jest.Mock).mockResolvedValue({
      ...mockRecord,
      data: { name: '更新後の名前', age: 20 },
    });

    const result = await updateRecord('record-1', { name: '更新後の名前' });

    expect(result).toEqual({ success: true });
    expect(prisma.record.update).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: { data: { name: '更新後の名前', age: 20 } },
    });
  });

  it('既存のデータとマージされる', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);
    (prisma.record.update as jest.Mock).mockResolvedValue({
      ...mockRecord,
      data: { name: '元の名前', age: 25, email: 'new@example.com' },
    });

    const result = await updateRecord('record-1', {
      age: 25,
      email: 'new@example.com',
    });

    expect(result).toEqual({ success: true });
    expect(prisma.record.update).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: { data: { name: '元の名前', age: 25, email: 'new@example.com' } },
    });
  });

  it('未認証の場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const result = await updateRecord('record-1', { name: '更新後' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.record.update).not.toHaveBeenCalled();
  });

  it('レコードが存在しない場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateRecord('non-existent', { name: '更新後' });

    expect(result).toEqual({ error: 'レコードが見つかりません' });
    expect(prisma.record.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);
    (prisma.record.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateRecord('record-1', { name: '更新後' });

    expect(result).toEqual({ error: 'レコードの更新に失敗しました' });
  });

  it('既存データがnullの場合でも正常に更新できる', async () => {
    const recordWithNullData = {
      ...mockRecord,
      data: null,
    };
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(
      recordWithNullData
    );
    (prisma.record.update as jest.Mock).mockResolvedValue({
      ...recordWithNullData,
      data: { name: '新しい名前' },
    });

    const result = await updateRecord('record-1', { name: '新しい名前' });

    expect(result).toEqual({ success: true });
    expect(prisma.record.update).toHaveBeenCalledWith({
      where: { id: 'record-1' },
      data: { data: { name: '新しい名前' } },
    });
  });
});
