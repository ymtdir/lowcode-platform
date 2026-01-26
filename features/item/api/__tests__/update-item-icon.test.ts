import { updateItemIcon } from '../update-item-icon';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// revalidatePathをモック化
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
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

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// DEVELOPERユーザーのモック
const mockDeveloperUser = {
  id: 'user-1',
  email: 'developer@example.com',
  name: 'Developer',
  role: 'DEVELOPER' as const,
};

describe('updateItemIcon', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでDEVELOPERユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockDeveloperUser);
  });

  it('有効なアイコン名でアイコンを更新できる', async () => {
    const itemId = 'folder-1';
    const iconName = 'Users';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
    });

    (prisma.item.update as jest.Mock).mockResolvedValue({
      id: itemId,
      icon: iconName,
    });

    const result = await updateItemIcon(itemId, iconName);

    expect(result).toEqual({ success: true, iconName: 'Users' });
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: { icon: iconName },
    });
  });

  it('nullを指定してアイコンをクリアできる', async () => {
    const itemId = 'folder-1';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
    });

    (prisma.item.update as jest.Mock).mockResolvedValue({
      id: itemId,
      icon: null,
    });

    const result = await updateItemIcon(itemId, null);

    expect(result).toEqual({ success: true, iconName: null });
    expect(prisma.item.update).toHaveBeenCalledWith({
      where: { id: itemId },
      data: { icon: null },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const result = await updateItemIcon('folder-1', 'Users');

    expect(result).toEqual({ error: '認証が必要です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('MEMBER権限ではエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockDeveloperUser,
      role: 'MEMBER',
    });

    const result = await updateItemIcon('folder-1', 'Users');

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('無効なアイコン名の場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const invalidIconName = 'InvalidIconName';

    const result = await updateItemIcon(itemId, invalidIconName);

    expect(result).toEqual({ error: '無効なアイコン名です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('空文字列のアイコン名の場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const emptyIconName = '';

    const result = await updateItemIcon(itemId, emptyIconName);

    expect(result).toEqual({ error: '無効なアイコン名です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('ケバブケースの無効なアイコン名の場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const invalidKebabCase = 'invalid-icon-name';

    const result = await updateItemIcon(itemId, invalidKebabCase);

    expect(result).toEqual({ error: '無効なアイコン名です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('特殊文字を含むアイコン名の場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const specialCharsIcon = 'icon@#$%';

    const result = await updateItemIcon(itemId, specialCharsIcon);

    expect(result).toEqual({ error: '無効なアイコン名です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('極端に長い文字列のアイコン名の場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const longIconName = 'a'.repeat(1000);

    const result = await updateItemIcon(itemId, longIconName);

    expect(result).toEqual({ error: '無効なアイコン名です' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('アイテムが見つからない場合はエラーを返す', async () => {
    const itemId = 'non-existent';
    const iconName = 'Users';

    (prisma.item.findUnique as jest.Mock).mockResolvedValue(null);

    const result = await updateItemIcon(itemId, iconName);

    expect(result).toEqual({ error: 'アイテムが見つかりません' });
    expect(prisma.item.update).not.toHaveBeenCalled();
  });

  it('データベースエラーが発生した場合はエラーを返す', async () => {
    const itemId = 'folder-1';
    const iconName = 'Users';

    (prisma.item.findUnique as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateItemIcon(itemId, iconName);

    expect(result).toEqual({ error: 'アイコンの更新に失敗しました' });
  });

  it('ADMIN権限でもアイコンを更新できる', async () => {
    const itemId = 'folder-1';
    const iconName = 'Folder';

    (requireAuth as jest.Mock).mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      name: '管理者',
      role: 'ADMIN' as const,
    });

    (prisma.item.findUnique as jest.Mock).mockResolvedValue({
      id: itemId,
    });

    (prisma.item.update as jest.Mock).mockResolvedValue({
      id: itemId,
      icon: iconName,
    });

    const result = await updateItemIcon(itemId, iconName);

    expect(result).toEqual({ success: true, iconName: 'Folder' });
  });
});
