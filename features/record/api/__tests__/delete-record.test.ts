import { deleteRecord } from '../delete-record';
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
      delete: jest.fn(),
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

describe('deleteRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  it('レコードを削除できる', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    // レコード取得のモック
    (prisma.record.findUnique as jest.Mock).mockResolvedValue({
      id: 'record-1',
      tableId: 'table-1',
      data: {},
    });

    // アイテム取得のモック
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    // 権限チェック用のモック（ADMIN権限なので不要だが念のため）
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

    (prisma.record.delete as jest.Mock).mockResolvedValue({
      tableId: 'table-1',
    });

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ success: true });
    expect(prisma.record.delete).toHaveBeenCalledWith({
      where: { id: 'record-1' },
    });
  });

  it('未認証の場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(null);

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.record.delete).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    (prisma.record.findUnique as jest.Mock).mockResolvedValue({
      id: 'record-1',
      tableId: 'table-1',
      data: {},
    });

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

    (prisma.record.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ error: 'レコードの削除に失敗しました' });
  });

  it('存在しないレコードを削除しようとした場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (prisma.record.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await deleteRecord('non-existent');

    expect(result).toEqual({ error: 'レコードが見つかりません' });
  });

  it('WRITE権限がない場合はエラーを返す', async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      ...mockUser,
      role: 'MEMBER',
    });

    (prisma.record.findUnique as jest.Mock).mockResolvedValue({
      id: 'record-1',
      tableId: 'table-1',
      data: {},
    });

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: 'table-1',
      type: 'TABLE',
    });

    // READ権限のみ
    (prisma.itemPermission.findUnique as jest.Mock).mockResolvedValue({
      level: 'READ',
    });
    (prisma.groupMember.findMany as jest.Mock).mockResolvedValue([]);

    const result = await deleteRecord('record-1');

    expect(result).toEqual({ error: 'レコードを削除する権限がありません' });
    expect(prisma.record.delete).not.toHaveBeenCalled();
  });
});
