'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { canManageUsers } from '@/lib/permissions';
import { requireAuth } from '@/lib/auth';

type FormState = {
  error?: string;
  success?: boolean;
};

/**
 * ユーザーを作成するServer Action
 * ADMINロールのみ実行可能
 */
export async function createUser(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // 認証チェック
  const currentUser = await requireAuth().catch(() => null);

  if (!currentUser) {
    return { error: '認証が必要です' };
  }

  // 権限チェック
  if (!canManageUsers(currentUser.role)) {
    return { error: 'この操作を行う権限がありません' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const role = formData.get('role') as string;

  if (!name || name.trim() === '') {
    return { error: '名前を入力してください' };
  }

  if (!email || email.trim() === '') {
    return { error: 'メールアドレスを入力してください' };
  }

  if (!password || password.length < 6) {
    return { error: 'パスワードは6文字以上で入力してください' };
  }

  if (password !== confirmPassword) {
    return { error: 'パスワードが一致しません' };
  }

  // ロールのバリデーション
  if (role && !['ADMIN', 'DEVELOPER', 'MEMBER'].includes(role)) {
    return { error: '無効なロールが指定されました' };
  }

  try {
    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'このメールアドレスは既に使用されています' };
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザー作成
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: (role as 'ADMIN' | 'DEVELOPER' | 'MEMBER') || 'MEMBER',
      },
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    return { error: 'ユーザーの作成に失敗しました' };
  }
}
