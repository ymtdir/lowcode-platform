import { guestLogin, isGuestLoginEnabled } from '../guest-login';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Supabaseクライアントのモック
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Next.jsのredirectをモック
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('guestLogin', () => {
  const mockSignInWithPassword = jest.fn();
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    });
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
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
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
    expect(mockSignInWithPassword).not.toHaveBeenCalled();

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
    expect(mockSignInWithPassword).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('環境変数が設定されている場合、ゲストユーザーでログインする', async () => {
    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    process.env.GUEST_USER_PASSWORD = 'guestpass123';

    mockSignInWithPassword.mockResolvedValue({ error: null });

    await guestLogin();

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'guest@example.com',
      password: 'guestpass123',
    });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('ログインに失敗した場合、エラーログを出力して早期リターンする', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    process.env.GUEST_USER_EMAIL = 'guest@example.com';
    process.env.GUEST_USER_PASSWORD = 'wrongpassword';

    const error = { message: 'Invalid login credentials' };
    mockSignInWithPassword.mockResolvedValue({ error });

    await guestLogin();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'ゲストログインエラー:',
      'Invalid login credentials'
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
