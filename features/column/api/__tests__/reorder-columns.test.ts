import { reorderColumns } from '../reorder-columns';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockDeveloperUser = {
  id: 'user-1',
  email: 'developer@example.com',
  name: '開発者',
  role: 'DEVELOPER' as const,
};

describe('reorderColumns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
  });

  const mockItem = {
    id: 'item-1',
    type: 'TABLE',
    createdById: 'user-1',
    meta: {
      schema: {
        columns: [
          {
            id: 'col-1',
            name: '顧客名',
            type: 'TEXT',
            order: 0,
          },
          {
            id: 'col-2',
            name: '会社名',
            type: 'TEXT',
            order: 1,
          },
          {
            id: 'col-3',
            name: '電話番号',
            type: 'TEXT',
            order: 2,
          },
        ],
      },
      version: 1,
    },
  };

  it('カラムの順序を並び替えできる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    // col-3, col-1, col-2 の順に並び替え
    const result = await reorderColumns('item-1', ['col-3', 'col-1', 'col-2']);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'item-1' },
      })
    );
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockRejectedValue(new Error('認証が必要です'));

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('ユーザー情報が取得できない場合はエラーを返す', async () => {
    // requireAuthが成功するがnullを返すケース（通常ありえないがロジックによっては）
    // または例外を投げるケース
    (requireAuth as jest.Mock).mockRejectedValue(new Error('Auth Error'));

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: '認証が必要です' }); // メッセージを変更
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルが見つからない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: 'テーブルが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('テーブルではない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      type: 'FOLDER',
    });

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: 'テーブルではありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({
      error: 'この操作を行う権限がありません',
    });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('ADMINユーザーは他のユーザーのテーブルも並び替えできる', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'ADMIN',
    });
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      createdById: 'other-user',
    });
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    const result = await reorderColumns('item-1', ['col-2', 'col-1', 'col-3']);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalled();
  });

  it('スキーマが存在しない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      ...mockItem,
      meta: null,
    });

    const result = await reorderColumns('item-1', ['col-1', 'col-2']);

    expect(result).toEqual({ error: 'スキーマが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('存在しないカラムIDは無視される', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockResolvedValue(mockItem);

    // 存在しないcol-999を含む（スキップされてorderは0, 2になる）
    const result = await reorderColumns('item-1', [
      'col-2',
      'col-999',
      'col-1',
    ]);

    expect(result).toEqual({ success: true });
    expect(prisma.item.update).toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
    (prisma.item.findUnique as jest.Mock).mockResolvedValue(mockItem);
    (prisma.item.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await reorderColumns('item-1', ['col-1', 'col-2', 'col-3']);

    expect(result).toEqual({
      error: 'カラムの並び替えに失敗しました',
    });
  });
});
