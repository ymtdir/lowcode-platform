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
