import { updateUserPassword } from '../update-user';

// モック関数を定義
const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockUpdateUserById = jest.fn();

// Supabase Server Clientをモック化
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
      updateUser: mockUpdateUser,
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

describe('updateUserPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('自分自身のパスワードを更新できる', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId },
      },
    });

    mockUpdateUser.mockResolvedValue({
      error: null,
    });

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'newpassword123',
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('他のユーザーのパスワードを更新できる', async () => {
    const userId = 'user-1';
    const currentUserId = 'current-user';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: currentUserId },
      },
    });

    mockUpdateUserById.mockResolvedValue({
      error: null,
    });

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(mockUpdateUserById).toHaveBeenCalledWith(userId, {
      password: 'newpassword123',
    });
  });

  it('パスワードが一致しない場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('newPassword', 'password123');
    formData.append('confirmPassword', 'different');

    const result = await updateUserPassword('user-1', {}, formData);

    expect(result).toEqual({
      error: 'パスワードが一致しません',
    });
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('認証エラーの場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    mockGetUser.mockResolvedValue({
      data: { user: null },
    });

    const result = await updateUserPassword('user-1', {}, formData);

    expect(result).toEqual({
      error: '認証エラーが発生しました',
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it('自分自身のパスワード更新でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: userId },
      },
    });

    mockUpdateUser.mockResolvedValue({
      error: { message: 'Update failed' },
    });

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({
      error: 'パスワードの更新に失敗しました',
    });
  });

  it('他ユーザーのパスワード更新でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const currentUserId = 'current-user';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    mockGetUser.mockResolvedValue({
      data: {
        user: { id: currentUserId },
      },
    });

    mockUpdateUserById.mockResolvedValue({
      error: { message: 'Update failed' },
    });

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({
      error: 'パスワードの更新に失敗しました',
    });
  });
});
