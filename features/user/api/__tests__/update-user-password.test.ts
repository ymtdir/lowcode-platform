import { updateUserPassword } from '../update-user';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// bcryptをモック化
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

// Prismaクライアントをモック化
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}));

// lib/authをモック化
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

import { prisma } from '@/lib/prisma';

describe('updateUserPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    // デフォルトで認証済みユーザーを設定
    (requireAuth as jest.Mock).mockResolvedValue({
      id: 'current-user',
      email: 'user@example.com',
      name: 'テストユーザー',
      role: 'MEMBER' as const,
    });
  });

  it('自分自身のパスワードを更新できる', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: userId,
    });

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { password: 'hashed-password' },
    });
  });

  it('他のユーザーのパスワードを更新できる', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    (prisma.user.update as jest.Mock).mockResolvedValue({
      id: userId,
    });

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({ success: true });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { password: 'hashed-password' },
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
    expect(requireAuth).not.toHaveBeenCalled();
  });

  it('認証エラーの場合はエラーを返す', async () => {
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    // requireAuthがエラーを投げると、catch(() => null)でnullが返される
    (requireAuth as jest.Mock).mockRejectedValue(new Error('認証エラー'));

    const result = await updateUserPassword('user-1', {}, formData);

    expect(result).toEqual({
      error: '認証エラーが発生しました',
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('自分自身のパスワード更新でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error('Update failed')
    );

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({
      error: 'パスワードの更新に失敗しました',
    });
  });

  it('他ユーザーのパスワード更新でエラーが発生した場合はエラーを返す', async () => {
    const userId = 'user-1';
    const formData = new FormData();
    formData.append('newPassword', 'newpassword123');
    formData.append('confirmPassword', 'newpassword123');

    (prisma.user.update as jest.Mock).mockRejectedValue(
      new Error('Update failed')
    );

    const result = await updateUserPassword(userId, {}, formData);

    expect(result).toEqual({
      error: 'パスワードの更新に失敗しました',
    });
  });
});
