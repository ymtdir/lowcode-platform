import { updateUserProfile } from '../update-user';

// モック関数を定義
const mockUpdateUserById = jest.fn();
const mockGetUser = jest.fn();

// Supabase Server Clientをモック化
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Supabase Admin Clientをモック化
jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: jest.fn(() => ({
    auth: {
      admin: {
        updateUserById: mockUpdateUserById,
      },
    },
  })),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('updateUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトで別のユーザーとして認証
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'current-user-id' } },
    });
  });

  it('ユーザー情報を更新できる', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('name', '更新されたユーザー');
    formData.append('email', 'updated@example.com');
    formData.append('role', 'ADMIN');

    mockUpdateUserById.mockResolvedValue({
      error: null,
    });

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: userId,
      name: '更新されたユーザー',
      email: 'updated@example.com',
      role: 'ADMIN',
    });

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUserById).toHaveBeenCalledWith(userId, {
      email: 'updated@example.com',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: {
        name: '更新されたユーザー',
        email: 'updated@example.com',
        role: 'ADMIN',
      },
    });
  });

  it('名前が空の場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', '');
    formData.append('email', 'test@example.com');

    const result = await updateUserProfile('user-1', {}, formData);

    expect(result).toEqual({
      error: '名前を入力してください',
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('無効なメールアドレスの場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'invalid-email');

    const result = await updateUserProfile('user-1', {}, formData);

    expect(result).toEqual({
      error: '有効なメールアドレスを入力してください',
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('無効なロールが指定された場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('role', 'INVALID_ROLE');

    const result = await updateUserProfile('user-1', {}, formData);

    expect(result).toEqual({
      error: '無効なロールが指定されました',
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('自分自身のロールは変更できない', async () => {
    const userId = 'current-user-id';
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');
    formData.append('role', 'MEMBER');

    // 現在のユーザーとして認証
    mockGetUser.mockResolvedValue({
      data: { user: { id: userId } },
    });

    // 現在のロールをADMINとして設定
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      role: 'ADMIN',
    });

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: '自分自身のロールは変更できません',
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('Supabase Auth でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');

    mockUpdateUserById.mockResolvedValue({
      error: { message: 'Update failed' },
    });

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: 'メールアドレスの更新に失敗しました',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('Prisma でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('name', 'テストユーザー');
    formData.append('email', 'test@example.com');

    mockUpdateUserById.mockResolvedValue({
      error: null,
    });

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const result = await updateUserProfile(userId, {}, formData);

    expect(result).toEqual({
      error: 'ユーザー情報の更新に失敗しました',
    });
  });
});
