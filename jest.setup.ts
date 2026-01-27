// console.errorをモック化してテスト出力をクリーンに保つ
global.console = {
  ...console,
  error: jest.fn(),
};

// next/cacheのモック化（全テストで共通）
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// next-authのモック化（全テストで共通）
jest.mock('next-auth', () => ({
  AuthError: class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  },
}));

// next-auth providersのモック化
jest.mock('next-auth/providers/credentials', () => ({
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
  })),
}));

// lib/auth-configのモック化
jest.mock('@/lib/auth-config', () => ({
  handlers: { GET: jest.fn(), POST: jest.fn() },
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: jest.fn(),
}));
