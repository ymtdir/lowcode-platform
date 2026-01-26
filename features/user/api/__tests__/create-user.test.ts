import { createUser } from '../create-user';
import { requireAuth } from '@/lib/auth';

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

// ADMINユーザーのモック
const mockAdminUser = {
  id: 'admin-1',
  email: 'admin@example.com',
  name: '管理者',
  role: 'ADMIN' as const,
};

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue(mockAdminUser);
  });

  it('ユーザーを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');
    formData.append('role', 'DEVELOPER');

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // 既存ユーザーなし
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'DEVELOPER',
    });

    const result = await createUser({}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'DEVELOPER',
        password: expect.any(String), // ハッシュ化されたパスワード
      }),
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue(null);

    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    const result = await createUser({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (requireAuth as jest.Mock).mockResolvedValue({
      ...mockAdminUser,
      role: 'MEMBER',
    });

    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    const result = await createUser({}, formData);

    expect(result).toEqual({ error: 'この操作を行う権限がありません' });
  });

  it('名前が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: '名前を入力してください',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('パスワードが一致しない場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'different');

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: 'パスワードが一致しません',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('無効なロールが指定された場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');
    formData.append('role', 'INVALID_ROLE');

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: '無効なロールが指定されました',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('既にメールアドレスが使用されている場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'existing-user',
      email: 'test@example.com',
    });

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: 'このメールアドレスは既に使用されています',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('Prisma でエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: 'ユーザーの作成に失敗しました',
    });
  });
});
