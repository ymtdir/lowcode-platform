import { createUser } from '../create-user';
import { createClient } from '@/lib/supabase/server';

// Supabase Admin Clientのモック関数を定義
const mockCreateUserFn = jest.fn();

// Supabaseクライアントをモック化
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Supabase Admin Clientをモック化
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: mockCreateUserFn,
      },
    },
  })),
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
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { email: 'admin@example.com' } },
    }),
  },
};

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトでADMINユーザーを設定
    (createClient as jest.Mock).mockResolvedValue(mockAdminUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
    });
  });

  it('ユーザーを作成できる', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');
    formData.append('role', 'DEVELOPER');

    mockCreateUserFn.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'DEVELOPER',
    });

    const result = await createUser({}, formData);

    expect(result).toEqual({ success: true });
    expect(mockCreateUserFn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true,
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: 'user-1',
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'DEVELOPER',
      },
    });
  });

  it('認証されていない場合はエラーを返す', async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    const result = await createUser({}, formData);

    expect(result).toEqual({ error: '認証が必要です' });
  });

  it('ADMIN以外のロールはエラーを返す', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
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
    expect(mockCreateUserFn).not.toHaveBeenCalled();
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
    expect(mockCreateUserFn).not.toHaveBeenCalled();
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
    expect(mockCreateUserFn).not.toHaveBeenCalled();
  });

  it('Supabase Auth でエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    mockCreateUserFn.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already exists' },
    });

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: 'ユーザーの作成に失敗しました',
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('Prisma でエラーが発生した場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    mockCreateUserFn.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await createUser({}, formData);

    expect(result).toEqual({
      error: 'ユーザーの作成に失敗しました',
    });
  });
});
