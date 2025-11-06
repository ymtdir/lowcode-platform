import { createUser } from '../create-user';

// Supabase Admin Clientのモック関数を定義
const mockCreateUserFn = jest.fn();

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
      create: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('createUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーを作成できる', async () => {
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

    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'MEMBER',
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
        role: 'MEMBER',
      },
    });
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
