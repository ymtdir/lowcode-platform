import { updateUserProfile } from '../update-user';
import { requireAuth } from '@/lib/auth';

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));
import { prisma } from '@/lib/prisma';

// ADMINユーザーのモック
describe('updateUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定（別のユーザーとして）
    (requireAuth as jest.Mock).mockResolvedValue({
      id: 'current-user-id',
      email: 'current@example.com',
      name: '現在のユーザー',
      role: 'ADMIN' as const,
    });
    // デフォルトでメールアドレスの重複なし
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
  });

  it('ADMIN権限で他のユーザー情報を更新できる', async () => {
    const userId = 'other-user-id';
    const formData = new FormData();
    formData.append('name', '更新されたユーザー');
    formData.append('email', 'updated@example.com');
    formData.append('role', 'DEVELOPER');

    // ADMIN権限で他のユーザーを編集
    (requireAuth as jest.Mock).mockResolvedValue({
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: '管理者',
      role: 'ADMIN' as const,
    });

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: userId,
      name: '更新されたユーザー',
      email: 'updated@example.com',
      role: 'DEVELOPER',
    });

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        name: '更新されたユーザー',
        email: 'updated@example.com',
        role: 'DEVELOPER',
      },
    });
  });

  it('名前が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('email', 'test@example.com');

    const result = await updateUserProfile('user-1', {}, formData);

    expect(result).toEqual({
      error: '名前を入力してください',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('無効なメールアドレスの場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'invalid-email');

    const result = await updateUserProfile('user-1', {}, formData);

    expect(result).toEqual({
      error: '有効なメールアドレスを入力してください',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('無効なロールが指定された場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('role', 'INVALID_ROLE');

    const result = await updateUserProfile('user-1', {}, formData);

    expect(result).toEqual({
      error: '無効なロールが指定されました',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('他のユーザーのプロフィールをADMIN以外は更新できない', async () => {
    const userId = 'other-user-id';
    const formData = new FormData();
    formData.append('name', '他のユーザー');
    formData.append('email', 'other@example.com');

    // DEVELOPER権限で他のユーザーを編集しようとする
    (requireAuth as jest.Mock).mockResolvedValue({
      id: 'current-user-id',
      email: 'current@example.com',
      name: '現在のユーザー',
      role: 'DEVELOPER' as const,
    });

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: 'この操作を行う権限がありません',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('自分自身のロールは変更できない', async () => {
    const userId = 'current-user-id';
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('role', 'MEMBER');

    // 現在のユーザーとして認証（自分自身を編集しようとしている）
    (requireAuth as jest.Mock).mockResolvedValue({
      id: userId,
      email: 'test@example.com',
      name: 'テストユーザー',
      role: 'ADMIN' as const,
    });

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: '自分自身のロールは変更できません',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('メールアドレスの検証でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error('Email already exists')
    );

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: 'ユーザー情報の更新に失敗しました',
    });
  });

  it('Prisma でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: 'ユーザー情報の更新に失敗しました',
    });
  });
});
