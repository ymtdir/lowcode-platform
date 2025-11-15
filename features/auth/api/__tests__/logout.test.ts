import { logout } from '../logout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常にログアウトできる', async () => {
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    await expect(logout()).rejects.toThrow();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('ログアウトエラーが発生してもログイン画面にリダイレクトする', async () => {
    const mockSupabase = {
      auth: {
        signOut: jest.fn().mockRejectedValue(new Error('Sign out error')),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(logout()).rejects.toThrow();

    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ログアウトエラー:',
      expect.any(Error)
    );
    expect(redirect).toHaveBeenCalledWith('/login');

    consoleErrorSpy.mockRestore();
  });

  it('Supabaseクライアントの作成に失敗してもログイン画面にリダイレクトする', async () => {
    (createClient as jest.Mock).mockRejectedValue(
      new Error('Failed to create client')
    );

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(logout()).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ログアウトエラー:',
      expect.any(Error)
    );
    expect(redirect).toHaveBeenCalledWith('/login');

    consoleErrorSpy.mockRestore();
  });
});
