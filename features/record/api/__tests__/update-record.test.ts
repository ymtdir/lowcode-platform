import { updateRecord } from '../update-record';
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
    record: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    item: {
      findUnique: jest.fn(),
    },
    itemPermission: {
      findUnique: jest.fn(),
    },
    groupMember: {
      findMany: jest.fn(),
    },
  },
}));

describe('updateRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  const mockRecord = {
    id: 'record-1',
    tableId: 'table-1',
    data: { name: '元の名前', age: 20 },
    createdById: 'user-1',
    table: { id: 'table-1', name: 'テストテーブル' },
  };

  it('レコードを更新できる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

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
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

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
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const result = await updateRecord('record-1', { name: '更新後' });

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.record.update).not.toHaveBeenCalled();
  });

  it('レコードが存在しない場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    (prisma.record.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateRecord('non-existent', { name: '更新後' });

    expect(result).toEqual({ error: 'レコードが見つかりません' });
    expect(prisma.record.update).not.toHaveBeenCalled();
  });

  it('WRITE権限がない場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    // READ権限のみ
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      level: 'READ',
    });
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

    const result = await updateRecord('record-1', { name: '更新後' });

    expect(result).toEqual({ error: 'レコードを更新する権限がありません' });
    expect(prisma.record.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    (prisma.record.findUnique as jest.Mock).mockResolvedValue(mockRecord);

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

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
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    (prisma.record.findUnique as jest.Mock).mockResolvedValue(
      recordWithNullData
    );

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

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
