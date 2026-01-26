import { logout } from '../logout';
import { signOut } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('@/lib/auth-config', () => ({
  signOut: jest.fn(),
}));

describe('logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常にログアウトできる', async () => {
    (signOut as jest.Mock).mockResolvedValue({});

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('ログアウトエラーが発生してもログイン画面にリダイレクトする', async () => {
    (signOut as jest.Mock).mockRejectedValue(new Error('Sign out error'));

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(logout()).rejects.toThrow('NEXT_REDIRECT');

    expect(signOut).toHaveBeenCalledWith({ redirect: false });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ログアウトエラー:',
      expect.any(Error)
    );
    expect(redirect).toHaveBeenCalledWith('/login');

    consoleErrorSpy.mockRestore();
  });
});
