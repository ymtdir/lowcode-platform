import { signup, signupWithGoogle } from '../signup';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      create: jest.fn(),
    },
  },
}));

describe('signup', () => {
  const mockFormData = new FormData();
  mockFormData.append('name', 'テストユーザー');
  mockFormData.append('email', 'test@example.com');
  mockFormData.append('password', 'password123');
  mockFormData.append('confirmPassword', 'password123');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しい情報でサインアップできる', async () => {
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1', email: 'test@example.com' },
            session: { access_token: 'token' },
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 'user-1',
      name: 'テストユーザー',
      email: 'test@example.com',
      role: 'MEMBER',
    });

    await expect(signup({}, mockFormData)).rejects.toThrow();

    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        id: 'user-1',
        name: 'テストユーザー',
        email: 'test@example.com',
        role: 'MEMBER',
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('パスワードが一致しない場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'different-password');

    const result = await signup({}, formData);

    expect(result).toEqual({
      error: 'パスワードが一致しません',
    });
  });

  it('名前が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('email', 'test@example.com');
    formData.append('password', 'password123');
    formData.append('confirmPassword', 'password123');

    const result = await signup({}, formData);

    expect(result).toEqual({
      error: '名前を入力してください',
    });
  });

  it('Supabase認証エラーの場合はエラーを返す', async () => {
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User already registered' },
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await signup({}, mockFormData);

    expect(result).toEqual({
      error: 'アカウントの作成に失敗しました',
    });
  });

  it('Prismaへの保存に失敗した場合はエラーを返す', async () => {
    const mockSupabase = {
      auth: {
        signUp: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-1', email: 'test@example.com' },
            session: { access_token: 'token' },
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await signup({}, mockFormData);

    expect(result).toEqual({
      error: 'アカウントの作成に失敗しました',
    });
  });
});

describe('signupWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Google OAuth認証URLにリダイレクトできる', async () => {
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({
          data: {
            url: 'https://accounts.google.com/o/oauth2/auth?...',
          },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    await expect(signupWithGoogle()).rejects.toThrow();

    expect(mockSupabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: expect.stringContaining('/callback'),
      },
    });
    expect(redirect).toHaveBeenCalledWith(
      'https://accounts.google.com/o/oauth2/auth?...'
    );
  });

  it('OAuth認証URLの取得に失敗した場合はエラーページにリダイレクト', async () => {
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({
          data: { url: null },
          error: { message: 'OAuth error' },
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    await expect(signupWithGoogle()).rejects.toThrow();

    expect(redirect).toHaveBeenCalledWith('/error');
  });

  it('URLが取得できなかった場合はリダイレクトしない', async () => {
    const mockSupabase = {
      auth: {
        signInWithOAuth: jest.fn().mockResolvedValue({
          data: { url: null },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    await signupWithGoogle();

    expect(redirect).not.toHaveBeenCalled();
  });
});
