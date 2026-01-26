import { guestLogin, isGuestLoginEnabled } from '../guest-login';
import { signIn } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

// NextAuthのsignInをモック
jest.mock('@/lib/auth-config', () => ({
  signIn: jest.fn(),
}));

// Next.jsのredirectをモック
jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

describe('guestLogin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('環境変数が設定されていない場合、エラーログを出力して早期リターンする', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    delete process.env.GUEST_USER_EMAIL;
    delete process.env.GUEST_USER_PASSWORD;

    await guestLogin();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ゲストログインエラー: 環境変数が設定されていません'
    );
    expect(signIn).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('GUEST_USER_EMAILのみ設定されている場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    delete process.env.GUEST_USER_PASSWORD;

    await guestLogin();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ゲストログインエラー: 環境変数が設定されていません'
    );
    expect(signIn).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('GUEST_USER_PASSWORDのみ設定されている場合、エラーログを出力する', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    delete process.env.GUEST_USER_EMAIL;
    process.env.GUEST_USER_PASSWORD = 'password';

    await guestLogin();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ゲストログインエラー: 環境変数が設定されていません'
    );
    expect(signIn).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('環境変数が設定されている場合、ゲストユーザーでログインする', async () => {
    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    process.env.GUEST_USER_PASSWORD = 'guestpass123';

    (signIn as jest.Mock).mockResolvedValue({});

    await expect(guestLogin()).rejects.toThrow('NEXT_REDIRECT');

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'guest@example.com',
      password: 'guestpass123',
      redirect: false,
    });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('ログインに失敗した場合（AuthError）、エラーログを出力して早期リターンする', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    process.env.GUEST_USER_PASSWORD = 'wrongpassword';

    const authError = new AuthError('Invalid login credentials');
    (signIn as jest.Mock).mockRejectedValue(authError);

    await guestLogin();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ゲストログインエラー:',
      'Invalid login credentials'
    );
    expect(redirect).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('ログインに失敗した場合（一般的なエラー）、エラーログを出力して早期リターンする', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    process.env.GUEST_USER_PASSWORD = 'password';

    const error = new Error('Network error');
    (signIn as jest.Mock).mockRejectedValue(error);

    await guestLogin();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ゲストログインエラー:',
      expect.any(Error)
    );
    expect(redirect).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('isGuestLoginEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('環境変数が両方設定されている場合、trueを返す', async () => {
    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    process.env.GUEST_USER_PASSWORD = 'password';

    const result = await isGuestLoginEnabled();

    expect(result).toBe(true);
  });

  it('環境変数が設定されていない場合、falseを返す', async () => {
    delete process.env.GUEST_USER_EMAIL;
    delete process.env.GUEST_USER_PASSWORD;

    const result = await isGuestLoginEnabled();

    expect(result).toBe(false);
  });

  it('GUEST_USER_EMAILのみ設定されている場合、falseを返す', async () => {
    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    delete process.env.GUEST_USER_PASSWORD;

    const result = await isGuestLoginEnabled();

    expect(result).toBe(false);
  });

  it('GUEST_USER_PASSWORDのみ設定されている場合、falseを返す', async () => {
    delete process.env.GUEST_USER_EMAIL;
    process.env.GUEST_USER_PASSWORD = 'password';

    const result = await isGuestLoginEnabled();

    expect(result).toBe(false);
  });

  it('空文字列が設定されている場合、falseを返す', async () => {
    process.env.GUEST_USER_EMAIL = '';
    process.env.GUEST_USER_PASSWORD = '';

    const result = await isGuestLoginEnabled();

    expect(result).toBe(false);
  });
});
