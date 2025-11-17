import { deleteItem } from '../delete-item';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      delete: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('deleteItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('アイテムを削除できる', async () => {
    const itemId = 'folder-1';

    (prisma.item.delete as jest.Mock).mockResolvedValue({
      id: itemId,
      name: 'テストアイテム',
    });

    const result = await deleteItem(itemId);

    expect(result).toEqual({ success: true });
    expect(prisma.item.delete).toHaveBeenCalledWith({
      where: { id: itemId },
    });
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'folder-1';

    (prisma.item.delete as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await deleteItem(itemId);

    expect(result).toEqual({
      success: false,
      error: 'アイテムの削除に失敗しました',
    });
  });
});
