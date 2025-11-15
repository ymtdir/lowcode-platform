import { login, loginWithGoogle } from '../login';
import { createClient } from '@/lib/supabase/server';
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

describe('login', () => {
  const mockFormData = new FormData();
  mockFormData.append('email', 'test@example.com');
  mockFormData.append('password', 'password123');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しい認証情報でログインできる', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-1', email: 'test@example.com' } },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    await expect(login({}, mockFormData)).rejects.toThrow();

    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('誤った認証情報の場合はエラーを返す', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Invalid login credentials' },
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await login({}, mockFormData);

    expect(result).toEqual({
      error: 'メールアドレスまたはパスワードが正しくありません',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('メールアドレスが存在しない場合はエラーを返す', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Email not found' },
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await login({}, mockFormData);

    expect(result).toEqual({
      error: 'メールアドレスまたはパスワードが正しくありません',
    });
  });

  it('ネットワークエラーの場合はエラーを返す', async () => {
    const mockSupabase = {
      auth: {
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Network error' },
        }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const result = await login({}, mockFormData);

    expect(result).toEqual({
      error: 'メールアドレスまたはパスワードが正しくありません',
    });
  });
});

describe('loginWithGoogle', () => {
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

    await expect(loginWithGoogle()).rejects.toThrow();

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

    await expect(loginWithGoogle()).rejects.toThrow();

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

    await loginWithGoogle();

    expect(redirect).not.toHaveBeenCalled();
  });
});
