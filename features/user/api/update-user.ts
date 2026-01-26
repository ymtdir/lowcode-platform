'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * ユーザーのプロフィールを更新するServer Action
 */
export async function updateUserProfile(
  userId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;

  if (!name || name.trim() === '') {
    return { error: '名前を入力してください' };
  }

  if (!email || !email.includes('@')) {
    return { error: '有効なメールアドレスを入力してください' };
  }

  // ロールのバリデーション
  if (role && !['ADMIN', 'DEVELOPER', 'MEMBER'].includes(role)) {
    return { error: '無効なロールが指定されました' };
  }

  try {
    // 現在のユーザーを取得
    const currentUser = await requireAuth().catch(() => null);

    if (!currentUser) {
      return { error: '認証エラーが発生しました' };
    }

    // 自分自身のロールは変更できない
    if (currentUser.id === userId && role) {
      if (currentUser.role !== role) {
        return { error: '自分自身のロールは変更できません' };
      }
    }

    // メールアドレスの重複チェック（自分以外）
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return { error: 'このメールアドレスは既に使用されています' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        ...(role && { role: role as 'ADMIN' | 'DEVELOPER' | 'MEMBER' }),
      },
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('ユーザー情報更新エラー:', error);
    return { error: 'ユーザー情報の更新に失敗しました' };
  }
}

/**
 * ユーザーのパスワードを更新するServer Action
 */
export async function updateUserPassword(
  userId: string,
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!newPassword || newPassword.length < 6) {
    return { error: 'パスワードは6文字以上で入力してください' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'パスワードが一致しません' };
  }

  try {
    // 現在のユーザーを取得
    const currentUser = await requireAuth().catch(() => null);

    if (!currentUser) {
      return { error: '認証エラーが発生しました' };
    }

    // パスワードをハッシュ化して更新
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('パスワード更新エラー:', error);
    return { error: 'パスワードの更新に失敗しました' };
  }
}
