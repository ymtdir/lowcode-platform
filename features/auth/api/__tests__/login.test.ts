import { login } from '../login';
import { signIn } from '@/lib/auth-config';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

jest.mock('@/lib/auth-config', () => ({
  signIn: jest.fn(),
}));

describe('login', () => {
  const mockFormData = new FormData();
  mockFormData.append('email', 'test@example.com');
  mockFormData.append('password', 'password123');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正しい認証情報でログインできる', async () => {
    (signIn as jest.Mock).mockResolvedValue({ ok: true });

    await expect(login({}, mockFormData)).rejects.toThrow('NEXT_REDIRECT');

    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout');
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('誤った認証情報の場合はエラーを返す（AuthError経由）', async () => {
    const authError = new AuthError('Invalid credentials');
    (signIn as jest.Mock).mockRejectedValue(authError);

    const result = await login({}, mockFormData);

    expect(result).toEqual({
      error: 'メールアドレスまたはパスワードが正しくありません',
    });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('メールアドレスが存在しない場合はエラーを返す（AuthError経由）', async () => {
    const authError = new AuthError('Email not found');
    (signIn as jest.Mock).mockRejectedValue(authError);

    const result = await login({}, mockFormData);

    expect(result).toEqual({
      error: 'メールアドレスまたはパスワードが正しくありません',
    });
  });

  it('ネットワークエラーの場合はエラーを返す', async () => {
    (signIn as jest.Mock).mockRejectedValue(new Error('Network error'));

    const result = await login({}, mockFormData);

    expect(result).toEqual({
      error: 'ログインに失敗しました',
    });
  });
});
