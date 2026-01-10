'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

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
    const currentUserClient = await createClient();
    const {
      data: { user: currentUser },
    } = await currentUserClient.auth.getUser();

    if (!currentUser) {
      return { error: '認証エラーが発生しました' };
    }

    // 自分自身のロールは変更できない
    if (currentUser.id === userId && role) {
      const currentUserData = await prisma.user.findUnique({
        where: { id: currentUser.id },
        select: { role: true },
      });

      if (currentUserData && currentUserData.role !== role) {
        return { error: '自分自身のロールは変更できません' };
      }
    }

    const supabase = createAdminClient();

    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      { email }
    );

    if (authError) {
      console.error('メールアドレス更新エラー:', authError.message);
      return { error: 'メールアドレスの更新に失敗しました' };
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

  if (newPassword !== confirmPassword) {
    return { error: 'パスワードが一致しません' };
  }

  try {
    // 現在のユーザーを取得
    const currentUserClient = await createClient();
    const {
      data: { user: currentUser },
    } = await currentUserClient.auth.getUser();

    if (!currentUser) {
      return { error: '認証エラーが発生しました' };
    }

    // 自分自身のパスワードを変更する場合は通常のAPIを使用
    if (currentUser.id === userId) {
      const { error } = await currentUserClient.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('パスワード更新エラー:', error.message);
        return { error: 'パスワードの更新に失敗しました' };
      }
    } else {
      // 他のユーザーのパスワードを変更する場合はAdmin APIを使用
      const adminClient = createAdminClient();
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        console.error('パスワード更新エラー:', error.message);
        return { error: 'パスワードの更新に失敗しました' };
      }
    }

    revalidatePath('/users');
    return { success: true };
  } catch (error) {
    console.error('パスワード更新エラー:', error);
    return { error: 'パスワードの更新に失敗しました' };
  }
}
